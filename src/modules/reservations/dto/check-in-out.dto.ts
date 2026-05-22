import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class CheckInDto {
  @ApiPropertyOptional({ description: 'Notes for check-in' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class CheckOutDto {
  @ApiPropertyOptional({ description: 'Notes for check-out' })
  @IsString()
  @IsOptional()
  notes?: string;
}
