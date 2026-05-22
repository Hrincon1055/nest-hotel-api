import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CreateReservationDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ description: 'Room ID' })
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;

  @ApiProperty({ example: '2024-12-01', description: 'Check-in date' })
  @IsDateString()
  @IsNotEmpty()
  checkInDate!: string;

  @ApiProperty({ example: '2024-12-05', description: 'Check-out date' })
  @IsDateString()
  @IsNotEmpty()
  checkOutDate!: string;

  @ApiPropertyOptional({
    example: 2,
    default: 1,
    description: 'Number of adults',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  adults?: number = 1;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Number of children',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  children?: number = 0;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
