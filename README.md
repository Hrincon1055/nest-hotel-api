# 🏨 Hotel Management System API

Sistema completo de gestión hotelera construido con NestJS, Prisma y PostgreSQL.

## 📋 Características

- **Autenticación JWT** con access y refresh tokens
- **RBAC** (Role-Based Access Control) con 4 roles: ADMIN, MANAGER, RECEPTIONIST, HOUSEKEEPING
- **Gestión de Habitaciones** con estados, tipos y búsqueda de disponibilidad
- **Reservas** con validación de disponibilidad y cálculo automático de precios
- **Reserva múltiple** para agrupar varias habitaciones en una sola operación transaccional
- **Check-in/Check-out** con actualización automática de estados
- **Clientes** con historial de reservas
- **Empleados** con gestión de roles y permisos
- **Servicios Adicionales** (Restaurante, Spa, Transporte, Lavandería)
- **Housekeeping** con asignación de tareas de limpieza
- **Soft Delete** en todas las entidades
- **Paginación y Filtros** en todos los endpoints
- **Swagger/OpenAPI** documentación completa
- **Rate Limiting** y seguridad con Helmet

## 🚀 Inicio Rápido

### Requisitos Previos

- Node.js 18+
- Docker y Docker Compose
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd api-hotel

# Instalar dependencias
npm install

# Copiar archivo de entorno
cp .env.example .env

# Iniciar PostgreSQL con Docker
npm run docker:up

# Generar cliente de Prisma
npm run prisma:generate

# Ejecutar migraciones
npm run prisma:migrate

# Ejecutar seeds (datos iniciales)
npm run prisma:seed

