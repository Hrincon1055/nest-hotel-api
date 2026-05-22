import { ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../../common/dto';

export class FilterCustomerDto extends PaginationDto {
  @ApiPropertyOptional({
    enum: DocumentType,
    description: 'Filter by document type',
  })
  @IsEnum(DocumentType)
  @IsOptional()
  documentType?: DocumentType;

  @ApiPropertyOptional({ description: 'Filter by nationality' })
  @IsOptional()
  nationality?: string;
}
