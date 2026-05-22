import { ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus, RoomType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  Min,
} from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class FilterRoomDto extends PaginationDto {
  @ApiPropertyOptional({ enum: RoomType, description: 'Filter by room type' })
  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;

  @ApiPropertyOptional({ enum: RoomStatus, description: 'Filter by status' })
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus;

  @ApiPropertyOptional({ description: 'Filter by floor' })
  @Type(() => Number)
  @IsInt()
  @IsOptional()
  floor?: number;

  @ApiPropertyOptional({ description: 'Minimum capacity' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  minCapacity?: number;

  @ApiPropertyOptional({ description: 'Maximum price per night' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  maxPrice?: number;

  @ApiPropertyOptional({ description: 'Minimum price per night' })
  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  minPrice?: number;
}

export class CheckAvailabilityDto {
  @ApiPropertyOptional({ description: 'Check-in date', example: '2024-12-01' })
  @IsDateString()
  checkInDate!: string;

  @ApiPropertyOptional({ description: 'Check-out date', example: '2024-12-05' })
  @IsDateString()
  checkOutDate!: string;

  @ApiPropertyOptional({ enum: RoomType, description: 'Filter by room type' })
  @IsEnum(RoomType)
  @IsOptional()
  type?: RoomType;

  @ApiPropertyOptional({ description: 'Minimum capacity' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  capacity?: number;
}
