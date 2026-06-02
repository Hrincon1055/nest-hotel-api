import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus, RoomStatus, RoomType } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto';
import { PrismaService } from '../../database/prisma.service';
import {
  CheckAvailabilityDto,
  CreateRoomDto,
  FilterRoomDto,
  UpdateRoomDto,
} from './dto';

// Mapeo de términos de búsqueda en español a valores de enum
const ROOM_TYPE_SEARCH_MAP: Record<string, RoomType> = {
  individual: RoomType.SINGLE,
  single: RoomType.SINGLE,
  doble: RoomType.DOUBLE,
  double: RoomType.DOUBLE,
  twin: RoomType.TWIN,
  gemela: RoomType.TWIN,
  suite: RoomType.SUITE,
  deluxe: RoomType.DELUXE,
  lujo: RoomType.DELUXE,
  presidencial: RoomType.PRESIDENTIAL,
  presidential: RoomType.PRESIDENTIAL,
  familiar: RoomType.FAMILY,
  family: RoomType.FAMILY,
  familia: RoomType.FAMILY,
};

const ROOM_STATUS_SEARCH_MAP: Record<string, RoomStatus> = {
  disponible: RoomStatus.AVAILABLE,
  available: RoomStatus.AVAILABLE,
  ocupada: RoomStatus.OCCUPIED,
  ocupado: RoomStatus.OCCUPIED,
  occupied: RoomStatus.OCCUPIED,
  reservada: RoomStatus.RESERVED,
  reservado: RoomStatus.RESERVED,
  reserved: RoomStatus.RESERVED,
  limpieza: RoomStatus.CLEANING,
  cleaning: RoomStatus.CLEANING,
  limpiando: RoomStatus.CLEANING,
  mantenimiento: RoomStatus.MAINTENANCE,
  maintenance: RoomStatus.MAINTENANCE,
  'fuera de servicio': RoomStatus.OUT_OF_SERVICE,
  'out of service': RoomStatus.OUT_OF_SERVICE,
  inhabilitada: RoomStatus.OUT_OF_SERVICE,
};

// Función para buscar coincidencias parciales en tipos de habitación
function findMatchingRoomTypes(searchTerm: string): RoomType[] {
  const searchLower = searchTerm.toLowerCase();
  const matchedTypes = new Set<RoomType>();

  // Buscar en el mapeo (coincidencias parciales)
  for (const [key, value] of Object.entries(ROOM_TYPE_SEARCH_MAP)) {
    if (key.includes(searchLower) || searchLower.includes(key)) {
      matchedTypes.add(value);
    }
  }

  // Buscar directamente en los valores del enum
  for (const enumValue of Object.values(RoomType)) {
    if (enumValue.toLowerCase().includes(searchLower)) {
      matchedTypes.add(enumValue);
    }
  }

  return Array.from(matchedTypes);
}

