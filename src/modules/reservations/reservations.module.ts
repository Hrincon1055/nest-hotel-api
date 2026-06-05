import { Module } from '@nestjs/common';
import { MultiRoomReservationsController } from './multi-room-reservations.controller';
import { MultiRoomReservationsService } from './multi-room-reservations.service';
import { ReservationsController } from './reservations.controller';
import { ReservationsService } from './reservations.service';

@Module({
  controllers: [MultiRoomReservationsController, ReservationsController],
  providers: [ReservationsService, MultiRoomReservationsService],
  exports: [ReservationsService, MultiRoomReservationsService],
})
export class ReservationsModule {}
