import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
  CreateMultiRoomReservationDto,
  FilterMultiRoomReservationDto,
} from './dto';
import { MultiRoomReservationsService } from './multi-room-reservations.service';

@ApiTags('Reservations')
@Controller('reservations/multi-room')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class MultiRoomReservationsController {
  constructor(
    private readonly multiRoomReservationsService: MultiRoomReservationsService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a multi-room reservation' })
  @ApiResponse({
    status: 201,
    description: 'Multi-room reservation created successfully',
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Customer or room not found' })
  @ApiResponse({
    status: 409,
    description: 'One or more rooms are not available for selected dates',
  })
  create(
    @Body() createMultiRoomReservationDto: CreateMultiRoomReservationDto,
    @CurrentUser('id') employeeId: string,
  ) {
    return this.multiRoomReservationsService.create(
      createMultiRoomReservationDto,
      employeeId,
    );
  }

  @Get()
  @ApiOperation({
    summary: 'Get all multi-room reservations with pagination and filters',
  })
  @ApiResponse({ status: 200, description: 'List of multi-room reservations' })
  findAll(@Query() filterDto: FilterMultiRoomReservationDto) {
    return this.multiRoomReservationsService.findAll(filterDto);
  }

  @Get('code/:code')
  @ApiOperation({ summary: 'Get multi-room reservation by code' })
  @ApiParam({ name: 'code', description: 'Multi-room reservation code' })
  @ApiResponse({ status: 200, description: 'Multi-room reservation details' })
  @ApiResponse({ status: 404, description: 'Multi-room reservation not found' })
  findByCode(@Param('code') code: string) {
    return this.multiRoomReservationsService.findByCode(code);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get multi-room reservation by ID' })
  @ApiParam({ name: 'id', description: 'Multi-room reservation UUID' })
  @ApiResponse({ status: 200, description: 'Multi-room reservation details' })
  @ApiResponse({ status: 404, description: 'Multi-room reservation not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.multiRoomReservationsService.findOne(id);
  }

  @Post(':id/confirm')
  @ApiOperation({
    summary: 'Confirm all reservations in a multi-room reservation',
  })
  @ApiParam({ name: 'id', description: 'Multi-room reservation UUID' })
  @ApiResponse({ status: 200, description: 'Multi-room reservation confirmed' })
  @ApiResponse({
    status: 400,
    description: 'Cannot confirm multi-room reservation',
  })
  confirm(@Param('id', ParseUUIDPipe) id: string) {
    return this.multiRoomReservationsService.confirm(id);
  }

  @Post(':id/cancel')
  @ApiOperation({
    summary: 'Cancel all eligible reservations in a multi-room reservation',
  })
  @ApiParam({ name: 'id', description: 'Multi-room reservation UUID' })
  @ApiResponse({ status: 200, description: 'Multi-room reservation cancelled' })
  @ApiResponse({
    status: 400,
    description: 'Cannot cancel multi-room reservation',
  })
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('reason') reason?: string,
  ) {
    return this.multiRoomReservationsService.cancel(id, reason);
  }

  @Delete(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Delete multi-room reservation (soft delete)' })
  @ApiParam({ name: 'id', description: 'Multi-room reservation UUID' })
  @ApiResponse({
    status: 200,
    description: 'Multi-room reservation deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Multi-room reservation not found',
  })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.multiRoomReservationsService.remove(id);
  }
}
