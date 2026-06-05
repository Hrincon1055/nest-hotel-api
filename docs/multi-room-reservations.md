# Reserva Multiple de Habitaciones

## Resumen

La funcionalidad de reserva multiple agrega un flujo independiente para crear varias reservas individuales en una sola operacion.

La compatibilidad hacia atras se mantiene porque:

- La tabla `reservations` conserva su relacion actual con `rooms` mediante `room_id`.
- Los endpoints, DTOs y respuestas del flujo individual no fueron reemplazados.
- La nueva funcionalidad usa una entidad agrupadora `multi_room_reservations` y una relacion opcional desde `reservations`.

## Modelo de datos

Cambios en Prisma:

- Nueva tabla `multi_room_reservations`.
- Nueva columna opcional `reservations.multi_room_reservation_id`.
- Relacion uno a muchos entre una reserva multiple y varias reservas individuales.

Esto permite reutilizar toda la logica existente de reservas por habitacion sin romper integraciones previas.

## Flujo de creacion

1. Se valida cliente, rango de fechas y habitaciones duplicadas.
2. Se cargan todas las habitaciones solicitadas y se valida capacidad por cada una.
3. Se verifica disponibilidad para todas las habitaciones en el mismo rango.
4. Si una sola validacion falla, la transaccion completa se cancela.
5. Si todo es valido, se crea un registro en `multi_room_reservations` y luego una reserva individual por cada habitacion.

## Endpoints nuevos

- `POST /api/v1/reservations/multi-room`
- `GET /api/v1/reservations/multi-room`
- `GET /api/v1/reservations/multi-room/code/:code`
- `GET /api/v1/reservations/multi-room/:id`
- `POST /api/v1/reservations/multi-room/:id/confirm`
- `POST /api/v1/reservations/multi-room/:id/cancel`

## Consideraciones operativas

- La confirmacion cambia todas las reservas hijas de `PENDING` a `CONFIRMED`.
- La cancelacion cancela todas las reservas hijas elegibles y libera habitaciones en estado `RESERVED`.
- El estado mostrado para la reserva multiple es un resumen derivado de los estados de sus reservas hijas.

## Migracion incluida

La migracion generada es:

- `prisma/migrations/20260604194843_add`

Contenido principal:

- Creacion de `multi_room_reservations`.
- Nueva FK opcional desde `reservations`.
- Indices para codigo, cliente y rango de fechas.

## Despliegue recomendado

En servidores existentes, aplicar en este orden:

1. Actualizar codigo fuente.
2. Ejecutar `npx prisma migrate deploy --config prisma.config.ts`.
3. Reiniciar la API.
4. Verificar en Swagger los endpoints nuevos.

Si el despliegue se hace con Docker en este proyecto, el `CMD` del contenedor ya ejecuta `prisma migrate deploy` antes de iniciar la API.
