# Motorbike API

Backend con Express + PostgreSQL + Sequelize, arquitectura por capas con migraciones y Swagger.

## Requisitos

- Node.js 22+
- Docker y Docker Compose
- PostgreSQL (si corre local sin Docker)

## Arquitectura

```
src/
├── config/              # DB config (Sequelize), swagger
├── controllers/         # Lógica de endpoints (thin)
├── repositories/        # Acceso a datos (ORM Sequelize)
├── models/              # Models Sequelize (User, Empleado, Cliente)
├── routes/              # Rutas + anotaciones Swagger
├── migrations-sequelize/ # Migraciones de base de datos (Sequelize)
├── middlewares/         # Auth, roles, error handling
└── app.js               # Setup de Express

Flujo: Routes → Controllers → Repositories → Models (Sequelize) → PostgreSQL
```

## Modelos

### User

| Campo     | Tipo      | Restricciones                       |
|-----------|-----------|-------------------------------------|
| id        | INTEGER   | PRIMARY KEY, AUTO INCREMENT         |
| nombre    | VARCHAR   | NOT NULL                            |
| correo    | VARCHAR   | NOT NULL, UNIQUE                    |
| cedula    | VARCHAR   | NOT NULL, UNIQUE                    |
| telefono  | VARCHAR   | NOT NULL                            |
| password  | VARCHAR   | NOT NULL                            |
| rol       | ENUM      | NOT NULL (admin, empleado, cliente) |
| is_active | BOOLEAN   | NOT NULL, DEFAULT true              |

### Empleado

| Campo   | Tipo    | Restricciones              |
|---------|---------|----------------------------|
| id      | INTEGER | PRIMARY KEY, AUTO INCREMENT|
| user_id | INTEGER | NOT NULL, UNIQUE, FK users |

### Cliente

| Campo   | Tipo    | Restricciones              |
|---------|---------|----------------------------|
| id      | INTEGER | PRIMARY KEY, AUTO INCREMENT|
| user_id | INTEGER | NOT NULL, UNIQUE, FK users |

### Moto

| Campo            | Tipo      | Restricciones                                  |
|------------------|-----------|------------------------------------------------|
| id               | INTEGER   | PRIMARY KEY, AUTO INCREMENT                    |
| placa            | VARCHAR   | NOT NULL, UNIQUE                               |
| marca            | VARCHAR   | NOT NULL                                       |
| modelo           | VARCHAR   | NOT NULL                                       |
| color            | VARCHAR   | NOT NULL                                       |
| cilindraje       | VARCHAR   | NOT NULL                                       |
| id_cliente       | INTEGER   | NOT NULL, FK clientes                          |
| responsible_user | INTEGER   | NOT NULL, FK users                             |
| anio             | INTEGER   | NOT NULL                                       |
| create_date      | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP            |

### Repuesto

| Campo            | Tipo      | Restricciones                                  |
|------------------|-----------|------------------------------------------------|
| id_repuesto      | INTEGER   | PRIMARY KEY, AUTO INCREMENT                    |
| referencia       | VARCHAR   | NOT NULL, UNIQUE                               |
| nombre           | VARCHAR   | NOT NULL                                       |
| stock            | INTEGER   | NOT NULL                                       |
| precio           | DOUBLE    | NOT NULL                                       |
| created_at       | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP            |
| updated_at       | TIMESTAMP | NOT NULL, DEFAULT CURRENT_TIMESTAMP            |
| responsible_user | INTEGER   | NOT NULL, FK users                             |


## Endpoints

### Auth
| Método | Ruta              | Descripción         |
|--------|-------------------|---------------------|
| POST   | /api/auth/login   | Iniciar sesión      |

### Users
| Método | Ruta                           | Descripción                                                                | Permisos                    |
|--------|--------------------------------|----------------------------------------------------------------------------|-----------------------------|
| GET    | /api/users                     | Listar usuarios (paginado, `page`, `limit`, filtros `is_active`, `rol`). Incluye `cedula` y `telefono` | Cualquier usuario activo    |
| GET    | /api/users/:id                 | Obtener usuario por ID. Incluye `cedula` y `telefono`                      | Cualquier usuario activo    |
| POST   | /api/users                     | Crear usuario. Admin: puede crear `empleado` o `cliente`. Empleado: solo `cliente`. Requiere `cedula` y `telefono` | Admin y Empleado            |
| PUT    | /api/users/:id                 | Actualizar usuario (nombre, correo, cedula, telefono obligatorios)         | Admin                       |
| DELETE | /api/users/:id                 | Eliminar usuario                                                           | Admin                       |
| PATCH  | /api/users/:id/toggle-active   | Activar/desactivar usuario (no aplica a admins)                            | Admin                       |
| PATCH  | /api/users/change-password     | Cambiar contraseña propia                                                  | Cualquier usuario activo    |
| PATCH  | /api/users/:id/reset-password  | Resetear contraseña de un usuario (no aplica a admins)                     | Admin                       |

