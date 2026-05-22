import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CleaningStatus, EmployeeRole, RoomStatus } from '@prisma/client';
import { PaginatedResponseDto } from '../../common/dto';
import { PrismaService } from '../../database/prisma.service';
import {
  AssignTaskDto,
  CompleteTaskDto,
  CreateCleaningTaskDto,
  FilterCleaningTaskDto,
  UpdateCleaningTaskDto,
} from './dto';

@Injectable()
export class HousekeepingService {
  private readonly logger = new Logger(HousekeepingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createCleaningTaskDto: CreateCleaningTaskDto) {
    const { roomId, employeeId, scheduledDate, ...rest } =
      createCleaningTaskDto;
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
    });
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }
    if (employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: {
          id: employeeId,
          deletedAt: null,
          role: EmployeeRole.HOUSEKEEPING,
          status: 'ACTIVE',
        },
      });
      if (!employee) {
        throw new NotFoundException(
          `Housekeeping employee with ID ${employeeId} not found`,
        );
      }
    }

    const task = await this.prisma.cleaningTask.create({
      data: {
        roomId,
        employeeId,
        scheduledDate: new Date(scheduledDate),
        status: CleaningStatus.PENDING,
        ...rest,
      },
      include: {
        room: {
          select: {
            id: true,
            number: true,
            floor: true,
            type: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Cleaning task created for room ${room.number}`);
    return task;
  }

  async findAll(filterDto: FilterCleaningTaskDto) {
    const {
      page,
      limit,
      sortBy,
      sortOrder,
      status,
      roomId,
      employeeId,
      dateFrom,
      dateTo,
    } = filterDto;
    const where: any = {};
    if (status) where.status = status;
    if (roomId) where.roomId = roomId;
    if (employeeId) where.employeeId = employeeId;
    if (dateFrom || dateTo) {
      where.scheduledDate = {};
      if (dateFrom) where.scheduledDate.gte = new Date(dateFrom);
      if (dateTo) where.scheduledDate.lte = new Date(dateTo);
    }
    const [tasks, total] = await Promise.all([
      this.prisma.cleaningTask.findMany({
        where,
        skip: filterDto.skip,
        take: filterDto.take,
        orderBy: { [sortBy ?? 'scheduledDate']: sortOrder ?? 'desc' },
        include: {
          room: {
            select: {
              id: true,
              number: true,
              floor: true,
              type: true,
              status: true,
            },
          },
          employee: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.cleaningTask.count({ where }),
    ]);
    return new PaginatedResponseDto(tasks, total, page ?? 1, limit ?? 10);
  }

  async findOne(id: string) {
    const task = await this.prisma.cleaningTask.findUnique({
      where: { id },
      include: {
        room: true,
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });
    if (!task) {
      throw new NotFoundException(`Cleaning task with ID ${id} not found`);
    }
    return task;
  }

  async update(id: string, updateCleaningTaskDto: UpdateCleaningTaskDto) {
    await this.findOne(id);
    const { scheduledDate, ...rest } = updateCleaningTaskDto;
    const data: any = { ...rest };
    if (scheduledDate) {
      data.scheduledDate = new Date(scheduledDate);
    }

    const task = await this.prisma.cleaningTask.update({
      where: { id },
      data,
      include: {
        room: {
          select: {
            id: true,
            number: true,
            floor: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logger.log(`Cleaning task ${id} updated`);
    return task;
  }

  async assignTask(id: string, assignDto: AssignTaskDto) {
    const task = await this.findOne(id);
    if (task.status === CleaningStatus.COMPLETED) {
      throw new BadRequestException('Cannot assign a completed task');
    }
    if (assignDto.employeeId) {
      const employee = await this.prisma.employee.findFirst({
        where: {
          id: assignDto.employeeId,
          deletedAt: null,
          role: EmployeeRole.HOUSEKEEPING,
          status: 'ACTIVE',
        },
      });
      if (!employee) {
        throw new NotFoundException(
          `Housekeeping employee with ID ${assignDto.employeeId} not found`,
        );
      }
    }

    const updated = await this.prisma.cleaningTask.update({
      where: { id },
      data: {
        employeeId: assignDto.employeeId,
        status:
          task.status === CleaningStatus.PENDING && assignDto.employeeId
            ? CleaningStatus.IN_PROGRESS
            : task.status,
      },
      include: {
        room: {
          select: { id: true, number: true },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    this.logger.log(`Cleaning task ${id} assigned`);
    return updated;
  }

  async startTask(id: string, employeeId: string) {
    const task = await this.findOne(id);
    if (task.status !== CleaningStatus.PENDING) {
      throw new BadRequestException('Only pending tasks can be started');
    }
    const updated = await this.prisma.cleaningTask.update({
      where: { id },
      data: {
        status: CleaningStatus.IN_PROGRESS,
        employeeId: task.employeeId || employeeId,
      },
      include: {
        room: {
          select: { id: true, number: true },
        },
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    this.logger.log(`Cleaning task ${id} started`);
    return updated;
  }

  async completeTask(
    id: string,
    completeDto: CompleteTaskDto,
    employeeId: string,
  ) {
    const task = await this.findOne(id);
    if (task.status === CleaningStatus.COMPLETED) {
      throw new BadRequestException('Task is already completed');
    }
    const updated = await this.prisma.cleaningTask.update({
      where: { id },
      data: {
        status: CleaningStatus.COMPLETED,
        completedDate: new Date(),
        employeeId: task.employeeId || employeeId,
        notes: completeDto.notes
          ? `${task.notes || ''}\nCompletion: ${completeDto.notes}`
          : task.notes,
      },
      include: {
        room: true,
        employee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });
    if (task.room.status === RoomStatus.CLEANING) {
      await this.prisma.room.update({
        where: { id: task.roomId },
        data: { status: RoomStatus.AVAILABLE },
      });
    }
    this.logger.log(
      `Cleaning task ${id} completed - Room ${task.room.number} now available`,
    );
    return updated;
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.cleaningTask.delete({
      where: { id },
    });
    this.logger.log(`Cleaning task ${id} deleted`);
    return { message: 'Cleaning task deleted successfully' };
  }

  async getTodayTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return this.prisma.cleaningTask.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        room: {
          select: {
            id: true,
            number: true,
            floor: true,
            type: true,
            status: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { scheduledDate: 'asc' }],
    });
  }

  async getPendingTasks() {
    return this.prisma.cleaningTask.findMany({
      where: {
        status: {
          in: [CleaningStatus.PENDING, CleaningStatus.IN_PROGRESS],
        },
      },
      include: {
        room: {
          select: {
            id: true,
            number: true,
            floor: true,
            type: true,
            status: true,
          },
        },
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { scheduledDate: 'asc' }],
    });
  }

  async getRoomHistory(roomId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, deletedAt: null },
    });
    if (!room) {
      throw new NotFoundException(`Room with ID ${roomId} not found`);
    }
    const tasks = await this.prisma.cleaningTask.findMany({
      where: { roomId },
      orderBy: { scheduledDate: 'desc' },
      take: 20,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
    return {
      room: {
        id: room.id,
        number: room.number,
        floor: room.floor,
        status: room.status,
      },
      cleaningHistory: tasks,
    };
  }

  async getEmployeeTasks(employeeId: string) {
    const employee = await this.prisma.employee.findFirst({
      where: { id: employeeId, deletedAt: null },
    });
    if (!employee) {
      throw new NotFoundException(`Employee with ID ${employeeId} not found`);
    }
    const tasks = await this.prisma.cleaningTask.findMany({
      where: {
        employeeId,
        status: {
          in: [CleaningStatus.PENDING, CleaningStatus.IN_PROGRESS],
        },
      },
      include: {
        room: {
          select: {
            id: true,
            number: true,
            floor: true,
            type: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { scheduledDate: 'asc' }],
    });
    return {
      employee: {
        id: employee.id,
        firstName: employee.firstName,
        lastName: employee.lastName,
      },
      assignedTasks: tasks,
      totalTasks: tasks.length,
    };
  }
}