# Iniciar en modo desarrollo
npm run start:dev
```

### URLs

- **API**: http://localhost:3000/api/v1
- **Swagger Docs**: http://localhost:3000/api/docs
- **PgAdmin**: http://localhost:5050 (admin@hotel.com / admin123)

## 👤 Credenciales de Prueba

| Rol          | Email                  | Contraseña       |
| ------------ | ---------------------- | ---------------- |
| Admin        | admin@hotel.com        | Admin123!        |
| Manager      | manager@hotel.com      | Manager123!      |
| Receptionist | reception@hotel.com    | Reception123!    |
| Housekeeping | housekeeping@hotel.com | Housekeeping123! |

## 📁 Estructura del Proyecto

```
src/
├── common/                 # Utilidades compartidas
│   ├── decorators/        # Decoradores personalizados
│   ├── dto/               # DTOs comunes (paginación, respuesta)
│   ├── filters/           # Filtros de excepción
│   ├── guards/            # Guards (roles)
│   ├── interceptors/      # Interceptores (logging, transform)
│   └── interfaces/        # Interfaces comunes
├── config/                # Configuración por módulos
├── database/              # Módulo de Prisma
├── modules/
│   ├── auth/             # Autenticación JWT
│   ├── employees/        # Gestión de empleados
│   ├── customers/        # Gestión de clientes
│   ├── rooms/            # Gestión de habitaciones
│   ├── reservations/     # Gestión de reservas
│   ├── services/         # Servicios adicionales
│   └── housekeeping/     # Gestión de limpieza
├── app.module.ts
└── main.ts
prisma/
├── schema.prisma         # Esquema de base de datos
└── seed.ts               # Datos iniciales
```

## 📚 API Endpoints

### Autenticación

```
POST   /api/v1/auth/login       # Login
POST   /api/v1/auth/refresh     # Refresh tokens
POST   /api/v1/auth/logout      # Logout
POST   /api/v1/auth/me          # Usuario actual
```

### Empleados

```
GET    /api/v1/employees        # Listar (Admin, Manager)
POST   /api/v1/employees        # Crear (Admin, Manager)
GET    /api/v1/employees/:id    # Ver detalle
PATCH  /api/v1/employees/:id    # Actualizar (Admin, Manager)
DELETE /api/v1/employees/:id    # Eliminar (Admin)
```

### Clientes

```
GET    /api/v1/customers                    # Listar
POST   /api/v1/customers                    # Crear
GET    /api/v1/customers/:id                # Ver detalle
PATCH  /api/v1/customers/:id                # Actualizar
DELETE /api/v1/customers/:id                # Eliminar
GET    /api/v1/customers/:id/reservations   # Historial de reservas
```

### Habitaciones

```
GET    /api/v1/rooms              # Listar con filtros
POST   /api/v1/rooms              # Crear (Admin, Manager)
GET    /api/v1/rooms/stats        # Estadísticas
GET    /api/v1/rooms/availability # Verificar disponibilidad
GET    /api/v1/rooms/:id          # Ver detalle
PATCH  /api/v1/rooms/:id          # Actualizar (Admin, Manager)
PATCH  /api/v1/rooms/:id/status   # Cambiar estado
DELETE /api/v1/rooms/:id          # Eliminar (Admin)
```

### Reservas

```
GET    /api/v1/reservations                 # Listar con filtros
POST   /api/v1/reservations                 # Crear
GET    /api/v1/reservations/today/arrivals  # Llegadas de hoy
GET    /api/v1/reservations/today/departures # Salidas de hoy
GET    /api/v1/reservations/code/:code      # Buscar por código
GET    /api/v1/reservations/:id             # Ver detalle
PATCH  /api/v1/reservations/:id             # Actualizar
POST   /api/v1/reservations/:id/confirm     # Confirmar
POST   /api/v1/reservations/:id/check-in    # Check-in
POST   /api/v1/reservations/:id/check-out   # Check-out
POST   /api/v1/reservations/:id/cancel      # Cancelar
POST   /api/v1/reservations/:id/no-show     # Marcar no-show
DELETE /api/v1/reservations/:id             # Eliminar
```

### Reservas múltiples

```
GET    /api/v1/reservations/multi-room             # Listar con filtros
POST   /api/v1/reservations/multi-room             # Crear reserva múltiple
GET    /api/v1/reservations/multi-room/code/:code  # Buscar por código
GET    /api/v1/reservations/multi-room/:id         # Ver detalle
POST   /api/v1/reservations/multi-room/:id/confirm # Confirmar grupo
POST   /api/v1/reservations/multi-room/:id/cancel  # Cancelar grupo
```

Payload base para creación:

```json
{
  "customerId": "uuid-del-cliente",
  "checkInDate": "2026-07-01",
  "checkOutDate": "2026-07-05",
  "notes": "Reserva familiar",
  "rooms": [
    {
      "roomId": "uuid-habitacion-1",
      "adults": 2,
      "children": 1,
      "notes": "Cuna adicional"
    },
    {
      "roomId": "uuid-habitacion-2",
      "adults": 2,
      "children": 0
    }
  ]
}
```

Notas de compatibilidad:

- Los endpoints actuales de reserva individual permanecen sin cambios.
- Cada habitación del grupo crea una reserva individual enlazada a un registro agrupador.
- La operación completa se ejecuta dentro de una transacción Prisma y se revierte si falla cualquier validación.

### Servicios Adicionales

```
GET    /api/v1/services                              # Listar
POST   /api/v1/services                              # Crear (Admin, Manager)
GET    /api/v1/services/category/:category           # Por categoría
GET    /api/v1/services/:id                          # Ver detalle
PATCH  /api/v1/services/:id                          # Actualizar
DELETE /api/v1/services/:id                          # Eliminar
POST   /api/v1/services/reservation                  # Añadir a reserva
DELETE /api/v1/services/reservation/:id              # Quitar de reserva
GET    /api/v1/services/reservation/:reservationId   # Servicios de reserva
```

### Housekeeping

```
GET    /api/v1/housekeeping                    # Listar tareas
POST   /api/v1/housekeeping                    # Crear tarea
GET    /api/v1/housekeeping/today              # Tareas de hoy
GET    /api/v1/housekeeping/pending            # Tareas pendientes
GET    /api/v1/housekeeping/my-tasks           # Mis tareas (Housekeeping)
GET    /api/v1/housekeeping/:id                # Ver detalle
PATCH  /api/v1/housekeeping/:id                # Actualizar
PATCH  /api/v1/housekeeping/:id/assign         # Asignar empleado
POST   /api/v1/housekeeping/:id/start          # Iniciar limpieza
POST   /api/v1/housekeeping/:id/complete       # Completar limpieza
DELETE /api/v1/housekeeping/:id                # Eliminar
```

## 🔧 Scripts Disponibles

```bash
npm run start:dev       # Desarrollo con hot-reload
npm run start:prod      # Producción
npm run build           # Compilar

npm run docker:up       # Iniciar Docker
npm run docker:down     # Detener Docker
npm run docker:logs     # Ver logs de Docker

npm run prisma:generate # Generar cliente Prisma
npm run prisma:migrate  # Ejecutar migraciones
npm run prisma:migrate:prod # Aplicar migraciones en producción
npm run prisma:studio   # Abrir Prisma Studio
npm run prisma:seed     # Ejecutar seeds
npm run prisma:reset    # Reset de base de datos
```

## 🔐 Seguridad

- JWT con tokens de acceso (15min) y refresh (7 días)
- Contraseñas hasheadas con bcrypt (12 rounds)
- Rate limiting (100 requests/minuto)
- Helmet para headers de seguridad
- CORS configurado
- Validación de entrada con class-validator

## 🏗️ Arquitectura

- **Modular Architecture**: Cada dominio en su propio módulo
- **Repository Pattern**: Abstracción de acceso a datos con Prisma
- **DTOs**: Validación y transformación de datos
- **Guards**: Protección de rutas por autenticación y roles
- **Interceptors**: Logging y transformación de respuestas
- **Exception Filters**: Manejo centralizado de errores

## 📄 Licencia

MIT
