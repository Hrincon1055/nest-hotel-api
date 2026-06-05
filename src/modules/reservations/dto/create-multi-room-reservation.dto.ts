import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateMultiRoomReservationRoomDto {
  @ApiProperty({ description: 'Room ID' })
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Number of adults for this room',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  adults?: number = 1;

  @ApiPropertyOptional({
    example: 0,
    default: 0,
    description: 'Number of children for this room',
  })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @IsOptional()
  children?: number = 0;

  @ApiPropertyOptional({ description: 'Room-specific notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CreateMultiRoomReservationDto {
  @ApiProperty({ description: 'Customer ID' })
  @IsUUID()
  @IsNotEmpty()
  customerId!: string;

  @ApiProperty({ example: '2026-07-01', description: 'Shared check-in date' })
  @IsDateString()
  @IsNotEmpty()
  checkInDate!: string;

  @ApiProperty({ example: '2026-07-05', description: 'Shared check-out date' })
  @IsDateString()
  @IsNotEmpty()
  checkOutDate!: string;

  @ApiProperty({
    type: [CreateMultiRoomReservationRoomDto],
    description: 'Rooms to include in the same booking operation',
  })
  @IsArray()
  @ArrayMinSize(2)
  @ValidateNested({ each: true })
  @Type(() => CreateMultiRoomReservationRoomDto)
  rooms!: CreateMultiRoomReservationRoomDto[];

  @ApiPropertyOptional({
    description: 'General notes for the multi-room reservation',
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