// Función para buscar coincidencias parciales en estados
function findMatchingRoomStatuses(searchTerm: string): RoomStatus[] {
  const searchLower = searchTerm.toLowerCase();
  const matchedStatuses = new Set<RoomStatus>();

  // Buscar en el mapeo (coincidencias parciales)
  for (const [key, value] of Object.entries(ROOM_STATUS_SEARCH_MAP)) {
    if (key.includes(searchLower) || searchLower.includes(key)) {
      matchedStatuses.add(value);
    }
  }

  // Buscar directamente en los valores del enum
  for (const enumValue of Object.values(RoomStatus)) {
    if (enumValue.toLowerCase().includes(searchLower)) {
      matchedStatuses.add(enumValue);
    }
  }

  return Array.from(matchedStatuses);
}

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createRoomDto: CreateRoomDto) {
    const { number } = createRoomDto;
    const existingRoom = await this.prisma.room.findUnique({
      where: { number },
    });
    if (existingRoom) {
      throw new ConflictException(`Room number ${number} already exists`);
    }
    const room = await this.prisma.room.create({
      data: createRoomDto,
    });
    this.logger.log(`Room created: ${room.number}`);
    return room;
  }

  async findAll(filterDto: FilterRoomDto) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      type,
      status,
      floor,
      minCapacity,
      maxPrice,
      minPrice,
    } = filterDto;
    const where: any = {
      deletedAt: null,
    };
    if (type) where.type = type;
    if (status) where.status = status;
    if (floor !== undefined) where.floor = floor;
    if (minCapacity) where.capacity = { gte: minCapacity };
    if (minPrice !== undefined || maxPrice !== undefined) {
      where.pricePerNight = {};
      if (minPrice !== undefined) where.pricePerNight.gte = minPrice;
      if (maxPrice !== undefined) where.pricePerNight.lte = maxPrice;
    }
    if (search) {
      const searchLower = search.toLowerCase().trim();
      const orConditions: any[] = [
        { number: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];

      // Buscar coincidencias parciales en tipos de habitación
      const matchedTypes = findMatchingRoomTypes(searchLower);
      if (matchedTypes.length > 0) {
        orConditions.push({ type: { in: matchedTypes } });
      }

      // Buscar coincidencias parciales en estados
      const matchedStatuses = findMatchingRoomStatuses(searchLower);
      if (matchedStatuses.length > 0) {
        orConditions.push({ status: { in: matchedStatuses } });
      }

      where.OR = orConditions;
    }
    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where,
        skip: filterDto.skip,
        take: filterDto.take,
        orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
      }),
      this.prisma.room.count({ where }),
    ]);
    return new PaginatedResponseDto(rooms, total, page ?? 1, limit ?? 10);
  }

  async findOne(id: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            reservations: true,
            cleaningTasks: true,
          },
        },
      },
    });
    if (!room) {
      throw new NotFoundException(`Room with ID ${id} not found`);
    }
    return room;
  }

  async findByNumber(number: string) {
    const room = await this.prisma.room.findFirst({
      where: { number, deletedAt: null },
    });
    if (!room) {
      throw new NotFoundException(`Room ${number} not found`);
    }
    return room;
  }

  async update(id: string, updateRoomDto: UpdateRoomDto) {
    await this.findOne(id);
    const room = await this.prisma.room.update({
      where: { id },
      data: updateRoomDto,
    });
    this.logger.log(`Room updated: ${room.number}`);
    return room;
  }

  async updateStatus(id: string, status: RoomStatus) {
    await this.findOne(id);
    const room = await this.prisma.room.update({
      where: { id },
      data: { status },
    });
    this.logger.log(`Room ${room.number} status changed to ${status}`);
    return room;
  }

  async remove(id: string) {
    const room = await this.findOne(id);
    const activeReservations = await this.prisma.reservation.count({
      where: {
        roomId: id,
        status: {
          in: [
            ReservationStatus.PENDING,
            ReservationStatus.CONFIRMED,
            ReservationStatus.CHECKED_IN,
          ],
        },
        deletedAt: null,
      },
    });
    if (activeReservations > 0) {
      throw new BadRequestException(
        'Cannot delete room with active reservations',
      );
    }
    await this.prisma.room.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    this.logger.log(`Room soft deleted: ${room.number}`);
    return { message: 'Room deleted successfully' };
  }

  async restore(id: string) {
    const room = await this.prisma.room.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!room) {
      throw new NotFoundException(`Deleted room with ID ${id} not found`);
    }
    await this.prisma.room.update({
      where: { id },
      data: { deletedAt: null },
    });
    this.logger.log(`Room restored: ${room.number}`);
    return { message: 'Room restored successfully' };
  }

  async checkAvailability(dto: CheckAvailabilityDto) {
    const { checkInDate, checkOutDate, type, capacity } = dto;
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    if (startDate >= endDate) {
      throw new BadRequestException(
        'Check-out date must be after check-in date',
      );
    }
    if (startDate < new Date()) {
      throw new BadRequestException('Check-in date cannot be in the past');
    }
    const bookedRoomIds = await this.prisma.reservation.findMany({
      where: {
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
            checkInDate: {
              gte: startDate,
              lt: endDate,
            },
          },
          {
            checkOutDate: {
              gt: startDate,
              lte: endDate,
            },
          },
          {
            AND: [
              { checkInDate: { lte: startDate } },
              { checkOutDate: { gte: endDate } },
            ],
          },
        ],
      },
      select: { roomId: true },
    });
    const bookedIds = bookedRoomIds.map((r) => r.roomId);
    const where: any = {
      deletedAt: null,
      status: {
        in: [RoomStatus.AVAILABLE, RoomStatus.CLEANING],
      },
    };
    if (bookedIds.length > 0) {
      where.id = { notIn: bookedIds };
    }
    if (type) where.type = type;
    if (capacity) where.capacity = { gte: capacity };
    const availableRooms = await this.prisma.room.findMany({
      where,
      orderBy: { pricePerNight: 'asc' },
    });
    const nights = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );
    return {
      checkInDate,
      checkOutDate,
      nights,
      availableRooms: availableRooms.map((room) => ({
        ...room,
        totalPrice: Number(room.pricePerNight) * nights,
      })),
      totalAvailable: availableRooms.length,
    };
  }

  async getRoomStats() {
    const [
      total,
      available,
      occupied,
      reserved,
      cleaning,
      maintenance,
      outOfService,
    ] = await Promise.all([
      this.prisma.room.count({ where: { deletedAt: null } }),
      this.prisma.room.count({
        where: { deletedAt: null, status: RoomStatus.AVAILABLE },
      }),
      this.prisma.room.count({
        where: { deletedAt: null, status: RoomStatus.OCCUPIED },
      }),
      this.prisma.room.count({
        where: { deletedAt: null, status: RoomStatus.RESERVED },
      }),
      this.prisma.room.count({
        where: { deletedAt: null, status: RoomStatus.CLEANING },
      }),
      this.prisma.room.count({
        where: { deletedAt: null, status: RoomStatus.MAINTENANCE },
      }),
      this.prisma.room.count({
        where: { deletedAt: null, status: RoomStatus.OUT_OF_SERVICE },
      }),
    ]);

    return {
      total,
      byStatus: {
        available,
        occupied,
        reserved,
        cleaning,
        maintenance,
        outOfService,
      },
      occupancyRate: total > 0 ? ((occupied / total) * 100).toFixed(2) : '0',
    };
  }
}