### Motos
| Método | Ruta                          | Descripción                                                           | Permisos               |
|--------|-------------------------------|-----------------------------------------------------------------------|------------------------|
| GET    | /api/motos                    | Listar motos (paginado con `page`, `limit` y filtros `placa`, `id_propietario`) | Cualquier usuario activo|
| GET    | /api/motos/:id                | Obtener moto por ID                                                   | Cualquier usuario activo|
| POST   | /api/motos                    | Crear moto (requiere anio, valida propietario existente)                   | Admin y Empleado       |
| PUT    | /api/motos/:id                | Actualizar moto (id_propietario obligatorio, anio opcional, no create_date)| Admin y Empleado       |
| DELETE | /api/motos/:id                | Eliminar moto                                                         | Admin y Empleado       |

### Repuestos
| Método | Ruta                          | Descripción                                                           | Permisos               |
|--------|-------------------------------|-----------------------------------------------------------------------|------------------------|
| GET    | /api/repuestos                | Listar repuestos (paginado, filtros `referencia`, `nombre`. Retorna info básica) | Cualquier usuario activo|
| GET    | /api/repuestos/:id            | Obtener repuesto por ID (retorna info básica: id_repuesto, referencia, nombre, stock, precio) | Cualquier usuario activo|
| POST   | /api/repuestos                | Crear repuesto (todos los campos obligatorios, referencia única, >=0, auto user) | Admin y Empleado       |
| PUT    | /api/repuestos/:id            | Actualizar repuesto (todos los campos obligatorios, referencia única, >=0, auto user) | Admin y Empleado       |
| DELETE | /api/repuestos/:id            | Eliminar repuesto (solo si no tiene relaciones con otras entidades)    | Admin y Empleado       |

Swagger docs: http://localhost:3000/api-docs

---

## Setup y comandos

### Opción 1: Todo con Docker (recomendado)

```bash
# Crear y levantar ambos contenedores (app + db)
docker-compose up --build

# Detener los contenedores
docker-compose down

# Detener y eliminar volúmenes (limpia DB)
docker-compose down -v
```

### Opción 2: Postgres con Docker, app local

```bash
# 1. Levantar solo la base de datos
docker-compose up -d db

# 2. Configurar variables de entorno locales
cp .env.example .env
# Editar .env con tus credenciales

# 3. Instalar dependencias
npm install

# 4. Ejecutar migraciones de Sequelize
npm run migrate

# 5. Iniciar app local
npm run dev
```

### Opción 3: Todo local (sin Docker)

```bash
# 1. Crear base de datos PostgreSQL
# psql -U postgres -c "CREATE DATABASE motorbike;"

# 2. Configurar .env con los datos de tu Postgres
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=motorbike
# DB_USER=tu_usuario
# DB_PASSWORD=tu_password
# NODE_ENV=development
# JWT_KEY=tu_jwt_secret

# 3. Instalar dependencias
npm install

# 4. Ejecutar migraciones de Sequelize
npm run migrate

# 5. Iniciar
npm run dev
```

---

## Scripts disponibles

```bash
npm run dev           # Iniciar en modo desarrollo (localhost:3000)
npm start             # Iniciar en producción

# Migraciones de Sequelize
npm run migrate       # Aplicar migraciones pendientes
npm run migrate:undo  # Revertir última migración
npm run migrate:create # Crear nueva migración (agregar --name nombre)
```

---

## Variables de entorno

| Variable    | Descripción                  | Default    |
|-------------|-------------------------------|------------|
| DB_HOST     | Host de PostgreSQL            | localhost  |
| DB_PORT     | Puerto de PostgreSQL          | 5432       |
| DB_NAME     | Nombre de la base de datos   | motorbike  |
| DB_USER     | Usuario de PostgreSQL         | postgres   |
| DB_PASSWORD | Contraseña de PostgreSQL      | postgres   |
| NODE_ENV    | Entorno de ejecución          | development|
| JWT_KEY     | Clave secreta para JWT        | -          |
| PORT        | Puerto de la app              | 3000       |

Para desarrollo local, copiar `.env.example` a `.env` y ajustar las credenciales.

---

## Notas

- **ORM**: Se usa Sequelize como ORM para acceso a datos. Los Models están en `src/models/`.
- **Migraciones**: Las migraciones se ejecutan con Sequelize CLI. En Docker, se ejecutan automáticamente antes de iniciar la app.
- **Validaciones de contraseña**: Las contraseñas requieren mínimo 8 caracteres, una mayúscula, un número y un carácter especial.
- **Usuarios admin**: Los usuarios con rol admin no pueden ser activados/desactivados ni tener su contraseña reseteada por otros admins.
- **Swagger UI**: Disponible en `/api-docs` una vez que la app está corriendo.