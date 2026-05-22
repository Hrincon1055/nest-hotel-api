import { ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeRole, EmployeeStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class FilterEmployeeDto extends PaginationDto {
  @ApiPropertyOptional({ enum: EmployeeRole, description: 'Filter by role' })
  @IsEnum(EmployeeRole)
  @IsOptional()
  role?: EmployeeRole;

  @ApiPropertyOptional({
    enum: EmployeeStatus,
    description: 'Filter by status',
  })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus;
}
