import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { EmployeeRole } from '@prisma/client';
import { CurrentUser, Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/guards';
import {
  AssignTaskDto,
  CompleteTaskDto,
  CreateCleaningTaskDto,
  FilterCleaningTaskDto,
  UpdateCleaningTaskDto,
} from './dto';
import { HousekeepingService } from './housekeeping.service';

@ApiTags('Housekeeping')
@Controller('housekeeping')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class HousekeepingController {
  constructor(private readonly housekeepingService: HousekeepingService) {}

  @Post()
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Create a new cleaning task' })
  @ApiResponse({ status: 201, description: 'Task created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Room or employee not found' })
  create(@Body() createCleaningTaskDto: CreateCleaningTaskDto) {
    return this.housekeepingService.create(createCleaningTaskDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all cleaning tasks with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'List of cleaning tasks' })
  findAll(@Query() filterDto: FilterCleaningTaskDto) {
    return this.housekeepingService.findAll(filterDto);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today cleaning tasks' })
  @ApiResponse({ status: 200, description: 'Today cleaning tasks' })
  getTodayTasks() {
    return this.housekeepingService.getTodayTasks();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending cleaning tasks' })
  @ApiResponse({ status: 200, description: 'Pending cleaning tasks' })
  getPendingTasks() {
    return this.housekeepingService.getPendingTasks();
  }

  @Get('my-tasks')
  @Roles(EmployeeRole.HOUSEKEEPING)
  @ApiOperation({ summary: 'Get my assigned tasks (Housekeeping only)' })
  @ApiResponse({ status: 200, description: 'My assigned tasks' })
  getMyTasks(@CurrentUser('id') employeeId: string) {
    return this.housekeepingService.getEmployeeTasks(employeeId);
  }

  @Get('room/:roomId/history')
  @ApiOperation({ summary: 'Get cleaning history for a room' })
  @ApiParam({ name: 'roomId', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room cleaning history' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  getRoomHistory(@Param('roomId', ParseUUIDPipe) roomId: string) {
    return this.housekeepingService.getRoomHistory(roomId);
  }

  @Get('employee/:employeeId/tasks')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Get tasks assigned to an employee' })
  @ApiParam({ name: 'employeeId', description: 'Employee UUID' })
  @ApiResponse({ status: 200, description: 'Employee assigned tasks' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  getEmployeeTasks(@Param('employeeId', ParseUUIDPipe) employeeId: string) {
    return this.housekeepingService.getEmployeeTasks(employeeId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get cleaning task by ID' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task details' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.housekeepingService.findOne(id);
  }

  @Patch(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Update cleaning task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task updated successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCleaningTaskDto: UpdateCleaningTaskDto,
  ) {
    return this.housekeepingService.update(id, updateCleaningTaskDto);
  }

  @Patch(':id/assign')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Assign task to an employee' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task assigned successfully' })
  @ApiResponse({ status: 404, description: 'Task or employee not found' })
  assignTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() assignDto: AssignTaskDto,
  ) {
    return this.housekeepingService.assignTask(id, assignDto);
  }

  @Post(':id/start')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.HOUSEKEEPING)
  @ApiOperation({ summary: 'Start a cleaning task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task started' })
  @ApiResponse({ status: 400, description: 'Cannot start task' })
  startTask(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') employeeId: string,
  ) {
    return this.housekeepingService.startTask(id, employeeId);
  }

  @Post(':id/complete')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.HOUSEKEEPING)
  @ApiOperation({ summary: 'Complete a cleaning task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({
    status: 200,
    description: 'Task completed - Room marked available',
  })
  @ApiResponse({ status: 400, description: 'Cannot complete task' })
  completeTask(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() completeDto: CompleteTaskDto,
    @CurrentUser('id') employeeId: string,
  ) {
    return this.housekeepingService.completeTask(id, completeDto, employeeId);
  }

  @Delete(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Delete cleaning task' })
  @ApiParam({ name: 'id', description: 'Task UUID' })
  @ApiResponse({ status: 200, description: 'Task deleted successfully' })
  @ApiResponse({ status: 404, description: 'Task not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.housekeepingService.remove(id);
  }
}
