# Guia de Despliegue - Hotel Management System

## Objetivo

Esta guia explica como:

1. Desplegar backend y frontend con Docker en Windows 11.
2. Ejecutar migraciones y seed.
3. Acceder desde cualquier equipo de la red interna.
4. Llevar el sistema a otra maquina de despliegue.

## Estructura esperada

Debes mantener estas carpetas como hermanas:

```text
api-h/
  api-hotel/
  vue-hotel/
```

La carpeta api-hotel contiene:

1. docker-compose.yml
2. Dockerfile
3. deploy.ps1
4. deploy.bat
5. .env o .env.example

## Requisitos previos

En la maquina donde vas a desplegar necesitas:

1. Windows 11.
2. Docker Desktop instalado y en ejecución.
3. WSL 2 habilitado.
4. Las carpetas api-hotel y vue-hotel copiadas en la misma ruta base.

## Archivos importantes

1. [docker-compose.yml](docker-compose.yml): define los contenedores.
2. [Dockerfile](Dockerfile): construye el backend completo dentro de Docker.
3. [deploy.ps1](deploy.ps1): automatiza despliegue, firewall, seed y muestra URLs.
4. [deploy.bat](deploy.bat): lanzador simple para Windows.
5. [.env.example](.env.example): base para crear .env.

## Paso 1: Preparar la maquina

1. Instala Docker Desktop.
2. Verifica Docker:

```powershell
docker --version
docker-compose --version
```

3. Copia las carpetas a la maquina final. Ejemplo:

```text
D:\api-h\api-hotel
D:\api-h\vue-hotel
```

## Paso 2: Configurar variables

En [api-hotel\.env](.env) revisa al menos:

```env
DB_USER=hotel_admin
DB_PASSWORD=TuPasswordSeguro123!
DB_NAME=hotel_management

JWT_SECRET=tu-clave-super-segura
JWT_EXPIRES_IN=1d
JWT_REFRESH_EXPIRES_IN=7d

APP_PORT=80
API_PORT=3000
PGADMIN_PORT=5050

PGADMIN_EMAIL=admin@hotel.com
PGADMIN_PASSWORD=admin123
```

Si no existe .env, el script lo crea desde [.env.example](.env.example).

## Paso 3: Desplegar todo

Desde la carpeta [api-hotel](.) ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

O si prefieres doble clic:

1. Ejecuta [deploy.bat](deploy.bat).

Este script hace lo siguiente:

1. Verifica Docker.
2. Verifica la carpeta del frontend.
3. Construye las imagenes.
4. Levanta PostgreSQL, API, frontend y pgAdmin.
5. Ejecuta migraciones y seed.
6. Muestra URLs locales y URLs de red interna.

## Paso 4: Abrir acceso desde otros equipos

Si quieres que otros equipos entren por la red local, ejecuta:

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -OpenFirewall
```

Eso abre reglas para estos puertos:

1. 80 para frontend.
2. 3000 para API directa.
3. 5050 para pgAdmin.

## Paso 5: Obtener la IP del servidor

En la maquina servidor ejecuta:

```powershell
ipconfig
```

Busca la IPv4 de la red local. Ejemplo:

```text
192.168.2.8
```

## Paso 6: Acceder desde cualquier equipo de la red

Desde otro portatil o PC en la misma red, abre:

1. Frontend: `http://IP_DEL_SERVIDOR`
2. API: `http://IP_DEL_SERVIDOR:3000/api/v1`
3. Swagger: `http://IP_DEL_SERVIDOR/docs`
4. pgAdmin: `http://IP_DEL_SERVIDOR:5050`

Ejemplo:

1. `http://192.168.2.8`
2. `http://192.168.2.8:3000/api/v1`
3. `http://192.168.2.8/docs`
4. `http://192.168.2.8:5050`

## Paso 7: Usuarios de prueba

El seed crea estos usuarios:

1. `admin@hotel.com / Admin123!`
2. `manager@hotel.com / Manager123!`
3. `reception@hotel.com / Reception123!`
4. `housekeeping@hotel.com / Housekeeping123!`

## Comandos utiles

### Desplegar todo

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1
```

### Desplegar y abrir firewall

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -OpenFirewall
```

### Ejecutar solo seed

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -SeedOnly
```

### Levantar manualmente con Docker

```powershell
docker-compose up -d --build
```

### Ver estado de contenedores

```powershell
docker-compose ps
```

### Ver logs del backend

```powershell
docker-compose logs -f api
```

### Ver logs del frontend

```powershell
docker-compose logs -f frontend
```

### Ejecutar migraciones manualmente

```powershell
docker-compose exec api npx prisma migrate deploy --config prisma.config.ts
```

### Ejecutar seed manualmente

```powershell
docker-compose exec api npx prisma db seed --config prisma.config.ts
```

### Entrar al contenedor API

```powershell
docker-compose exec api sh
```

### Apagar todo

```powershell
docker-compose down
```

### Apagar y borrar volumenes

```powershell
docker-compose down -v
```

## Como moverlo a otra maquina

### Opcion A: instalacion nueva sin datos actuales

1. Copia `api-hotel` y `vue-hotel` a la maquina nueva.
2. Revisa `.env`.
3. Ejecuta:

```powershell
cd D:\api-h\api-hotel
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -OpenFirewall
```

El sistema levantara base de datos, backend, frontend, migraciones y seed.

### Opcion B: llevando tambien los datos actuales

En la maquina actual:

```powershell
docker-compose exec postgres pg_dump -U hotel_admin hotel_management > backup.sql
```

Luego copia `backup.sql` a la maquina nueva.

En la maquina nueva:

```powershell
cd D:\api-h\api-hotel
docker-compose up -d postgres
docker-compose exec -T postgres psql -U hotel_admin hotel_management < backup.sql
docker-compose up -d
```

## Solucion de problemas

### No abre desde otro equipo

Revisa:

1. Que ambos equipos esten en la misma red.
2. Que el firewall de Windows tenga abiertos los puertos.
3. Que estes usando la IP correcta del servidor.
4. Que los contenedores esten arriba con `docker-compose ps`.

### La API no responde

```powershell
docker-compose logs api --tail 100
```

### El frontend no responde

```powershell
docker-compose logs frontend --tail 100
```

### La base de datos no levanta

```powershell
docker-compose logs postgres --tail 100
```

### Quiero volver a cargar usuarios de prueba

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -SeedOnly
```

## Recomendaciones para una prueba interna

1. Cambia `DB_PASSWORD` y `JWT_SECRET` antes de moverlo a otra maquina.
2. No expongas `5050` si no necesitas pgAdmin desde otros equipos.
3. Si vas a dejarlo fijo en la red, usa una IP fija o reserva DHCP en el router.
4. Si solo quieres que entren por el frontend, comparte solo la URL del puerto 80.

## Resumen rapido

### Desplegar en maquina nueva

```powershell
cd D:\api-h\api-hotel
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -OpenFirewall
```

### Entrar desde otro equipo

```text
http://IP_DEL_SERVIDOR
```

### Ejecutar seed manual

```powershell
powershell -ExecutionPolicy Bypass -File .\deploy.ps1 -SeedOnly
```
