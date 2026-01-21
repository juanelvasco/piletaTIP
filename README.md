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

🏊‍♂️ Sistema de Gestión de Natatorio
Mostrar imagen
Mostrar imagen
Mostrar imagen
Mostrar imagen
Sistema integral de gestión para natatorios y piscinas municipales o privadas, desarrollado con stack MERN (MongoDB, Express, React, Node.js).

📋 Tabla de Contenidos

Características
Demo
Tecnologías
Requisitos Previos
Instalación
Configuración
Uso
Estructura del Proyecto
API Endpoints
Despliegue
Mantenimiento
Roadmap
Contribuir
Licencia
Contacto


✨ Características
🎯 Funcionalidades Principales

Control de Acceso con QR: Escaneo rápido y validación automática
Gestión de Abonos: Tipos configurables dinámicamente
Aptos Médicos: Control de vencimientos y alertas
Multi-Rol: Admin, Enfermero y Usuario
Reportes Financieros: Planilla de ingresos exportable a CSV
Historial Completo: Registro de todos los accesos y transacciones
Dashboard Personalizado: Vista específica por rol
Responsive Design: Funciona en desktop, tablet y móvil

🔐 Seguridad

Autenticación JWT con tokens seguros
Contraseñas encriptadas con bcrypt
Protección de rutas por rol
Validación de datos en frontend y backend
Códigos QR únicos por usuario

📊 Reportes y Estadísticas

Dashboard con métricas en tiempo real
Exportación de ingresos a CSV
Filtros por fecha, tipo de abono y método de pago
Historial de accesos por usuario
Tasa de éxito de escaneos


🎬 Demo
Screenshots
Dashboard Administrador:
Mostrar imagen
Escaneo QR:
Mostrar imagen
Gestión de Abonos:
Mostrar imagen
Video Demo
Ver video de demostración

🛠️ Tecnologías
Frontend

React 18.2: Librería UI moderna
React Router 6: Enrutamiento SPA
Tailwind CSS: Framework de estilos utility-first
Axios: Cliente HTTP
QRCode.js: Generación de códigos QR
html5-qrcode: Escaneo de códigos QR
Vite: Build tool ultra-rápido

Backend

Node.js 18+: Runtime JavaScript
Express 4: Framework web minimalista
MongoDB 6: Base de datos NoSQL
Mongoose: ODM para MongoDB
JWT: Autenticación basada en tokens
bcryptjs: Encriptación de contraseñas
Cors: Manejo de CORS
dotenv: Variables de entorno

DevOps

Git: Control de versiones
PM2: Process manager para Node.js
Nginx: Servidor web y reverse proxy
MongoDB Atlas: Base de datos en la nube


📦 Requisitos Previos
Antes de comenzar, asegúrate de tener instalado:

Node.js >= 18.0.0
npm >= 9.0.0 o yarn >= 1.22.0
MongoDB >= 6.0 (local o Atlas)
Git (opcional, para clonar el repositorio)

Verificar versiones:
bashnode --version
npm --version
mongod --version

🚀 Instalación
1. Clonar el Repositorio
bashgit clone https://github.com/tu-usuario/natatorio-sistema.git
cd natatorio-sistema
2. Instalar Dependencias
Backend:
bashcd backend
npm install
Frontend:
bashcd frontend
npm install
3. Configurar Variables de Entorno
Backend (backend/.env):
env# Puerto del servidor
PORT=5000

# MongoDB
MONGODB_URI=mongodb://localhost:27017/natatorio
# O MongoDB Atlas:
# MONGODB_URI=mongodb+srv://usuario:password@cluster.mongodb.net/natatorio

# JWT
JWT_SECRET=tu_clave_secreta_muy_segura_cambiame
JWT_EXPIRE=30d

# Entorno
NODE_ENV=development
Frontend (frontend/.env):
env# URL del backend
VITE_API_URL=http://localhost:5000/api

# Nombre de la aplicación
VITE_APP_NAME=Sistema Natatorio
4. Inicializar Base de Datos
Opción A: MongoDB Local
bash# Iniciar MongoDB
mongod
Opción B: MongoDB Atlas

Crear cuenta en MongoDB Atlas
Crear cluster gratuito
Crear usuario de base de datos
Whitelist IP: 0.0.0.0/0 (todas las IPs)
Copiar connection string a MONGODB_URI en .env

