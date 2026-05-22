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
  CheckInDto,
  CheckOutDto,
  CreateReservationDto,
  FilterReservationDto,
  UpdateReservationDto,
} from './dto';
import { ReservationsService } from './reservations.service';

@ApiTags('Reservations')
@Controller('reservations')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new reservation' })
  @ApiResponse({ status: 201, description: 'Reservation created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer or room not found' })
  @ApiResponse({
    status: 409,
    description: 'Room not available for selected dates',
  })
  create(
    @Body() createReservationDto: CreateReservationDto,
    @CurrentUser('id') employeeId: string,
  ) {
    return this.reservationsService.create(createReservationDto, employeeId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reservations with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of reservations' })
  findAll(@Query() filterDto: FilterReservationDto) {
    return this.reservationsService.findAll(filterDto);
  }

  @Get('today/arrivals')
  @ApiOperation({ summary: 'Get today arrivals' })
  @ApiResponse({ status: 200, description: 'List of today arrivals' })
  getTodayArrivals() {
    return this.reservationsService.getTodayArrivals();
  }

  @Get('today/departures')
  @ApiOperation({ summary: 'Get today departures' })
  @ApiResponse({ status: 200, description: 'List of today departures' })
  getTodayDepartures() {
    return this.reservationsService.getTodayDepartures();
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get reservation by code' })
  @ApiParam({ name: 'code', description: 'Reservation code' })
  @ApiResponse({ status: 200, description: 'Reservation details' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  findByCode(@Param('code') code: string) {
    return this.reservationsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get reservation by ID' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation details' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update reservation' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation updated successfully' })
  @ApiResponse({ status: 400, description: 'Cannot update reservation' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReservationDto: UpdateReservationDto,
  ) {
    return this.reservationsService.update(id, updateReservationDto);
  }

  @Post(':id/confirm')
  @ApiOperation({ summary: 'Confirm reservation' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation confirmed' })
  @ApiResponse({ status: 400, description: 'Cannot confirm reservation' })
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.confirm(id);
  }

  @Post(':id/check-in')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Check-in guest' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Check-in completed' })
  @ApiResponse({ status: 400, description: 'Cannot check in' })
  checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() checkInDto: CheckInDto,
    @CurrentUser('id') employeeId: string,
  ) {
    return this.reservationsService.checkIn(id, checkInDto, employeeId);
  }

  @Post(':id/check-out')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Check-out guest' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Check-out completed' })
  @ApiResponse({ status: 400, description: 'Cannot check out' })
  checkOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() checkOutDto: CheckOutDto,
    @CurrentUser('id') employeeId: string,
  ) {
    return this.reservationsService.checkOut(id, checkOutDto, employeeId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel reservation' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation cancelled' })
  @ApiResponse({ status: 400, description: 'Cannot cancel reservation' })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.reservationsService.cancel(id, reason);
  }

  @Post(':id/no-show')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Mark reservation as no-show' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation marked as no-show' })
  @ApiResponse({ status: 400, description: 'Cannot mark as no-show' })
  markNoShow(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.markNoShow(id);
  }

  @Delete(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Delete reservation (soft delete)' })
  @ApiParam({ name: 'id', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation deleted successfully' })
  @ApiResponse({ status: 404, description: 'Reservation not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.reservationsService.remove(id);
  }
}
