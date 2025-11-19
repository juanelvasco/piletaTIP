# 🏊‍♂️ Sistema de Gestión de Piletas

Sistema completo de gestión y control de acceso para piletas públicas y natatorios desarrollado con stack MERN (MongoDB, Express, React, Node.js). Incluye control de acceso por código QR, gestión de abonos, administración de usuarios, control de certificados médicos de aptitud física y reportes detallados.

## 📋 Características Principales

### Control de Acceso
- ✅ Escaneo de códigos QR para validar acceso
- ✅ Validación en tiempo real de membresías activas
- ✅ Verificación de certificados médicos de aptitud física
- ✅ Historial completo de accesos
- ✅ Rechazo manual de accesos con motivos registrados

### Gestión de Abonos
- 💳 Múltiples tipos de abonos configurables (mensual, trimestral, semestral, anual)
- 💰 Configuración flexible de tarifas
- 📊 Seguimiento de pagos y estados
- 🔄 Renovaciones automáticas
- 📱 Código QR único por usuario

### Gestión de Usuarios
- 👥 Sistema de roles: Admin, Enfermero, Usuario
- 📝 Registro completo de datos personales
- 🚫 Sistema de baneo con motivos
- 🔍 Búsqueda avanzada y filtros
- 📈 Estadísticas de usuarios

### Salud y Certificaciones
- 🏥 Gestión de certificados médicos de aptitud física
- 📅 Control de vigencia de certificados
- 👨‍⚕️ Panel específico para enfermeros
- ⚠️ Alertas de certificados vencidos

### Reportes y Estadísticas
- 📊 Dashboard con métricas en tiempo real
- 📈 Reportes de accesos por fecha
- 💵 Reportes financieros
- 🔍 Filtros avanzados por fecha, tipo de abono, estado de pago
- 📉 Análisis de rechazos y motivos

## 🛠️ Stack Tecnológico

### Backend
- **Node.js** con Express.js
- **MongoDB** con Mongoose (ODM)
- **JWT** para autenticación
- **bcryptjs** para encriptación de contraseñas
- **CORS** para comunicación cross-origin
- **Express Validator** para validación de datos

### Frontend
- **React 18** con Vite
- **React Router DOM** para navegación
- **Tailwind CSS** para estilos
- **Axios** para peticiones HTTP
- **Context API** para manejo de estado global
- **QRCode.react** para generación de códigos QR
- **Html5-qrcode** para escaneo de QR

## 📁 Estructura del Proyecto

```
proyecto/
├── backend/
│   ├── controllers/          # Lógica de negocio
│   │   ├── abonoController.js
│   │   ├── authController.js
│   │   ├── configController.js
│   │   ├── escaneoController.js
│   │   ├── saludController.js
│   │   └── userController.js
│   ├── middleware/           # Middlewares
│   │   └── auth.js          # Autenticación JWT
│   ├── models/              # Modelos de MongoDB
│   │   ├── Abono.js
│   │   ├── Configuracion.js
│   │   ├── Escaneo.js
│   │   ├── PruebaSalud.js
│   │   ├── Tarifa.js
│   │   └── Usuario.js
│   ├── routes/              # Rutas de la API
│   │   ├── abonos.js
│   │   ├── auth.js
│   │   ├── config.js
│   │   ├── escaneos.js
│   │   ├── salud.js
│   │   └── users.js
│   ├── .env                 # Variables de entorno
│   ├── server.js            # Punto de entrada
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/      # Componentes reutilizables
    │   │   └── ProtectedRoute.jsx
    │   ├── context/         # Context API
    │   │   └── AuthContext.jsx
    │   ├── pages/           # Páginas de la aplicación
    │   │   ├── admin/       # Páginas de administrador
    │   │   │   ├── Abonos.jsx
    │   │   │   ├── Dashboard.jsx
    │   │   │   ├── EscanearQR.jsx
    │   │   │   ├── Reportes.jsx
    │   │   │   └── Usuarios.jsx
    │   │   ├── auth/        # Autenticación
    │   │   │   ├── Login.jsx
    │   │   │   └── Register.jsx
    │   │   ├── enfermero/   # Panel de enfermero
    │   │   │   ├── CargarApto.jsx
    │   │   │   ├── Dashboard.jsx
    │   │   │   └── Usuarios.jsx
    │   │   └── user/        # Panel de usuario
    │   │       ├── Dashboard.jsx
    │   │       └── MiQR.jsx
    │   ├── services/        # Servicios API
    │   │   ├── abonoService.js
    │   │   ├── api.js
    │   │   ├── authService.js
    │   │   ├── escaneoService.js
    │   │   ├── statsService.js
    │   │   └── userService.js
    │   ├── App.jsx
    │   └── main.jsx
    ├── .env                 # Variables de entorno
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

## 🚀 Instalación y Configuración

### Prerequisitos

- Node.js (v16 o superior)
- MongoDB Atlas (o instancia local de MongoDB)
- npm o yarn

### 1. Clonar el repositorio

```bash
git clone <url-del-repositorio>
cd proyecto
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` con las siguientes variables:

```env
# Configuración del servidor
PORT=5000

# MongoDB Atlas - Reemplazá con tu connection string
MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/nombre-db?retryWrites=true&w=majority

# JWT Secret - Cambiá esto por algo más seguro
JWT_SECRET=tu_secreto_super_seguro_jwt

# Frontend URL (para CORS)
FRONTEND_URL=http://localhost:5173

