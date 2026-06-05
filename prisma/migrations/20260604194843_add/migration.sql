-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "multi_room_reservation_id" TEXT;

-- CreateTable
CREATE TABLE "multi_room_reservations" (
    "id" TEXT NOT NULL,
    "reservation_code" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "check_in_date" TIMESTAMP(3) NOT NULL,
    "check_out_date" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "multi_room_reservations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "multi_room_reservations_reservation_code_key" ON "multi_room_reservations"("reservation_code");

-- CreateIndex
CREATE INDEX "multi_room_reservations_reservation_code_idx" ON "multi_room_reservations"("reservation_code");

-- CreateIndex
CREATE INDEX "multi_room_reservations_customer_id_idx" ON "multi_room_reservations"("customer_id");

-- CreateIndex
CREATE INDEX "multi_room_reservations_check_in_date_check_out_date_idx" ON "multi_room_reservations"("check_in_date", "check_out_date");

-- CreateIndex
CREATE INDEX "reservations_multi_room_reservation_id_idx" ON "reservations"("multi_room_reservation_id");

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_multi_room_reservation_id_fkey" FOREIGN KEY ("multi_room_reservation_id") REFERENCES "multi_room_reservations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_room_reservations" ADD CONSTRAINT "multi_room_reservations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "multi_room_reservations" ADD CONSTRAINT "multi_room_reservations_created_by_id_fkey" FOREIGN KEY ("created_by_id") REFERENCES "employees"("id") ON DELETE SET NULL ON UPDATE CASCADE;
