import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  ReservationStatus,
  RoomStatus,
  type Room,
} from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedResponseDto } from '../../common/dto';
import { PrismaService } from '../../database/prisma.service';
import {
  CreateMultiRoomReservationDto,
  FilterMultiRoomReservationDto,
} from './dto';

const summaryInclude = {
  customer: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
    },
  },
  reservations: {
    where: { deletedAt: null },
    include: {
      room: {
        select: {
          id: true,
          number: true,
          type: true,
          pricePerNight: true,
          capacity: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} as const;

const detailInclude = {
  customer: true,
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
    },
  },
  reservations: {
    where: { deletedAt: null },
    include: {
      room: true,
      checkInOut: true,
      reservationServices: {
        include: {
          service: true,
        },
      },
    },
    orderBy: { createdAt: 'asc' },
  },
} as const;

type MultiRoomReservationSummary = Prisma.MultiRoomReservationGetPayload<{
  include: typeof summaryInclude;
}>;

type MultiRoomReservationDetail = Prisma.MultiRoomReservationGetPayload<{
  include: typeof detailInclude;
}>;

type PrismaExecutor = Prisma.TransactionClient | PrismaService;

@Injectable()
export class MultiRoomReservationsService {
  private readonly logger = new Logger(MultiRoomReservationsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    createMultiRoomReservationDto: CreateMultiRoomReservationDto,
    employeeId?: string,
  ) {
    const { customerId, checkInDate, checkOutDate, rooms, notes } =
      createMultiRoomReservationDto;
    const { startDate, endDate } = this.validateDateRange(
      checkInDate,
      checkOutDate,
    );
    const roomIds = rooms.map((room) => room.roomId);
    const uniqueRoomIds = [...new Set(roomIds)];

    if (uniqueRoomIds.length !== roomIds.length) {
      throw new BadRequestException(
        'A room can only appear once in a multi-room reservation',
      );
    }

    const createdReservation = await this.prisma.$transaction(
      async (tx) => {
        const customer = await tx.customer.findFirst({
          where: { id: customerId, deletedAt: null },
        });

        if (!customer) {
          throw new NotFoundException(
            `Customer with ID ${customerId} not found`,
          );
        }

        const dbRooms = await tx.room.findMany({
          where: {
            id: { in: uniqueRoomIds },
            deletedAt: null,
          },
        });

        if (dbRooms.length !== uniqueRoomIds.length) {
          const foundIds = new Set(dbRooms.map((room) => room.id));
          const missingIds = uniqueRoomIds.filter(
            (roomId) => !foundIds.has(roomId),
          );
          throw new NotFoundException(
            `Rooms not found: ${missingIds.join(', ')}`,
          );
        }

        const roomsById = new Map(dbRooms.map((room) => [room.id, room]));

        for (const roomRequest of rooms) {
          const room = roomsById.get(roomRequest.roomId)!;
          this.validateRoomCapacity(
            room,
            roomRequest.adults ?? 1,
            roomRequest.children ?? 0,
          );
        }

        await this.assertRoomsAvailability(
          tx,
          uniqueRoomIds,
          startDate,
          endDate,
        );

        const multiRoomReservation = await tx.multiRoomReservation.create({
          data: {
            reservationCode: this.generateReservationCode('MRES'),
            customerId,
            checkInDate: startDate,
            checkOutDate: endDate,
            notes,
            createdById: employeeId,
          },
        });

        for (const roomRequest of rooms) {
          const room = roomsById.get(roomRequest.roomId)!;
          await tx.reservation.create({
            data: {
              reservationCode: this.generateReservationCode('RES'),
              customerId,
              multiRoomReservationId: multiRoomReservation.id,
              roomId: room.id,
              checkInDate: startDate,
              checkOutDate: endDate,
              adults: roomRequest.adults ?? 1,
              children: roomRequest.children ?? 0,
              totalAmount: this.calculateTotalAmount(
                Number(room.pricePerNight),
                startDate,
                endDate,
              ),
              notes: roomRequest.notes,
              createdById: employeeId,
              status: ReservationStatus.PENDING,
            },
          });
        }

        return this.getMultiRoomReservationOrThrow(
          tx,
          multiRoomReservation.id,
          detailInclude,
        );
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      },
    );

    this.logger.log(
      `Multi-room reservation created: ${createdReservation.reservationCode}`,
    );

    return this.serializeDetail(createdReservation);
  }

  async findAll(filterDto: FilterMultiRoomReservationDto) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      customerId,
      roomId,
      checkInFrom,
      checkInTo,
      checkOutFrom,
      checkOutTo,
    } = filterDto;

    const where: Prisma.MultiRoomReservationWhereInput = {
      deletedAt: null,
    };

    if (customerId) where.customerId = customerId;
    if (roomId) where.reservations = { some: { roomId, deletedAt: null } };

    if (checkInFrom || checkInTo) {
      where.checkInDate = {};
      if (checkInFrom) where.checkInDate.gte = new Date(checkInFrom);
      if (checkInTo) where.checkInDate.lte = new Date(checkInTo);
    }

    if (checkOutFrom || checkOutTo) {
      where.checkOutDate = {};
      if (checkOutFrom) where.checkOutDate.gte = new Date(checkOutFrom);
      if (checkOutTo) where.checkOutDate.lte = new Date(checkOutTo);
    }

    if (search) {
      where.OR = [
        { reservationCode: { contains: search, mode: 'insensitive' } },
        { customer: { firstName: { contains: search, mode: 'insensitive' } } },
        { customer: { lastName: { contains: search, mode: 'insensitive' } } },
        { customer: { email: { contains: search, mode: 'insensitive' } } },
        {
          reservations: {
            some: {
              deletedAt: null,
              room: {
                number: { contains: search, mode: 'insensitive' },
              },
            },
          },
        },
      ];
    }

    const [reservations, total] = await Promise.all([
      this.prisma.multiRoomReservation.findMany({
        where,
        skip: filterDto.skip,
        take: filterDto.take,
        orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        include: summaryInclude,
      }),
      this.prisma.multiRoomReservation.count({ where }),
    ]);

    return new PaginatedResponseDto(
      reservations.map((reservation) => this.serializeSummary(reservation)),
      total,
      page ?? 1,
      limit ?? 10,
    );
  }

  async findOne(id: string) {
    const reservation = await this.getMultiRoomReservationOrThrow(
      this.prisma,
      id,
      detailInclude,
    );

    return this.serializeDetail(reservation);
  }

  async findByCode(code: string) {
    const reservation = await this.prisma.multiRoomReservation.findFirst({
      where: { reservationCode: code, deletedAt: null },
      include: detailInclude,
    });

    if (!reservation) {
      throw new NotFoundException(
        `Multi-room reservation with code ${code} not found`,
      );
    }

    return this.serializeDetail(reservation);
  }

  async confirm(id: string) {
    const reservation = await this.getMultiRoomReservationOrThrow(
      this.prisma,
      id,
      detailInclude,
    );

    if (
      reservation.reservations.some(
        (item) => item.status !== ReservationStatus.PENDING,
      )
    ) {
      throw new BadRequestException(
        'Only multi-room reservations with all child reservations pending can be confirmed',
      );
    }

    const confirmedReservation = await this.prisma.$transaction(async (tx) => {
      await tx.reservation.updateMany({
        where: {
          multiRoomReservationId: id,
          deletedAt: null,
          status: ReservationStatus.PENDING,
        },
        data: { status: ReservationStatus.CONFIRMED },
      });

      await tx.room.updateMany({
        where: {
          id: { in: reservation.reservations.map((item) => item.roomId) },
        },
        data: { status: RoomStatus.RESERVED },
      });

      return this.getMultiRoomReservationOrThrow(tx, id, detailInclude);
    });

    this.logger.log(
      `Multi-room reservation confirmed: ${reservation.reservationCode}`,
    );

    return this.serializeDetail(confirmedReservation);
  }

  async cancel(id: string, reason?: string) {
    const reservation = await this.getMultiRoomReservationOrThrow(
      this.prisma,
      id,
      detailInclude,
    );

    if (
      reservation.reservations.some(
        (item) =>
          item.status === ReservationStatus.CHECKED_IN ||
          item.status === ReservationStatus.CHECKED_OUT,
      )
    ) {
      throw new BadRequestException(
        'Cannot cancel a multi-room reservation with checked-in or checked-out child reservations',
      );
    }

    const cancellableReservations = reservation.reservations.filter(
      (item) =>
        item.status === ReservationStatus.PENDING ||
        item.status === ReservationStatus.CONFIRMED,
    );

    if (!cancellableReservations.length) {
      throw new BadRequestException(
        'No child reservations can be cancelled for this multi-room reservation',
      );
    }

    const cancelledReservation = await this.prisma.$transaction(async (tx) => {
      for (const item of cancellableReservations) {
        await tx.reservation.update({
          where: { id: item.id },
          data: {
            status: ReservationStatus.CANCELLED,
            notes: reason
              ? `${item.notes || ''}${item.notes ? '\n' : ''}Cancellation reason: ${reason}`
              : item.notes,
          },
        });
      }

      await tx.room.updateMany({
        where: {
          id: { in: cancellableReservations.map((item) => item.roomId) },
          status: RoomStatus.RESERVED,
        },
        data: { status: RoomStatus.AVAILABLE },
      });

      return this.getMultiRoomReservationOrThrow(tx, id, detailInclude);
    });

    this.logger.log(
      `Multi-room reservation cancelled: ${reservation.reservationCode}`,
    );

    return this.serializeDetail(cancelledReservation);
  }

  async remove(id: string) {
    const reservation = await this.getMultiRoomReservationOrThrow(
      this.prisma,
      id,
      detailInclude,
    );

    await this.prisma.$transaction(async (tx) => {
      const deletedAt = new Date();

      await tx.reservation.updateMany({
        where: { multiRoomReservationId: id, deletedAt: null },
        data: { deletedAt },
      });

      await tx.multiRoomReservation.update({
        where: { id },
        data: { deletedAt },
      });
    });

    this.logger.log(
      `Multi-room reservation soft deleted: ${reservation.reservationCode}`,
    );

    return { message: 'Multi-room reservation deleted successfully' };
  }

  private async assertRoomsAvailability(
    tx: Prisma.TransactionClient,
    roomIds: string[],
    startDate: Date,
    endDate: Date,
  ) {
    const overlappingReservations = await tx.reservation.findMany({
      where: {
        roomId: { in: roomIds },
        deletedAt: null,
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
          ],
        },
        OR: [
          {
            checkInDate: { gte: startDate, lt: endDate },
          },
          {
            checkOutDate: { gt: startDate, lte: endDate },
          },
          {
            AND: [
              { checkInDate: { lte: startDate } },
              { checkOutDate: { gte: endDate } },
            ],
          },
        ],
      },
      include: {
        room: {
          select: {
            number: true,
          },
        },
      },
    });

    if (!overlappingReservations.length) {
      return;
    }

    const conflictingRooms = [
      ...new Set(overlappingReservations.map((item) => item.room.number)),
    ];
    throw new ConflictException(
      `Rooms not available for the selected dates: ${conflictingRooms.join(', ')}`,
    );
  }

  private validateRoomCapacity(room: Room, adults: number, children: number) {
    const totalGuests = adults + children;

    if (totalGuests > room.capacity) {
      throw new BadRequestException(
        `Room ${room.number} capacity is ${room.capacity}, but ${totalGuests} guests were requested`,
      );
    }
  }

  private validateDateRange(checkInDate: string, checkOutDate: string) {
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);

    if (startDate >= endDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }

    const startDay = Date.UTC(
      startDate.getUTCFullYear(),
      startDate.getUTCMonth(),
      startDate.getUTCDate(),
    );
    const now = new Date();
    const todayUtc = Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate(),
    );

    if (startDay < todayUtc) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }

    return { startDate, endDate };
  }

  private calculateTotalAmount(
    pricePerNight: number,
    startDate: Date,
    endDate: Date,
  ) {
    const nights = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    return pricePerNight * nights;
  }

  private generateReservationCode(prefix: 'RES' | 'MRES') {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().substring(0, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private async getMultiRoomReservationOrThrow<
    TInclude extends Prisma.MultiRoomReservationInclude,
  >(prisma: PrismaExecutor, id: string, include: TInclude) {
    const reservation = await prisma.multiRoomReservation.findFirst({
      where: { id, deletedAt: null },
      include,
    });

    if (!reservation) {
      throw new NotFoundException(
        `Multi-room reservation with ID ${id} not found`,
      );
    }

    return reservation;
  }

  private serializeSummary(reservation: MultiRoomReservationSummary) {
    return {
      ...reservation,
      roomsCount: reservation.reservations.length,
      totalAmount: reservation.reservations.reduce(
        (total, item) => total + Number(item.totalAmount),
        0,
      ),
      status: this.resolveStatus(
        reservation.reservations.map((item) => item.status),
      ),
    };
  }

  private serializeDetail(reservation: MultiRoomReservationDetail) {
    return {
      ...reservation,
      roomsCount: reservation.reservations.length,
      totalAmount: reservation.reservations.reduce(
        (total, item) => total + Number(item.totalAmount),
        0,
      ),
      status: this.resolveStatus(
        reservation.reservations.map((item) => item.status),
      ),
    };
  }

  private resolveStatus(statuses: ReservationStatus[]) {
    if (statuses.every((status) => status === ReservationStatus.CANCELLED)) {
      return ReservationStatus.CANCELLED;
    }

    if (statuses.every((status) => status === ReservationStatus.CHECKED_OUT)) {
      return ReservationStatus.CHECKED_OUT;
    }

    if (statuses.every((status) => status === ReservationStatus.NO_SHOW)) {
      return ReservationStatus.NO_SHOW;
    }

    if (statuses.some((status) => status === ReservationStatus.CHECKED_IN)) {
      return ReservationStatus.CHECKED_IN;
    }

    if (statuses.some((status) => status === ReservationStatus.CONFIRMED)) {
      return ReservationStatus.CONFIRMED;
    }

    return ReservationStatus.PENDING;
  }
}
