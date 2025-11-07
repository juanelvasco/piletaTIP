
# 📊 Sistema de Control de Acceso para Pileta

**Proyecto:** Pileta Control Acceso  
**Stack:** MERN (MongoDB, Express, React, Node.js)  
**Fecha:** Noviembre 2025  

---

## 🎯 Resumen

Este es un sistema completo de control de acceso para una pileta/natatorio que incluye:

✅ Gestión de usuarios con diferentes roles (admin/usuario)  
✅ Sistema de abonos (mensual, trimestral, semestral, anual)  
✅ Control de pruebas de salud con fechas de vencimiento  
✅ Sistema de escaneo QR para control de acceso  
✅ Reportes y estadísticas de accesos  
✅ Autenticación JWT con bcrypt  
✅ Panel de administración completo  

---

## 📁 Estructura del Proyecto

```bash
pileta-control-acceso/
├── backend/                    # API REST con Express
│   ├── controllers/            # Lógica de negocio
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── abonoController.js
│   │   ├── saludController.js
│   │   ├── escaneoController.js
│   │   └── configController.js
│   ├── models/                 # Modelos de MongoDB
│   │   ├── Usuario.js
│   │   ├── Abono.js
│   │   ├── Escaneo.js
│   │   ├── PruebaSalud.js
│   │   └── Configuracion.js
│   ├── routes/                 # Rutas de la API
│   ├── middleware/             # Middlewares (auth)
│   ├── config/                 # Configuraciones
│   ├── server.js               # Punto de entrada
│   └── package.json
│
└── frontend/                   # React con Vite
    ├── src/
    │   ├── pages/              # Páginas de la app
    │   │   ├── auth/           # Login, Register
    │   │   ├── user/           # Dashboard usuario
    │   │   └── admin/          # Panel admin
    │   ├── components/         # Componentes reutilizables
    │   ├── context/            # Context API (AuthContext)
    │   ├── services/           # API calls
    │   └── App.jsx
    └── package.json



🗄️ Backend
📦 Tecnologías y Dependencias
{
  "express": "^5.1.0",
  "mongoose": "^8.19.1",
  "bcryptjs": "^3.0.2",
  "jsonwebtoken": "^9.0.2",
  "cors": "^2.8.5",
  "dotenv": "^17.2.3"
}

🔐 Sistema de Autenticación
Características:
Hash de contraseñas con bcrypt (salt 10)
Tokens JWT para sesiones
Middleware de verificación de token
Roles: admin y usuario
Rutas de Auth (/api/auth):
POST /register - Registro de usuarios
POST /login - Login y generación de token
GET /me - Obtener perfil (requiere token)
PUT /me - Actualizar perfil (requiere token)
PUT /cambiar-password - Cambiar contraseña
👤 Modelo Usuario
Campos principales:
{
  // Datos personales
  nombre, apellido, email, password, dni, telefono,
  
  // Control de acceso
  rol: 'admin' | 'usuario',
  qrCode: "USER-{dni}-{timestamp}-{random}",
  activo: Boolean,
  baneado: Boolean,
  
  // Referencias
  abonoActual: ObjectId (ref: Abono),
  pruebaSalud: ObjectId (ref: PruebaSalud)
}

Funcionalidades destacadas:
Generación automática de QR único por usuario
Hash automático de password antes de guardar (pre-save hook)
Método compararPassword() para login
Virtual nombreCompleto
💳 Modelo Abono
Tipos de abono:
Mensual: $15,000
Trimestral: $40,000
Semestral: $75,000
Anual: $140,000
Campos principales:
{
  usuario: ObjectId,
  fechaInicio, fechaFin,
  tipoAbono: 'mensual' | 'trimestral' | 'semestral' | 'anual',
  precio: Number,
  pagado: Boolean,
  metodoPago: 'efectivo' | 'mercadopago' | 'transferencia',
  activo: Boolean,
  mercadoPagoId, mercadoPagoStatus // Para integración futura
}

Métodos destacados:
crearAbono(usuarioId, tipoAbono, precio) - Calcula automáticamente fecha de fin
marcarComoPagado(metodoPago, transaccionId) - Activa el abono y actualiza usuario
proximoAVencer() - Detecta abonos que vencen en 3 días
Virtual vigente - Verifica si el abono está activo y dentro de fechas
Virtual diasRestantes - Calcula días hasta vencimiento
🏥 Modelo PruebaSalud
Características:
Validez de 15 días desde la fecha de prueba
Una sola prueba activa por usuario
Sistema de alertas para vencimientos próximos
Métodos importantes:
- crearOActualizar(usuarioId, adminId, notas)
- renovar(adminId, notas)
- obtenerPendientesAlerta(diasAntes = 2)
- obtenerVencidas()
- actualizarVencidas()

Virtuals:
diasHastaVencimiento - Días restantes
estadoLegible - Estado con formato legible ("Vigente - X días", "Crítico", etc.)
📊 Modelo Escaneo
Sistema de registro de accesos:
Motivos de rechazo posibles:
abono_vencido
abono_no_pagado
sin_abono
usuario_baneado
usuario_inactivo
prueba_salud_vencida
sin_prueba_salud
qr_invalido
Métodos de análisis:
- registrarAcceso(datos)
- obtenerEstadisticas(filtros)
- historialUsuario(usuarioId, limite)
- accesosDia(fecha)
- rechazosPorMotivo(fechaInicio, fechaFin)

⚙️ Modelo Configuración
Sistema singleton (solo un documento de configuración):
{
  tarifas: { mensual, trimestral, semestral, anual },
  pruebaSalud: { diasValidez: 15, diasAlertaAntes: 2 },
  abonos: { diasAlertaVencimiento: 3, ... },
  sistema: { 
    nombrePileta, 
    horarioApertura, 
    horarioCierre, 
    diasLaborables 
  },
  mercadopago: { activo, publicKey, accessToken }
}


⚛️ Frontend 
📦 Tecnologías
{
  "react": "^19.1.1",
  "react-router-dom": "^7.9.4",
  "axios": "^1.12.2",
  "html5-qrcode": "^2.3.8",  // Escaneo de QR
  "qrcode": "^1.5.4",         // Generación de QR
  "tailwindcss": "^3.4.18",   // Estilos
  "vite": "^7.1.7"            // Build tool
}

🛣️ Rutas del Sistema
Públicas:
/login - Página de login
/register - Registro de usuarios
Usuario (requiere autenticación):
/usuario/dashboard - Dashboard del usuario
Admin (requiere rol admin):
/admin/dashboard - Dashboard principal
/admin/usuarios - Gestión de usuarios
/admin/abonos - Gestión de abonos
/admin/salud - Gestión de pruebas de salud
/admin/escanear - Escaneo de QR para acceso
/admin/reportes - Reportes y estadísticas
🔒 Sistema de Protección de Rutas
ProtectedRoute Component:
Verifica token JWT
Permite rutas solo para admin con prop adminOnly={true}
Redirige a login si no autenticado
Redirige a dashboard de usuario si no es admin
🎨 Context API
AuthContext - Manejo de autenticación:
Estado global de usuario
Token JWT
Funciones de login/logout
Verificación de rol

🔑 Variables de Entorno (.env)
# Backend
PORT=5000
MONGODB_URI=mongodb+srv://admin:password@cluster.mongodb.net/pileta-control
JWT_SECRET=mi_secreto_super_seguro_para_jwt_2025
FRONTEND_URL=http://localhost:5173
MP_ACCESS_TOKEN=tu_token_mercadopago  # Para futuro

⚠️ IMPORTANTE: Las credenciales están expuestas en el archivo .env. En producción deberían estar en variables de entorno del servidor.

🎯 Funcionalidades Principales
1. Gestión de Usuarios
Registro con email único y DNI único
Login con email/password
Generación automática de QR personal
Perfiles con foto (preparado)
Sistema de baneo temporal
2. Sistema de Abonos
4 tipos de abonos con precios configurables
Cálculo automático de fecha de fin según tipo
Alertas de vencimiento (3 días antes)
Múltiples métodos de pago
Integración preparada para MercadoPago
3. Control de Salud
Pruebas válidas por 15 días
Renovación automática o manual
Sistema de alertas (2 días antes)
Una prueba activa por usuario
4. Control de Acceso
Escaneo de QR en entrada
Verificación múltiple:
✅ Usuario activo y no baneado
✅ Abono vigente y pagado
✅ Prueba de salud vigente
Registro detallado de cada acceso
Motivos de rechazo específicos
5. Reportes y Estadísticas
Accesos diarios
Estadísticas por período
Rechazos por motivo
Historial por usuario
Usuarios con abonos por vencer
Pruebas de salud vencidas
