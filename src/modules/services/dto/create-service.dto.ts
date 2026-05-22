import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ServiceCategory } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Room Service Breakfast',
    description: 'Service name',
  })
  @IsString()
  @IsNotEmpty({ message: 'Service name is required' })
  name!: string;

  @ApiPropertyOptional({ example: 'Full breakfast delivered to your room' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 25.0, description: 'Service price' })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price!: number;

  @ApiProperty({ enum: ServiceCategory, description: 'Service category' })
  @IsEnum(ServiceCategory)
  category!: ServiceCategory;

  @ApiPropertyOptional({
    default: true,
    description: 'Whether service is active',
  })
  @IsBoolean()
  @IsOptional()
  active?: boolean = true;
}
