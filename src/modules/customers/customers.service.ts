import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponseDto } from '../../common/dto';
import { PrismaService } from '../../database/prisma.service';
import { CreateCustomerDto, FilterCustomerDto, UpdateCustomerDto } from './dto';

@Injectable()
export class CustomersService {
  private readonly logger = new Logger(CustomersService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto) {
    const { email, documentType, documentNumber, birthDate, ...rest } =
      createCustomerDto;
    const existingByEmail = await this.prisma.customer.findUnique({
      where: { email },
    });
    if (existingByEmail) {
      throw new ConflictException('Email already exists');
    }
    const existingByDocument = await this.prisma.customer.findUnique({
      where: {
        documentType_documentNumber: {
          documentType,
          documentNumber,
        },
      },
    });
    if (existingByDocument) {
      throw new ConflictException('Document already registered');
    }
    const customer = await this.prisma.customer.create({
      data: {
        email,
        documentType,
        documentNumber,
        birthDate: birthDate ? new Date(birthDate) : null,
        ...rest,
      },
    });
    this.logger.log(`Customer created: ${customer.email}`);
    return customer;
  }

  async findAll(filterDto: FilterCustomerDto) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      search,
      documentType,
      nationality,
    } = filterDto;
    const where: any = {
      deletedAt: null,
    };
    if (documentType) {
      where.documentType = documentType;
    }
    if (nationality) {
      where.nationality = { contains: nationality, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { documentNumber: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [customers, total] = await Promise.all([
      this.prisma.customer.findMany({
        where,
        skip: filterDto.skip,
        take: filterDto.take,
        orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
      }),
      this.prisma.customer.count({ where }),
    ]);
    return new PaginatedResponseDto(customers, total, page ?? 1, limit ?? 10);
  }

  async findOne(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: null },
      include: {
        reservations: {
          where: { deletedAt: null },
          orderBy: { checkInDate: 'desc' },
          take: 10,
          include: {
            room: {
              select: {
                id: true,
                number: true,
                type: true,
              },
            },
          },
        },
        _count: {
          select: {
            reservations: true,
          },
        },
      },
    });
    if (!customer) {
      throw new NotFoundException(`Customer with ID ${id} not found`);
    }
    return customer;
  }

  async findByDocument(documentType: string, documentNumber: string) {
    return this.prisma.customer.findFirst({
      where: {
        documentType: documentType as any,
        documentNumber,
        deletedAt: null,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.customer.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async update(id: string, updateCustomerDto: UpdateCustomerDto) {
    await this.findOne(id);
    const { birthDate, ...rest } = updateCustomerDto;
    const data: any = { ...rest };
    if (birthDate) {
      data.birthDate = new Date(birthDate);
    }
    const customer = await this.prisma.customer.update({
      where: { id },
      data,
    });
    this.logger.log(`Customer updated: ${customer.email}`);
    return customer;
  }

  async remove(id: string) {
    const customer = await this.findOne(id);
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.log(`Customer soft deleted: ${customer.email}`);
    return { message: 'Customer deleted successfully' };
  }

  async restore(id: string) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!customer) {
      throw new NotFoundException(`Deleted customer with ID ${id} not found`);
    }
    await this.prisma.customer.update({
      where: { id },
      data: { deletedAt: null },
    });
    this.logger.log(`Customer restored: ${customer.email}`);
    return { message: 'Customer restored successfully' };
  }

  async getReservationHistory(customerId: string) {
    const customer = await this.findOne(customerId);
    const reservations = await this.prisma.reservation.findMany({
      where: {
        customerId,
        deletedAt: null,
      },
      orderBy: { checkInDate: 'desc' },
      include: {
        room: {
          select: {
            id: true,
            number: true,
            type: true,
            pricePerNight: true,
          },
        },
        checkInOut: true,
        reservationServices: {
          include: {
            service: true,
          },
        },
      },
    });
    return {
      customer: {
        id: customer.id,
        firstName: customer.firstName,
        lastName: customer.lastName,
        email: customer.email,
      },
      totalReservations: reservations.length,
      reservations,
    };
  }
}
