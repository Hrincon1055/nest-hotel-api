import { ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { ReservationStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreateReservationDto } from './create-reservation.dto';

export class UpdateReservationDto extends PartialType(
  OmitType(CreateReservationDto, ['customerId', 'roomId'] as const),
) {
  @ApiPropertyOptional({
    enum: ReservationStatus,
    description: 'Reservation status',
  })
  @IsEnum(ReservationStatus)
  @IsOptional()
  status?: ReservationStatus;
}
