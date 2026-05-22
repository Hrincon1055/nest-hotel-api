import { ApiPropertyOptional } from '@nestjs/swagger';
import { CleaningStatus } from '@prisma/client';
import { IsDateString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class FilterCleaningTaskDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: CleaningStatus,
    description: 'Filter by status',
  })
  @IsEnum(CleaningStatus)
  @IsOptional()
  status?: CleaningStatus;

  @ApiPropertyOptional({ description: 'Filter by room ID' })
  @IsUUID()
  @IsOptional()
  roomId?: string;

  @ApiPropertyOptional({ description: 'Filter by employee ID' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;

  @ApiPropertyOptional({ description: 'Filter by scheduled date from' })
  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @ApiPropertyOptional({ description: 'Filter by scheduled date to' })
  @IsDateString()
  @IsOptional()
  dateTo?: string;
}
