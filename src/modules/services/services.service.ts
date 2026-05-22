import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto';
import { PrismaService } from '../../database/prisma.service';
import {
  AddServiceToReservationDto,
  CreateServiceDto,
  FilterServiceDto,
  UpdateServiceDto,
} from './dto';

@Injectable()
export class ServicesService {
  private readonly logger = new Logger(ServicesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createServiceDto: CreateServiceDto) {
    const service = await this.prisma.additionalService.create({
      data: createServiceDto,
    });
    this.logger.log(`Service created: ${service.name}`);
    return service;
  }

  async findAll(filterDto: FilterServiceDto) {
    const { page, limit, sortBy, sortOrder, search, category, active } =
      filterDto;
    const where: any = {
      deletedAt: null,
    };
    if (category) where.category = category;
    if (active !== undefined) where.active = active;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [services, total] = await Promise.all([
      this.prisma.additionalService.findMany({
        where,
        skip: filterDto.skip,
        take: filterDto.take,
        orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
      }),
      this.prisma.additionalService.count({ where }),
    ]);
    return new PaginatedResponseDto(services, total, page ?? 1, limit ?? 10);
  }

  async findOne(id: string) {
    const service = await this.prisma.additionalService.findFirst({
      where: { id, deletedAt: null },
    });
    if (!service) {
      throw new NotFoundException(`Service with ID ${id} not found`);
    }
    return service;
  }

  async update(id: string, updateServiceDto: UpdateServiceDto) {
    await this.findOne(id);
    const service = await this.prisma.additionalService.update({
      where: { id },
      data: updateServiceDto,
    });
    this.logger.log(`Service updated: ${service.name}`);
    return service;
  }

  async remove(id: string) {
    const service = await this.findOne(id);
    await this.prisma.additionalService.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.log(`Service soft deleted: ${service.name}`);
    return { message: 'Service deleted successfully' };
  }

  async addToReservation(dto: AddServiceToReservationDto) {
    const { reservationId, serviceId, quantity, notes } = dto;
    const reservation = await this.prisma.reservation.findFirst({
      where: {
        id: reservationId,
        deletedAt: null,
        status: ReservationStatus.CHECKED_IN,
      },
    });
    if (!reservation) {
      throw new NotFoundException(
        'Reservation not found or guest is not checked in',
      );
    }
    const service = await this.prisma.additionalService.findFirst({
      where: { id: serviceId, deletedAt: null, active: true },
    });
    if (!service) {
      throw new NotFoundException('Service not found or not available');
    }
    const unitPrice = Number(service.price);
    const totalPrice = unitPrice * (quantity ?? 1);
    const reservationService = await this.prisma.reservationService.create({
      data: {
        reservationId,
        serviceId,
        quantity,
        unitPrice,
        totalPrice,
        notes,
      },
      include: {
        service: true,
      },
    });
    await this.prisma.reservation.update({
      where: { id: reservationId },
      data: {
        totalAmount: {
          increment: totalPrice,
        },
      },
    });
    this.logger.log(
      `Service ${service.name} added to reservation ${reservation.reservationCode}`,
    );
    return reservationService;
  }

  async removeFromReservation(reservationServiceId: string) {
    const reservationService = await this.prisma.reservationService.findUnique({
      where: { id: reservationServiceId },
      include: {
        reservation: true,
      },
    });
    if (!reservationService) {
      throw new NotFoundException('Reservation service not found');
    }
    if (
      reservationService.reservation.status !== ReservationStatus.CHECKED_IN
    ) {
      throw new BadRequestException(
        'Can only remove services from checked-in reservations',
      );
    }
    await this.prisma.reservation.update({
      where: { id: reservationService.reservationId },
      data: {
        totalAmount: {
          decrement: Number(reservationService.totalPrice),
        },
      },
    });
    await this.prisma.reservationService.delete({
      where: { id: reservationServiceId },
    });
    this.logger.log(`Service removed from reservation`);
    return { message: 'Service removed from reservation' };
  }

  async getReservationServices(reservationId: string) {
    const services = await this.prisma.reservationService.findMany({
      where: { reservationId },
      include: {
        service: true,
      },
      orderBy: { serviceDate: 'desc' },
    });
    const total = services.reduce(
      (sum, item) => sum + Number(item.totalPrice),
      0,
    );
    return {
      services,
      total,
      count: services.length,
    };
  }

  async getByCategory(category: string) {
    return await this.prisma.additionalService.findMany({
      where: {
        category: category as any,
        active: true,
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });
  }
}
