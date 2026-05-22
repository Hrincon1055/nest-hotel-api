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
import { EmployeeRole, RoomStatus } from '@prisma/client';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/guards';
import {
  CheckAvailabilityDto,
  CreateRoomDto,
  FilterRoomDto,
  UpdateRoomDto,
} from './dto';
import { RoomsService } from './rooms.service';

@ApiTags('Rooms')
@Controller('rooms')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Create a new room' })
  @ApiResponse({ status: 201, description: 'Room created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 409, description: 'Room number already exists' })
  create(@Body() createRoomDto: CreateRoomDto) {
    return this.roomsService.create(createRoomDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all rooms with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of rooms' })
  findAll(@Query() filterDto: FilterRoomDto) {
    return this.roomsService.findAll(filterDto);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get room statistics' })
  @ApiResponse({ status: 200, description: 'Room statistics' })
  getStats() {
    return this.roomsService.getRoomStats();
  }

  @Get('availability')
  @ApiOperation({ summary: 'Check room availability for dates' })
  @ApiResponse({ status: 200, description: 'Available rooms for the period' })
  checkAvailability(@Query() dto: CheckAvailabilityDto) {
    return this.roomsService.checkAvailability(dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get room by ID' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room details' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.findOne(id);
  }

  @Patch(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Update room' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room updated successfully' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateRoomDto: UpdateRoomDto,
  ) {
    return this.roomsService.update(id, updateRoomDto);
  }

  @Patch(':id/status')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Update room status' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room status updated' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: RoomStatus,
  ) {
    return this.roomsService.updateStatus(id, status);
  }

  @Delete(':id')
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: 'Delete room (soft delete)' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room deleted successfully' })
  @ApiResponse({ status: 400, description: 'Room has active reservations' })
  @ApiResponse({ status: 404, description: 'Room not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.remove(id);
  }

  @Post(':id/restore')
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: 'Restore deleted room' })
  @ApiParam({ name: 'id', description: 'Room UUID' })
  @ApiResponse({ status: 200, description: 'Room restored successfully' })
  @ApiResponse({ status: 404, description: 'Deleted room not found' })
  restore(@Param('id', ParseUUIDPipe) id: string) {
    return this.roomsService.restore(id);
  }
}
