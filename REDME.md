# 🏨 Hotel Management API

Sistema de gestión hotelera completo construido con NestJS, Prisma y PostgreSQL.

## 📋 Tabla de Contenidos

- [Requisitos Previos](#requisitos-previos)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Ejecución](#ejecución)
- [Documentación API (Swagger)](#documentación-api-swagger)
- [Acceso a Base de Datos](#acceso-a-base-de-datos)
- [Credenciales por Defecto](#credenciales-por-defecto)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Módulos](#módulos)

---

## 🔧 Requisitos Previos

- **Node.js** v18 o superior
- **Docker** y **Docker Compose**
- **npm** o **yarn**

---

## 📥 Instalación

```bash
# Clonar el repositorio
git clone <url-del-repositorio>
cd api-hotel

# Instalar dependencias
npm install --legacy-peer-deps
```

---

## ⚙️ Configuración

### 1. Variables de Entorno

Copia el archivo de ejemplo y configura las variables:

```bash
cp .env.example .env
```

Variables principales en `.env`:

```env
# Base de Datos
DATABASE_URL="postgresql://hotel_admin:hotel_secret_2024@localhost:5432/hotel_management?schema=public"
DB_HOST=localhost
DB_PORT=5432
DB_USER=hotel_admin
DB_PASSWORD=hotel_secret_2024
DB_NAME=hotel_management

# JWT
JWT_SECRET=tu-super-secreto-jwt-cambiar-en-produccion
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=tu-super-secreto-refresh-cambiar-en-produccion
JWT_REFRESH_EXPIRES_IN=7d

# Aplicación
PORT=3000
NODE_ENV=development
```

---

## 🚀 Ejecución

### Paso 1: Iniciar Base de Datos con Docker

```bash
# Iniciar PostgreSQL y pgAdmin
docker compose up -d

# Verificar que los contenedores estén corriendo
docker ps
```

### Paso 2: Configurar Prisma

```bash
# Generar el cliente de Prisma
npx prisma generate

# Ejecutar migraciones
npx prisma migrate dev --name init

# Cargar datos de prueba (seeds)
npx prisma db seed
```

### Paso 3: Iniciar el Servidor

```bash
# Modo desarrollo (con hot-reload)
npm run start:dev

# Modo producción
npm run build
npm run start:prod
```

---

## 📚 Documentación API (Swagger)

Una vez el servidor esté corriendo, accede a la documentación interactiva:

| Recurso        | URL                            |
| -------------- | ------------------------------ |
| **Swagger UI** | http://localhost:3000/api/docs |
| **API Base**   | http://localhost:3000/api/v1   |

### Autenticación en Swagger

1. Ejecuta el endpoint `POST /api/v1/auth/login` con las credenciales:

   ```json
   {
     "email": "admin@hotel.com",
     "password": "Admin123!"
   }
   ```

2. Copia el `accessToken` de la respuesta

3. Haz clic en el botón **"Authorize"** 🔒 (arriba a la derecha)

4. Pega el token en el campo y confirma

5. Ahora puedes usar todos los endpoints protegidos

---

## 🗄️ Acceso a Base de Datos

### Opción 1: Prisma Studio (Recomendado - Más Fácil)

```bash
npx prisma studio
```

- **URL**: http://localhost:5555
- Interfaz visual para ver y editar datos
- No requiere configuración adicional

### Opción 2: pgAdmin (Interfaz Web)

- **URL**: http://localhost:5050
- **Email**: `admin@hotel.com`
- **Password**: `admin123`

**Configurar conexión al servidor PostgreSQL:**

| Campo    | Valor                                                         |
| -------- | ------------------------------------------------------------- |
| Host     | `postgres` (dentro de Docker) o `localhost` (fuera de Docker) |
| Port     | `5432`                                                        |
| Database | `hotel_management`                                            |
| Username | `hotel_admin`                                                 |
| Password | `hotel_secret_2024`                                           |

### Opción 3: Terminal (psql)

```bash
# Conectar directamente al contenedor
docker exec -it hotel_postgres psql -U hotel_admin -d hotel_management

# Comandos útiles dentro de psql:
\dt                    # Listar tablas
\d nombre_tabla        # Describir tabla
SELECT * FROM "Employee";  # Consultar empleados
\q                     # Salir
```

### Opción 4: Conexión Externa (DBeaver, DataGrip, etc.)

```
Host: localhost
Port: 5432
Database: hotel_management
Username: hotel_admin
Password: hotel_secret_2024
```

---

## 🔑 Credenciales por Defecto

### Usuarios del Sistema (Seeds)

| Rol              | Email                  | Password         |
| ---------------- | ---------------------- | ---------------- |
| **Admin**        | admin@hotel.com        | Admin123!        |
| **Manager**      | manager@hotel.com      | Manager123!      |
| **Receptionist** | receptionist@hotel.com | Reception123!    |
| **Housekeeping** | housekeeping@hotel.com | Housekeeping123! |

### Base de Datos

| Campo    | Valor             |
| -------- | ----------------- |
| Host     | localhost         |
| Port     | 5432              |
| Database | hotel_management  |
| Username | hotel_admin       |
| Password | hotel_secret_2024 |

### pgAdmin

| Campo    | Valor                 |
| -------- | --------------------- |
| URL      | http://localhost:5050 |
| Email    | admin@hotel.com       |
| Password | admin123              |

---

## 📁 Estructura del Proyecto

```
api-hotel/
├── prisma/
│   ├── schema.prisma      # Esquema de base de datos
│   ├── seed.ts            # Datos iniciales
│   └── migrations/        # Migraciones
├── src/
│   ├── common/            # Utilidades compartidas
│   │   ├── decorators/    # Decoradores personalizados
│   │   ├── dto/           # DTOs comunes
│   │   ├── filters/       # Filtros de excepción
│   │   ├── guards/        # Guards de autorización
│   │   └── interceptors/  # Interceptores
│   ├── config/            # Configuraciones
│   ├── database/          # Servicio de Prisma
│   ├── modules/           # Módulos de la aplicación
│   │   ├── auth/          # Autenticación JWT
│   │   ├── customers/     # Gestión de clientes
│   │   ├── employees/     # Gestión de empleados
│   │   ├── housekeeping/  # Tareas de limpieza
│   │   ├── reservations/  # Reservaciones
│   │   ├── rooms/         # Habitaciones
│   │   └── services/      # Servicios adicionales
│   ├── app.module.ts      # Módulo principal
│   └── main.ts            # Punto de entrada
├── docker-compose.yml     # Configuración Docker
├── .env                   # Variables de entorno
└── package.json
```

---

## 📦 Módulos

| Módulo           | Descripción                          | Endpoints                                      |
| ---------------- | ------------------------------------ | ---------------------------------------------- |
| **Auth**         | Autenticación JWT con refresh tokens | `/auth/login`, `/auth/refresh`, `/auth/logout` |
| **Employees**    | CRUD de empleados con roles          | `/employees`                                   |
| **Customers**    | Gestión de clientes                  | `/customers`                                   |
| **Rooms**        | Habitaciones y disponibilidad        | `/rooms`                                       |
| **Reservations** | Reservas, check-in, check-out        | `/reservations`                                |
| **Services**     | Servicios adicionales del hotel      | `/services`                                    |
| **Housekeeping** | Tareas de limpieza                   | `/housekeeping`                                |

---

## 🛠️ Scripts Disponibles

```bash
npm run start:dev      # Desarrollo con hot-reload
npm run start:prod     # Producción
npm run build          # Compilar proyecto
npm run test           # Ejecutar tests
npm run lint           # Verificar código
npm run format         # Formatear código
```

---

## 🐳 Comandos Docker

```bash
docker compose up -d      # Iniciar contenedores
docker compose down       # Detener contenedores
docker compose logs -f    # Ver logs en tiempo real
docker compose restart    # Reiniciar contenedores
```

---

## 📝 Notas Importantes

1. **Primera ejecución**: Asegúrate de ejecutar las migraciones y seeds antes de iniciar el servidor.

2. **Tokens JWT**: Los access tokens expiran en 15 minutos. Usa el refresh token para obtener uno nuevo.

3. **Roles**: El sistema tiene 4 roles (ADMIN, MANAGER, RECEPTIONIST, HOUSEKEEPING) con diferentes permisos.

4. **Soft Delete**: Los registros no se eliminan físicamente, se marcan con `deletedAt`.

---

## 📞 Soporte

Si tienes problemas:

1. Verifica que Docker esté corriendo: `docker ps`
2. Revisa los logs: `docker compose logs -f`
3. Regenera Prisma: `npx prisma generate`
4. Reinicia los contenedores: `docker compose restart`
