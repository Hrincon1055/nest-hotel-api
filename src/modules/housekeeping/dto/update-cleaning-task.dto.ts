import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { CleaningStatus } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { CreateCleaningTaskDto } from './create-cleaning-task.dto';

export class UpdateCleaningTaskDto extends PartialType(
  OmitType(CreateCleaningTaskDto, ['roomId'] as const),
) {
  @ApiPropertyOptional({ enum: CleaningStatus, description: 'Task status' })
  @IsEnum(CleaningStatus)
  @IsOptional()
  status?: CleaningStatus;
}

export class AssignTaskDto {
  @ApiPropertyOptional({ description: 'Employee ID to assign' })
  @IsUUID()
  @IsOptional()
  employeeId?: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({ description: 'Completion notes' })
  @IsString()
  @IsOptional()
  notes?: string;
}
