import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class FilterReservationDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ReservationStatus,
    description: 'Filter by status',
  })
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;

  @ApiPropertyOptional({ description: 'Filter by customer ID' })
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @ApiPropertyOptional({ description: 'Filter by room ID' })
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Filter by check-in date from' })
  @IsDateString()
  @IsOptional()
  checkInFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by check-in date to' })
  @IsDateString()
  @IsOptional()
  checkInTo?: string;

  @ApiPropertyOptional({ description: 'Filter by check-out date from' })
  @IsDateString()
  @IsOptional()
  checkOutFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by check-out date to' })
  @IsDateString()
  @IsOptional()
  checkOutTo?: string;
}