5. Crear Usuario Administrador Inicial
bashcd backend
node scripts/createAdmin.js
Esto crea un usuario admin con:

Email: admin@natatorio.com
Password: admin123

⚠️ Cambiar contraseña inmediatamente después del primer login
6. Iniciar el Sistema
Modo Desarrollo:
En dos terminales separadas:
Terminal 1 - Backend:
bashcd backend
npm run dev
Terminal 2 - Frontend:
bashcd frontend
npm run dev
Acceder a: http://localhost:5173
Modo Producción:
bash# Backend
cd backend
npm start

# Frontend (compilar)
cd frontend
npm run build
# Los archivos estarán en /frontend/dist

⚙️ Configuración
Configuración de Tipos de Abono

Login como administrador
Ir a "Configuración de Tarifas"
Agregar tipos de abono según tus necesidades:

Ejemplos:
- Mensual: $5000, 30 días
- Trimestral: $13500, 90 días
- Mensual Estudiantes: $4000, 30 días
- Mensual Adultos Mayores: $3000, 30 días
Carga de Usuarios
Manualmente:

Ir a "Usuarios" → "Crear Usuario"
Completar formulario
El código QR se genera automáticamente

Masivamente (desde CSV):
bashcd backend
node scripts/importUsers.js usuarios.csv
Formato del CSV:
csvnombre,apellido,email,dni,telefono
Juan,Pérez,juan@email.com,12345678,1234567890
María,García,maria@email.com,87654321,0987654321

📖 Uso
Roles de Usuario
👨‍💼 Administrador
Acceso completo al sistema:

✅ Gestionar usuarios (crear, editar, banear)
✅ Gestionar abonos (crear, marcar pagos)
✅ Configurar tipos de abono
✅ Escanear QR para control de acceso
✅ Ver reportes financieros
✅ Cargar aptos médicos

Dashboard: Estadísticas generales + acceso a todas las funcionalidades
👩‍⚕️ Enfermero
Permisos limitados:

✅ Cargar aptos médicos
✅ Ver lista de usuarios
✅ Ver alertas de vencimientos
❌ No puede gestionar abonos ni ver ingresos

Dashboard: Gestión de aptos médicos + alertas
👤 Usuario Regular
Permisos mínimos:

✅ Ver su propio perfil
✅ Ver su código QR
✅ Ver estado de su abono y apto médico
✅ Ver historial de accesos
✅ Editar su perfil (email, teléfono, foto)
❌ No puede ver otros usuarios

Dashboard: Información personal + estado de abono/apto
Flujo Típico
1. Registro de Nuevo Usuario

Admin crea usuario en el sistema
Sistema genera código QR único
Usuario recibe su QR (impreso o digital)

2. Carga de Apto Médico

Enfermero escanea QR del usuario
Selecciona días de validez (15, 30, 60, etc.)
Confirma carga
Sistema calcula fecha de vencimiento

3. Creación de Abono

Admin escanea QR del usuario
Selecciona tipo de abono
Precio se carga automáticamente
Crea abono (estado: Pendiente)

4. Registro de Pago

Usuario paga (efectivo, MercadoPago, transferencia)
Admin marca abono como "Pagado"
Selecciona método de pago
Abono queda activo

5. Control de Acceso

Usuario presenta su QR en la entrada
Admin escanea el código
Sistema valida:

✅ Usuario activo
✅ Abono vigente y pagado
✅ Apto médico vigente


Resultado inmediato: Permitido ✅ o Denegado ❌
Se registra el acceso


