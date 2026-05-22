import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EmployeeRole, EmployeeStatus } from '@prisma/client';
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';

export class CreateEmployeeDto {
  @ApiProperty({ example: 'John', description: 'First name' })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName!: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName!: string;

  @ApiProperty({ example: 'john.doe@hotel.com', description: 'Email address' })
  @IsEmail({}, { message: 'Please provide a valid email' })
  @IsNotEmpty({ message: 'Email is required' })
  email!: string;

  @ApiProperty({ example: 'SecurePass123!', description: 'Password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character',
    },
  )
  password!: string;

  @ApiPropertyOptional({
    enum: EmployeeRole,
    default: EmployeeRole.RECEPTIONIST,
    description: 'Employee role',
  })
  @IsEnum(EmployeeRole)
  @IsOptional()
  role?: EmployeeRole = EmployeeRole.RECEPTIONIST;

  @ApiPropertyOptional({
    enum: EmployeeStatus,
    default: EmployeeStatus.ACTIVE,
    description: 'Employee status',
  })
  @IsEnum(EmployeeStatus)
  @IsOptional()
  status?: EmployeeStatus = EmployeeStatus.ACTIVE;
}
