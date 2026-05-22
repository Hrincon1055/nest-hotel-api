import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { RoomStatus, RoomType } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Min,
} from 'class-validator';

export class CreateRoomDto {
  @ApiProperty({ example: '101', description: 'Room number' })
  @IsString()
  @IsNotEmpty({ message: 'Room number is required' })
  number!: string;

  @ApiProperty({ example: 1, description: 'Floor number' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  floor!: number;

  @ApiProperty({ enum: RoomType, description: 'Room type' })
  @IsEnum(RoomType)
  type!: RoomType;

  @ApiPropertyOptional({ enum: RoomStatus, default: RoomStatus.AVAILABLE })
  @IsEnum(RoomStatus)
  @IsOptional()
  status?: RoomStatus = RoomStatus.AVAILABLE;

  @ApiProperty({ example: 150.0, description: 'Price per night' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  pricePerNight!: number;

  @ApiProperty({ example: 2, description: 'Maximum capacity' })
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  capacity!: number;

  @ApiPropertyOptional({
    example: 'Cozy room with city view',
    description: 'Description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    type: [String],
    example: ['https://example.com/room1.jpg'],
    description: 'Room images URLs',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  images?: string[] = [];

  @ApiPropertyOptional({
    type: [String],
    example: ['WiFi', 'TV', 'Mini Bar', 'Air Conditioning'],
    description: 'Room amenities',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  amenities?: string[] = [];
}
