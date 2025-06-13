-- CreateEnum
CREATE TYPE "train_type" AS ENUM ('EKSEKUTIF', 'BISNIS', 'EKONOMI', 'LUXURY', 'SLEEPER');

-- CreateEnum
CREATE TYPE "seat_class" AS ENUM ('EKSEKUTIF', 'BISNIS', 'EKONOMI', 'PREMIUM_EKONOMI');

-- CreateEnum
CREATE TYPE "booking_status" AS ENUM ('PENDING', 'CONFIRMED', 'PAID', 'CANCELLED', 'REFUNDED', 'USED', 'EXPIRED');

-- CreateTable
CREATE TABLE "stations" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "trains" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(10) NOT NULL,
    "name" TEXT NOT NULL,
    "type" "train_type" NOT NULL DEFAULT 'EKONOMI',
    "facilities" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "trains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "train_routes" (
    "id" TEXT NOT NULL,
    "trainId" TEXT NOT NULL,
    "departureStationId" TEXT NOT NULL,
    "arrivalStationId" TEXT NOT NULL,
    "distance" DOUBLE PRECISION,
    "estimatedDuration" INTEGER NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "train_routes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "train_schedules" (
    "id" TEXT NOT NULL,
    "routeId" TEXT NOT NULL,
    "departureTime" TEXT NOT NULL,
    "arrivalTime" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validUntil" TIMESTAMP(3) NOT NULL,
    "operatingDays" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "trainId" TEXT,

    CONSTRAINT "train_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "train_seats" (
    "id" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "trainId" TEXT NOT NULL,
    "carNumber" TEXT NOT NULL,
    "seatNumber" TEXT NOT NULL,
    "seatClass" "seat_class" NOT NULL DEFAULT 'EKONOMI',
    "price" DECIMAL(15,2) NOT NULL,
    "isAvailable" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "train_seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "train_bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "scheduleId" TEXT NOT NULL,
    "seatId" TEXT,
    "bookingCode" TEXT NOT NULL,
    "passengerName" TEXT NOT NULL,
    "passengerIdCard" TEXT NOT NULL,
    "passengerPhone" TEXT NOT NULL,
    "passengerEmail" TEXT NOT NULL,
    "departureDate" TIMESTAMP(3) NOT NULL,
    "totalPrice" DECIMAL(15,2) NOT NULL,
    "status" "booking_status" NOT NULL DEFAULT 'PENDING',
    "bookedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "train_bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "stations_code_key" ON "stations"("code");

-- CreateIndex
CREATE INDEX "stations_city_idx" ON "stations"("city");

-- CreateIndex
CREATE INDEX "stations_province_idx" ON "stations"("province");

-- CreateIndex
CREATE UNIQUE INDEX "trains_code_key" ON "trains"("code");

-- CreateIndex
CREATE INDEX "train_routes_departureStationId_idx" ON "train_routes"("departureStationId");

-- CreateIndex
CREATE INDEX "train_routes_arrivalStationId_idx" ON "train_routes"("arrivalStationId");

-- CreateIndex
CREATE UNIQUE INDEX "train_routes_trainId_departureStationId_arrivalStationId_key" ON "train_routes"("trainId", "departureStationId", "arrivalStationId");

-- CreateIndex
CREATE INDEX "train_schedules_routeId_idx" ON "train_schedules"("routeId");

-- CreateIndex
CREATE INDEX "train_schedules_validFrom_validUntil_idx" ON "train_schedules"("validFrom", "validUntil");

-- CreateIndex
CREATE INDEX "train_seats_scheduleId_idx" ON "train_seats"("scheduleId");

-- CreateIndex
CREATE INDEX "train_seats_seatClass_idx" ON "train_seats"("seatClass");

-- CreateIndex
CREATE UNIQUE INDEX "train_seats_scheduleId_trainId_carNumber_seatNumber_key" ON "train_seats"("scheduleId", "trainId", "carNumber", "seatNumber");

-- CreateIndex
CREATE UNIQUE INDEX "train_bookings_bookingCode_key" ON "train_bookings"("bookingCode");

-- CreateIndex
CREATE INDEX "train_bookings_userId_idx" ON "train_bookings"("userId");

-- CreateIndex
CREATE INDEX "train_bookings_scheduleId_idx" ON "train_bookings"("scheduleId");

-- CreateIndex
CREATE INDEX "train_bookings_departureDate_idx" ON "train_bookings"("departureDate");

-- CreateIndex
CREATE INDEX "train_bookings_status_idx" ON "train_bookings"("status");

-- AddForeignKey
ALTER TABLE "train_routes" ADD CONSTRAINT "train_routes_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "trains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_routes" ADD CONSTRAINT "train_routes_departureStationId_fkey" FOREIGN KEY ("departureStationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_routes" ADD CONSTRAINT "train_routes_arrivalStationId_fkey" FOREIGN KEY ("arrivalStationId") REFERENCES "stations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_schedules" ADD CONSTRAINT "train_schedules_routeId_fkey" FOREIGN KEY ("routeId") REFERENCES "train_routes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_schedules" ADD CONSTRAINT "train_schedules_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "trains"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_seats" ADD CONSTRAINT "train_seats_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "train_schedules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_seats" ADD CONSTRAINT "train_seats_trainId_fkey" FOREIGN KEY ("trainId") REFERENCES "trains"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_bookings" ADD CONSTRAINT "train_bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_bookings" ADD CONSTRAINT "train_bookings_scheduleId_fkey" FOREIGN KEY ("scheduleId") REFERENCES "train_schedules"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "train_bookings" ADD CONSTRAINT "train_bookings_seatId_fkey" FOREIGN KEY ("seatId") REFERENCES "train_seats"("id") ON DELETE SET NULL ON UPDATE CASCADE;
