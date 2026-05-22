import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PaginatedResponseDto } from '../../common/dto';
import { PrismaService } from '../../database/prisma.service';
import {
  ChangePasswordDto,
  CreateEmployeeDto,
  FilterEmployeeDto,
  UpdateEmployeeDto,
} from './dto';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async create(createEmployeeDto: CreateEmployeeDto) {
    const { email, password, ...rest } = createEmployeeDto;
    const existingEmployee = await this.prisma.employee.findUnique({
      where: { email },
    });

    if (existingEmployee) {
      throw new ConflictException('Email already exists');
    }
    const saltRounds =
      this.configService.get<number>('app.bcryptSaltRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const employee = await this.prisma.employee.create({
      data: {
        email,
        password: hashedPassword,
        ...rest,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Employee created: ${employee.email}`);
    return employee;
  }

  async findAll(filterDto: FilterEmployeeDto) {
    const { page, limit, sortBy, sortOrder, search, role, status } = filterDto;
    const where: any = {
      deletedAt: null,
    };
    if (role) {
      where.role = role;
    }
    if (status) {
      where.status = status;
    }
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }
    const [employees, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        skip: filterDto.skip,
        take: filterDto.take,
        orderBy: { [sortBy ?? 'createdAt']: sortOrder ?? 'desc' },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      this.prisma.employee.count({ where }),
    ]);
    return new PaginatedResponseDto(employees, total, page ?? 1, limit ?? 10);
  }

  async findOne(id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            checkIns: true,
            checkOuts: true,
            cleaningTasks: true,
          },
        },
      },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    return employee;
  }

  async findByEmail(email: string) {
    return this.prisma.employee.findFirst({
      where: { email, deletedAt: null },
    });
  }

  async update(id: string, updateEmployeeDto: UpdateEmployeeDto) {
    await this.findOne(id);
    const { password, ...rest } = updateEmployeeDto;
    const data: any = { ...rest };
    if (password) {
      const saltRounds =
        this.configService.get<number>('app.bcryptSaltRounds') ?? 12;
      data.password = await bcrypt.hash(password, saltRounds);
    }

    const employee = await this.prisma.employee.update({
      where: { id },
      data,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    this.logger.log(`Employee updated: ${employee.email}`);
    return employee;
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
    isAdmin: boolean = false,
  ) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${id} not found`);
    }
    if (!isAdmin && changePasswordDto.currentPassword) {
      const isCurrentPasswordValid = await bcrypt.compare(
        changePasswordDto.currentPassword,
        employee.password,
      );

      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }
    }
    const saltRounds =
      this.configService.get<number>('app.bcryptSaltRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(
      changePasswordDto.newPassword,
      saltRounds,
    );
    await this.prisma.employee.update({
      where: { id },
      data: { password: hashedPassword },
    });
    this.logger.log(`Password changed for employee: ${employee.email}`);
    return { message: 'Password changed successfully' };
  }

  async remove(id: string) {
    const employee = await this.findOne(id);
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    this.logger.log(`Employee soft deleted: ${employee.email}`);
    return { message: 'Employee deleted successfully' };
  }
  async restore(id: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!employee) {
      throw new NotFoundException(`Deleted employee with ID ${id} not found`);
    }
    await this.prisma.employee.update({
      where: { id },
      data: { deletedAt: null },
    });
    this.logger.log(`Employee restored: ${employee.email}`);
    return { message: 'Employee restored successfully' };
  }
}
