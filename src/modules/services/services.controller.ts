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
import { EmployeeRole, ServiceCategory } from '@prisma/client';
import { Roles } from '../../common/decorators';
import { RolesGuard } from '../../common/guards';
import { JwtAuthGuard } from '../auth/guards';
import {
  AddServiceToReservationDto,
  CreateServiceDto,
  FilterServiceDto,
  UpdateServiceDto,
} from './dto';
import { ServicesService } from './services.service';

@ApiTags('Additional Services')
@Controller('services')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  create(@Body() createServiceDto: CreateServiceDto) {
    return this.servicesService.create(createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all services with pagination and filters' })
  @ApiResponse({ status: 200, description: 'List of services' })
  findAll(@Query() filterDto: FilterServiceDto) {
    return this.servicesService.findAll(filterDto);
  }

  @Get('category/:category')
  @ApiOperation({ summary: 'Get services by category' })
  @ApiParam({ name: 'category', enum: ServiceCategory })
  @ApiResponse({ status: 200, description: 'Services in category' })
  getByCategory(@Param('category') category: string) {
    return this.servicesService.getByCategory(category);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get service by ID' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Service details' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER)
  @ApiOperation({ summary: 'Update service' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
  ) {
    return this.servicesService.update(id, updateServiceDto);
  }

  @Delete(':id')
  @Roles(EmployeeRole.ADMIN)
  @ApiOperation({ summary: 'Delete service (soft delete)' })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 404, description: 'Service not found' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.remove(id);
  }

  @Post('reservation')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Add service to reservation' })
  @ApiResponse({ status: 201, description: 'Service added to reservation' })
  @ApiResponse({ status: 404, description: 'Reservation or service not found' })
  addToReservation(@Body() dto: AddServiceToReservationDto) {
    return this.servicesService.addToReservation(dto);
  }

  @Delete('reservation/:id')
  @Roles(EmployeeRole.ADMIN, EmployeeRole.MANAGER, EmployeeRole.RECEPTIONIST)
  @ApiOperation({ summary: 'Remove service from reservation' })
  @ApiParam({ name: 'id', description: 'Reservation service UUID' })
  @ApiResponse({ status: 200, description: 'Service removed from reservation' })
  @ApiResponse({ status: 404, description: 'Reservation service not found' })
  removeFromReservation(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.removeFromReservation(id);
  }

  @Get('reservation/:reservationId')
  @ApiOperation({ summary: 'Get services for a reservation' })
  @ApiParam({ name: 'reservationId', description: 'Reservation UUID' })
  @ApiResponse({ status: 200, description: 'Reservation services' })
  getReservationServices(
    @Param('reservationId', ParseUUIDPipe) reservationId: string,
  ) {
    return this.servicesService.getReservationServices(reservationId);
  }
}
