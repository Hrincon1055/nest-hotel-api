import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class FilterServiceDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: ServiceCategory,
    description: 'Filter by category',
  })
  @IsEnum(ServiceCategory)
  @IsOptional()
  category?: ServiceCategory;

  @ApiPropertyOptional({ description: 'Filter by active status' })
  @Type(() => Boolean)
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class AddServiceToReservationDto {
  @ApiProperty({ description: 'Reservation ID' })
  @IsUUID()
  reservationId!: string;

  @ApiProperty({ description: 'Service ID' })
  @IsUUID()
  serviceId!: string;

  @ApiPropertyOptional({ example: 1, default: 1, description: 'Quantity' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @IsOptional()
  quantity?: number = 1;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
