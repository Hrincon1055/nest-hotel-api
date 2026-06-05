import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CleaningStatus, ReservationStatus, RoomStatus } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { PaginatedResponseDto } from '../../common/dto';
import { PrismaService } from '../../database/prisma.service';
import {
  CheckInDto,
  CheckOutDto,
  CreateReservationDto,
  FilterReservationDto,
  UpdateReservationDto,
} from './dto';

@Injectable()
export class ReservationsService {
  private readonly logger = new Logger(ReservationsService.name);
  constructor(private readonly prisma: PrismaService) {}
  async create(
    createReservationDto: CreateReservationDto,
    employeeId?: string,
  ) {
    const {
      customerId,
      roomId,
      checkInDate,
      checkOutDate,
      adults,
      children,
      notes,
    } = createReservationDto;
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
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, deletedAt: null },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${customerId} not found`);
    }
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
    });

    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }
    const totalGuests = (adults || 1) + (children || 0);
    if (totalGuests > room.capacity) {
      throw new BadRequestException(
        `Room capacity is ${room.capacity}, but ${totalGuests} guests requested`,
      );
    }
    const overlappingReservation = await this.prisma.reservation.findFirst({
      where: {
        roomId,
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
    });
    if (overlappingReservation) {
      throw new ConflictException(
        'Room is not available for the selected dates',
      );
    }
    const nights = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    const totalAmount = Number(room.pricePerNight) * nights;
    const reservationCode = this.generateReservationCode();
    const reservation = await this.prisma.reservation.create({
      data: {
        reservationCode,
        customerId,
        roomId,
        checkInDate: startDate,
        checkOutDate: endDate,
        adults: adults || 1,
        children: children || 0,
        totalAmount,
        notes,
        createdById: employeeId,
        status: ReservationStatus.PENDING,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            type: true,
            pricePerNight: true,
          },
        },
      },
    });
    this.logger.log(`Reservation created: ${reservation.reservationCode}`);
    return reservation;
  }

  async findAll(filterDto: FilterReservationDto) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      status,
      customerId,
      roomId,
      checkInFrom,
      checkInTo,
      checkOutFrom,
      checkOutTo,
    } = filterDto;
    const where: any = {
      deletedAt: null,
    };
    if (status) where.status = status;
    if (customerId) where.customerId = customerId;
    if (roomId) where.roomId = roomId;
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
        { room: { number: { contains: search, mode: 'insensitive' } } },
      ];
    }
    const [reservations, total] = await Promise.all([
      this.prisma.reservation.findMany({
        where,
        skip: filterDto.skip,
        take: filterDto.take,
        orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          room: {
            select: {
              id: true,
              number: true,
              type: true,
            },
          },
        },
      }),
      this.prisma.reservation.count({ where }),
    ]);
    return new PaginatedResponseDto(
      reservations,
      total,
      page ?? 1,
      limit ?? 10,
    );
  }

  async findOne(id: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { id, deletedAt: null },
      include: {
        customer: true,
        room: true,
        checkInOut: true,
        reservationServices: {
          include: {
            service: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with ID ${id} not found`);
    }
    return reservation;
  }

  async findByCode(code: string) {
    const reservation = await this.prisma.reservation.findFirst({
      where: { reservationCode: code, deletedAt: null },
      include: {
        customer: true,
        room: true,
        checkInOut: true,
        reservationServices: {
          include: {
            service: true,
          },
        },
      },
    });
    if (!reservation) {
      throw new NotFoundException(`Reservation with code ${code} not found`);
    }
    return reservation;
  }

  async update(id: string, updateReservationDto: UpdateReservationDto) {
    const reservation = await this.findOne(id);
    if (
      reservation.status === ReservationStatus.CHECKED_IN ||
      reservation.status === ReservationStatus.CHECKED_OUT ||
      reservation.status === ReservationStatus.CANCELLED ||
      reservation.status === ReservationStatus.NO_SHOW
    ) {
      throw new BadRequestException(
        `Cannot update reservation with status ${reservation.status}`,
      );
    }
    const { checkInDate, checkOutDate, ...rest } = updateReservationDto;
    const data: any = { ...rest };
    if (checkInDate || checkOutDate) {
      const startDate = new Date(checkInDate || reservation.checkInDate);
      const endDate = new Date(checkOutDate || reservation.checkOutDate);
      if (startDate >= endDate) {
        throw new BadRequestException(
          'Check-out date must be after check-in date',
        );
      }
      const overlapping = await this.prisma.reservation.findFirst({
        where: {
          id: { not: id },
          roomId: reservation.roomId,
          deletedAt: null,
          status: {
            in: [
              ReservationStatus.PENDING,
              ReservationStatus.CONFIRMED,
              ReservationStatus.CHECKED_IN,
            ],
          },
          OR: [
            { checkInDate: { gte: startDate, lt: endDate } },
            { checkOutDate: { gt: startDate, lte: endDate } },
            {
              AND: [
                { checkInDate: { lte: startDate } },
                { checkOutDate: { gte: endDate } },
              ],
            },
          ],
        },
      });
      if (overlapping) {
        throw new ConflictException('Room is not available for the new dates');
      }
      data.checkInDate = startDate;
      data.checkOutDate = endDate;
      const nights = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      data.totalAmount = Number(reservation.room.pricePerNight) * nights;
    }

    const updated = await this.prisma.reservation.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            type: true,
          },
        },
      },
    });
    this.logger.log(`Reservation updated: ${updated.reservationCode}`);
    return updated;
  }

  async confirm(id: string) {
    const reservation = await this.findOne(id);
    if (reservation.status !== ReservationStatus.PENDING) {
      throw new BadRequestException(
        'Only pending reservations can be confirmed',
      );
    }
    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CONFIRMED },
    });
    await this.prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: RoomStatus.RESERVED },
    });
    this.logger.log(`Reservation confirmed: ${reservation.reservationCode}`);
    return updated;
  }

  async checkIn(id: string, checkInDto: CheckInDto, employeeId: string) {
    const reservation = await this.findOne(id);
    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Only pending or confirmed reservations can be checked in',
      );
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkInDate = new Date(reservation.checkInDate);
    checkInDate.setHours(0, 0, 0, 0);
    if (checkInDate > today) {
      throw new BadRequestException(
        'Cannot check in before the scheduled date',
      );
    }
    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CHECKED_IN },
      include: {
        customer: true,
        room: true,
      },
    });
    await this.prisma.checkInOut.upsert({
      where: { reservationId: id },
      create: {
        reservationId: id,
        roomId: reservation.roomId,
        checkInTime: new Date(),
        checkInEmployeeId: employeeId,
        notes: checkInDto.notes,
      },
      update: {
        checkInTime: new Date(),
        checkInEmployeeId: employeeId,
        notes: checkInDto.notes,
      },
    });
    await this.prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: RoomStatus.OCCUPIED },
    });
    this.logger.log(
      `Check-in completed for reservation: ${reservation.reservationCode}`,
    );
    return updated;
  }

  async checkOut(id: string, checkOutDto: CheckOutDto, employeeId: string) {
    const reservation = await this.findOne(id);
    if (reservation.status !== ReservationStatus.CHECKED_IN) {
      throw new BadRequestException(
        'Only checked-in reservations can be checked out',
      );
    }
    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.CHECKED_OUT },
      include: {
        customer: true,
        room: true,
      },
    });
    await this.prisma.checkInOut.update({
      where: { reservationId: id },
      data: {
        checkOutTime: new Date(),
        checkOutEmployeeId: employeeId,
        notes: checkOutDto.notes
          ? `${reservation.checkInOut?.notes || ''}\nCheckout: ${checkOutDto.notes}`
          : reservation.checkInOut?.notes,
      },
    });
    await this.prisma.room.update({
      where: { id: reservation.roomId },
      data: { status: RoomStatus.CLEANING },
    });
    await this.prisma.cleaningTask.create({
      data: {
        roomId: reservation.roomId,
        status: CleaningStatus.PENDING,
        scheduledDate: new Date(),
        priority: 1,
        notes: `Post checkout cleaning - Room ${reservation.room.number}`,
      },
    });
    this.logger.log(
      `Check-out completed for reservation: ${reservation.reservationCode}`,
    );
    return updated;
  }

  async cancel(id: string, reason?: string) {
    const reservation = await this.findOne(id);
    if (
      reservation.status === ReservationStatus.CHECKED_IN ||
      reservation.status === ReservationStatus.CHECKED_OUT ||
      reservation.status === ReservationStatus.CANCELLED
    ) {
      throw new BadRequestException(
        `Cannot cancel reservation with status ${reservation.status}`,
      );
    }
    const updated = await this.prisma.reservation.update({
      where: { id },
      data: {
        status: ReservationStatus.CANCELLED,
        notes: reason
          ? `${reservation.notes || ''}\nCancellation reason: ${reason}`
          : reservation.notes,
      },
    });
    if (reservation.room.status === RoomStatus.RESERVED) {
      await this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });
    }
    this.logger.log(`Reservation cancelled: ${reservation.reservationCode}`);
    return updated;
  }

  async markNoShow(id: string) {
    const reservation = await this.findOne(id);
    if (
      reservation.status !== ReservationStatus.PENDING &&
      reservation.status !== ReservationStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Only pending or confirmed reservations can be marked as no-show',
      );
    }
    const updated = await this.prisma.reservation.update({
      where: { id },
      data: { status: ReservationStatus.NO_SHOW },
    });
    if (reservation.room.status === RoomStatus.RESERVED) {
      await this.prisma.room.update({
        where: { id: reservation.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });
    }
    this.logger.log(
      `Reservation marked as no-show: ${reservation.reservationCode}`,
    );
    return updated;
  }

  async remove(id: string) {
    const reservation = await this.findOne(id);
    await this.prisma.reservation.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.log(`Reservation soft deleted: ${reservation.reservationCode}`);
    return { message: 'Reservation deleted successfully' };
  }

  async getTodayArrivals() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.prisma.reservation.findMany({
      where: {
        deletedAt: null,
        checkInDate: {
          gte: today,
          lt: tomorrow,
        },
        status: {
          in: [ReservationStatus.PENDING, ReservationStatus.CONFIRMED],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            type: true,
          },
        },
      },
      orderBy: { checkInDate: 'asc' },
    });
  }

  async getTodayDepartures() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.prisma.reservation.findMany({
      where: {
        deletedAt: null,
        checkOutDate: {
          gte: today,
          lt: tomorrow,
        },
        status: ReservationStatus.CHECKED_IN,
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        room: {
          select: {
            id: true,
            number: true,
            type: true,
          },
        },
      },
      orderBy: { checkOutDate: 'asc' },
    });
  }

  private generateReservationCode(): string {
    const prefix = 'RES';
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = uuidv4().substring(0, 4).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }
}