📁 Estructura del Proyecto
natatorio-sistema/
├── backend/                      # Servidor Node.js + Express
│   ├── config/
│   │   └── db.js                 # Configuración MongoDB
│   ├── controllers/
│   │   ├── authController.js     # Autenticación
│   │   ├── userController.js     # CRUD usuarios
│   │   ├── abonoController.js    # CRUD abonos
│   │   ├── configuracionController.js # Tipos de abono
│   │   └── escaneoController.js  # Escaneos y salud
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT + verificación roles
│   ├── models/
│   │   ├── Usuario.js            # Schema usuarios
│   │   ├── Abono.js              # Schema abonos
│   │   ├── Configuracion.js      # Schema configuración
│   │   ├── Escaneo.js            # Schema escaneos
│   │   └── PruebaSalud.js        # Schema aptos médicos
│   ├── routes/
│   │   ├── auth.js               # Rutas autenticación
│   │   ├── users.js              # Rutas usuarios
│   │   ├── abonos.js             # Rutas abonos
│   │   ├── configuracion.js      # Rutas configuración
│   │   ├── escaneos.js           # Rutas escaneos
│   │   ├── salud.js              # Rutas salud
│   │   └── reportes.js           # Rutas reportes
│   ├── scripts/
│   │   ├── createAdmin.js        # Crear admin inicial
│   │   └── importUsers.js        # Importar usuarios CSV
│   ├── .env.example              # Ejemplo variables de entorno
│   ├── server.js                 # Punto de entrada
│   └── package.json
│
├── frontend/                     # Cliente React + Vite
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── assets/               # Imágenes, logos
│   │   ├── components/           # Componentes reutilizables
│   │   │   ├── Navbar.jsx
│   │   │   └── Modal.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Context de autenticación
│   │   ├── pages/
│   │   │   ├── admin/            # Páginas del admin
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   ├── Usuarios.jsx
│   │   │   │   ├── Abonos.jsx
│   │   │   │   ├── ConfiguracionTarifas.jsx
│   │   │   │   ├── EscanearQR.jsx
│   │   │   │   └── PlanillaIngresos.jsx
│   │   │   ├── enfermero/        # Páginas del enfermero
│   │   │   │   ├── Dashboard.jsx
│   │   │   │   └── CargarApto.jsx
│   │   │   ├── user/             # Páginas del usuario
│   │   │   │   └── Dashboard.jsx
│   │   │   └── Login.jsx
│   │   ├── services/             # Servicios API
│   │   │   ├── api.js            # Cliente Axios
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── abonoService.js
│   │   │   ├── escaneoService.js
│   │   │   └── statsService.js
│   │   ├── App.jsx               # Componente principal
│   │   ├── main.jsx              # Punto de entrada
│   │   └── index.css             # Estilos Tailwind
│   ├── .env.example
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
│
├── docs/                         # Documentación
│   ├── MANUAL_COMPLETO_SISTEMA_NATATORIO.md
│   ├── MANUAL_DEL_COMPRADOR.md
│   ├── API.md                    # Documentación API
│   ├── DEPLOYMENT.md             # Guía de despliegue
│   └── screenshots/              # Capturas de pantalla
│
├── .gitignore
├── LICENSE
└── README.md                     # Este archivo

🔌 API Endpoints
Autenticación
POST   /api/auth/login           # Iniciar sesión
GET    /api/auth/me              # Obtener usuario actual
Usuarios
GET    /api/users                # Listar usuarios (Admin)
POST   /api/users                # Crear usuario (Admin)
GET    /api/users/:id            # Obtener usuario por ID
PUT    /api/users/:id            # Actualizar usuario
DELETE /api/users/:id            # Eliminar usuario (Admin)
PUT    /api/users/:id/banear     # Banear/desbanear usuario (Admin)
GET    /api/users/estadisticas   # Estadísticas de usuarios (Admin)
Abonos
GET    /api/abonos               # Listar abonos (Admin)
POST   /api/abonos               # Crear abono (Admin)
GET    /api/abonos/mi-abono      # Obtener mi abono (Usuario)
GET    /api/abonos/:id           # Obtener abono por ID
PUT    /api/abonos/:id/pagar     # Marcar como pagado (Admin)
DELETE /api/abonos/:id           # Eliminar abono (Admin)
GET    /api/abonos/tipos-unicos  # Obtener tipos de abono
Configuración
GET    /api/configuracion         # Obtener configuración
PUT    /api/configuracion         # Actualizar configuración (Admin)
Escaneos
POST   /api/escaneos/escanear     # Registrar escaneo (Admin)
GET    /api/escaneos/hoy          # Escaneos del día (Admin)
GET    /api/escaneos/mi-historial # Historial del usuario
GET    /api/escaneos/estadisticas # Estadísticas de escaneos (Admin)
Salud (Aptos Médicos)
POST   /api/salud                 # Crear apto (Admin/Enfermero)
GET    /api/salud/mi-prueba       # Obtener mi apto (Usuario)
GET    /api/salud/estadisticas    # Estadísticas de aptos (Admin)
Reportes
GET    /api/reportes/ingresos     # Planilla de ingresos (Admin)
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


*Última actualización: Enero 2026*

