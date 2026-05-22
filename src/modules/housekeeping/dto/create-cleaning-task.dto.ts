import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreateCleaningTaskDto {
  @ApiProperty({ description: 'Room ID' })
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;

  @ApiPropertyOptional({ description: 'Assigned employee ID' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiProperty({ example: '2024-12-01', description: 'Scheduled date' })
  @IsDateString()
  @IsNotEmpty()
  scheduledDate!: string;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
    description: 'Priority (1-5)',
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number = 1;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