# Para acceso desde red local (opcional)
# VITE_API_URL=http://192.168.1.X:5000/api
```

Iniciar el servidor:

```bash
npm start
```

El backend estará corriendo en `http://localhost:5000`

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env`:

```env
# URL de la API
VITE_API_URL=http://localhost:5000/api
```

Iniciar la aplicación:

```bash
npm run dev
```

El frontend estará corriendo en `http://localhost:5173`

## 👥 Roles y Permisos

### 🔴 Admin
- Gestión completa de usuarios
- Creación y gestión de membresías
- Escaneo de códigos QR para control de acceso
- Acceso a todos los reportes y estadísticas
- Configuración del sistema (tarifas, etc.)
- Rechazo manual de accesos

### 🟡 Enfermero
- Visualización de usuarios
- Carga y gestión de certificados médicos
- Verificación de aptitud física

### 🟢 Usuario
- Visualización de su propio código QR para acceso a la pileta
- Ver estado de su abono
- Historial de accesos personales
- Información de certificados médicos de aptitud física

## 📱 Uso del Sistema

### Para Administradores

1. **Dashboard**: Vista general con estadísticas del día
   - Usuarios activos/inactivos
   - Escaneos del día
   - Estado de certificados médicos

2. **Gestión de Usuarios**
   - Crear, editar y eliminar usuarios
   - Buscar por nombre, apellido, DNI o email
   - Banear usuarios con motivo
   - Ver detalles completos de cada usuario

3. **Gestión de Abonos**
   - Asignar abonos a usuarios
   - Configurar tarifas personalizadas
   - Ver estado de pagos
   - Historial completo de abonos

4. **Control de Acceso**
   - Escanear códigos QR
   - Validación automática de:
     - Membresía activa
     - Certificado médico vigente
     - Estado de baneo
   - Registrar notas en accesos
   - Rechazar accesos manualmente

5. **Reportes**
   - Filtrar por fechas
   - Filtrar por estado (aceptado/rechazado)
   - Filtrar por tipo de membresía
   - Ver motivos de rechazo
   - Exportar datos (futuro)

### Para Enfermeros

1. **Gestión de Certificados**
   - Buscar usuarios
   - Cargar certificados de aptitud física
   - Establecer fecha de vencimiento
   - Ver historial de certificados

### Para Usuarios

1. **Mi QR**
   - Ver código QR personal
   - Descargar QR como imagen
   - Ver estado de abono

2. **Dashboard**
   - Ver información de abono actual
   - Estado de certificado médico de aptitud física
   - Historial de accesos recientes a la pileta

## 🔧 Configuración del Sistema

### Tarifas

El sistema permite configurar diferentes tipos de abonos con sus respectivos precios:

- Mensual
- Trimestral
- Semestral
- Anual

Estas tarifas se gestionan desde el panel de administración y se aplican automáticamente al crear nuevos abonos.

### Certificados Médicos

Los certificados médicos de aptitud física son obligatorios para el acceso a la pileta. El sistema:
- Valida automáticamente la vigencia al intentar acceder
- Alerta cuando un certificado está próximo a vencer
- Bloquea el acceso si el certificado está vencido
- Permite al personal médico/enfermero cargar y gestionar certificados

## 🌐 Acceso desde Red Local

Para acceder desde otros dispositivos en tu red local:

1. Obtén tu IP local:
   - Windows: `ipconfig`
   - Linux/Mac: `ip addr` o `ifconfig`

2. Actualiza las variables de entorno:

**Backend (.env)**:
```env
FRONTEND_URL=http://192.168.1.X:5173
```

**Frontend (.env)**:
```env
VITE_API_URL=http://192.168.1.X:5000/api
```

3. El backend está configurado para escuchar en todas las interfaces (`0.0.0.0`)

## 🔐 Seguridad

- ✅ Contraseñas hasheadas con bcrypt
- ✅ Autenticación basada en JWT
- ✅ Tokens con expiración
- ✅ Middleware de autorización por roles
- ✅ Validación de datos en backend
- ✅ Protección CORS configurada
- ✅ Variables sensibles en archivos .env (no versionados)

## 📊 Modelos de Datos

### Usuario
- Datos personales (nombre, apellido, DNI, email, teléfono)
- Contraseña encriptada
- Rol (admin, enfermero, usuario)
- Estado (activo, baneado)
- Código QR único
- Referencia a abono actual
- Certificado médico

### Abono
- Usuario asociado
- Tipo de abono
- Precio
- Fecha de inicio y vencimiento
- Estado (activo/inactivo, pagado/impago)
- Método de pago

### Escaneo
- Usuario que escaneó
- Fecha y hora
- Estado (aceptado/rechazado)
- Motivo de rechazo (si aplica)
- Notas opcionales

### PruebaSalud
- Usuario asociado
- Fecha de emisión
- Fecha de vencimiento
- Archivo del certificado (opcional)

## 🚧 Funcionalidades Futuras

- [ ] Integración con MercadoPago para pagos online
- [ ] Notificaciones push para vencimientos de abonos y certificados
- [ ] Exportación de reportes a PDF/Excel
- [ ] Dashboard con gráficos interactivos de uso de la pileta
- [ ] Sistema de turnos para clases de natación
- [ ] Control de aforo y capacidad máxima
- [ ] App móvil nativa
- [ ] Backup automático de base de datos
- [ ] Registro de temperatura del agua y mantenimiento

---

## 👨‍💻 Autor

**Juan Hiribarren**
- GitHub: [@juanelvasco](https://github.com/juanelvasco)
- Proyecto: [piletaTIP](https://github.com/juanelvasco/piletaTIP)

---


*Última actualización: Noviembre 2025*

