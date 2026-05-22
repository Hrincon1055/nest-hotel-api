import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DocumentType } from '@prisma/client';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCustomerDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiProperty({ example: 'john.doe@email.com', description: 'Email address' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiPropertyOptional({ example: '+1234567890', description: 'Phone number' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiProperty({ enum: DocumentType, description: 'Document type' })
  @IsEnum(DocumentType)
  documentType!: DocumentType;

  @ApiProperty({ example: 'AB123456', description: 'Document number' })
  @IsString()
  @IsNotEmpty({ message: 'Document number is required' })
  documentNumber!: string;

  @ApiPropertyOptional({ example: '123 Main St', description: 'Address' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ example: 'USA', description: 'Nationality' })
  @IsString()
  @IsOptional()
  nationality?: string;

  @ApiPropertyOptional({ example: '1990-01-15', description: 'Birth date' })
  @IsDateString()
  @IsOptional()
  birthDate?: string;
}
