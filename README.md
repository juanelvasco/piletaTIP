# 🏊 piletaTIP - Sistema de Control de Acceso para Pileta Municipal

## 📋 Descripción

Sistema completo de gestión y control de acceso para piletas municipales desarrollado con el stack MERN (MongoDB, Express, React, Node.js). Incluye gestión de usuarios, abonos, códigos QR, escaneo de acceso y reportes administrativos.

---

## 🚀 Características Principales

### 👥 Gestión de Usuarios
- ✅ Sistema de autenticación JWT con roles (admin/usuario)
- ✅ Registro y login con validación
- ✅ Perfiles con foto (base64)
- ✅ Edición de datos personales
- ✅ Sistema de baneo temporal
- ✅ Generación automática de código QR único por usuario
- ✅ Filtros y búsqueda avanzada
- ✅ Paginación

### 💳 Sistema de Abonos
- ✅ 4 tipos de abonos: mensual, trimestral, semestral, anual
- ✅ Cálculo automático de fecha de vencimiento
- ✅ Múltiples métodos de pago (efectivo, transferencia, mercadopago)
- ✅ Marcado de abonos como pagados
- ✅ Alertas de vencimiento (3 días antes)
- ✅ Validación automática de vigencia
- ✅ Historial completo de abonos por usuario
- ✅ Estadísticas de abonos pagados/pendientes
- ✅ Filtros por tipo y estado de pago

### 📱 Sistema de QR y Control de Acceso
- ✅ Generación automática de código QR para cada usuario
- ✅ Visualización del QR en formato grande (300x300px)
- ✅ Descarga del QR como imagen PNG
- ✅ Escaneo con cámara (requiere HTTPS)
- ✅ Escaneo manual por entrada de código
- ✅ Validaciones automáticas en tiempo real:
  - Usuario activo/baneado
  - Abono existente, pagado y vigente
  - Prueba de salud vigente
- ✅ Feedback visual inmediato (verde/rojo)
- ✅ 8 tipos diferentes de rechazo identificados
- ✅ Registro completo de todos los escaneos
- ✅ Historial de accesos por usuario
- ✅ Estadísticas en tiempo real del día
- ✅ Campo de notas opcional en cada escaneo

### 📊 Dashboard Administrativo
- ✅ Estadísticas en tiempo real:
  - Total de usuarios
  - Abonos activos
  - Accesos del día
  - Pruebas de salud vigentes
- ✅ Accesos rápidos a todas las funciones
- ✅ Diseño responsive (móvil y escritorio)
- ✅ Actualización manual de estadísticas

### 👤 Dashboard de Usuario
- ✅ Visualización del estado del abono actual
- ✅ Información detallada de vigencia
- ✅ Días restantes calculados en tiempo real
- ✅ Alertas de vencimiento
- ✅ Historial de abonos personales
- ✅ Acceso al código QR personal
- ✅ Historial de accesos a la pileta
- ✅ Estado de prueba de salud

---

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js** v18+
- **Express.js** v5.1.0
- **MongoDB** con Mongoose v8.19.1
- **JWT** para autenticación
- **bcrypt** para encriptación de contraseñas
- **CORS** habilitado

### Frontend
- **React** v19.1.1
- **Vite** v7.1.7 (build tool)
- **React Router DOM** v7.9.4
- **Axios** v1.12.2
- **Tailwind CSS** v3.4.18
- **qrcode** v1.5.4 (generación de QR)
- **html5-qrcode** v2.3.8 (escaneo de QR)

---

## 📦 Instalación

### Requisitos Previos
- Node.js v18 o superior
- MongoDB instalado y corriendo
- npm o yarn

### 1. Clonar el repositorio
```bash
git clone https://github.com/juanelvasco/piletaTIP.git
cd piletaTIP
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

Crear archivo `.env` en `/backend`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/pileta-control
JWT_SECRET=tu_secreto_super_seguro_aqui_cambiar_en_produccion
```

Iniciar el servidor:
```bash
npm start
```

### 3. Configurar Frontend

```bash
cd frontend
npm install
```

Crear archivo `.env` en `/frontend`:
```env
# Para desarrollo local:
VITE_API_URL=http://localhost:5000/api

# Para acceso desde red local (celular):
# VITE_API_URL=http://TU_IP:5000/api
# Ejemplo: VITE_API_URL=http://192.168.1.100:5000/api
```

Iniciar la aplicación:
```bash
npm run dev
```

---

## 🌐 Acceso desde Dispositivos Móviles

### Configuración para Red Local

Para acceder desde un celular en la misma red WiFi:

#### 1. Obtener tu IP local

**Windows:**
```bash
ipconfig
```
Busca "Dirección IPv4" (ejemplo: 192.168.1.100)

**Linux/Mac:**
```bash
ip addr show
# o
ifconfig
```

#### 2. Configurar Backend

Edita `backend/server.js` - asegúrate de que escuche en `0.0.0.0`:
```javascript
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor en puerto ${PORT}`);
});
```

#### 3. Configurar Frontend

Edita `frontend/vite.config.js`:
```javascript
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
  }
})
```

Edita `frontend/.env`:
```env
VITE_API_URL=http://192.168.1.100:5000/api
```
(Reemplaza con tu IP real)

#### 4. Configurar Firewall (Windows)

Ejecutar PowerShell como Administrador:
```powershell
New-NetFirewallRule -DisplayName "Backend Port 5000" -Direction Inbound -LocalPort 5000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Frontend Port 5173" -Direction Inbound -LocalPort 5173 -Protocol TCP -Action Allow
```

#### 5. Reiniciar Servicios

Detén y vuelve a iniciar ambos servicios (Ctrl+C y `npm start` / `npm run dev`)

#### 6. Acceder desde Celular

En el navegador del celular:
```
http://192.168.1.100:5173
```
(Reemplaza con tu IP real)

### ⚠️ Nota sobre la Cámara en Móviles

Los navegadores modernos **solo permiten acceso a la cámara en:**
- ✅ `localhost` (funciona en PC)
- ✅ `https://` (conexión segura)
- ❌ `http://` en red local

**Soluciones:**
1. **Usar entrada manual** del código QR (ya implementado)
2. **Usar ngrok** para crear túnel HTTPS temporal
3. **Configurar certificados SSL** locales con mkcert

---

## 📱 Estructura del Proyecto

```
piletaTIP/
├── backend/
│   ├── controllers/          # Lógica de negocio
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── abonoController.js
│   │   ├── escaneoController.js
│   │   └── saludController.js
│   ├── models/              # Modelos de MongoDB
│   │   ├── Usuario.js
│   │   ├── Abono.js
│   │   ├── Escaneo.js
│   │   ├── PruebaSalud.js
│   │   └── Configuracion.js
│   ├── routes/              # Rutas de la API
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── abonos.js
│   │   ├── escaneos.js
│   │   └── salud.js
│   ├── middleware/          # Middlewares
│   │   └── auth.js
│   ├── server.js           # Punto de entrada
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── pages/
    │   │   ├── auth/           # Login y Register
    │   │   ├── user/           # Dashboard y MiQR
    │   │   └── admin/          # Dashboard, Usuarios, Abonos, EscanearQR
    │   ├── components/         # Componentes reutilizables
    │   │   └── ProtectedRoute.jsx
    │   ├── context/           # Context API
    │   │   └── AuthContext.jsx
    │   ├── services/          # Servicios API
    │   │   ├── api.js
    │   │   ├── userService.js
    │   │   ├── abonoService.js
    │   │   ├── escaneoService.js
    │   │   └── statsService.js
    │   └── App.jsx
    ├── vite.config.js
    └── package.json
```

---

## 🔐 Roles y Permisos

### Usuario Normal
- ✅ Ver su dashboard personal
- ✅ Ver su abono actual y vigencia
- ✅ Ver historial de abonos
- ✅ Ver y descargar su código QR
- ✅ Ver historial de accesos
- ✅ Editar su perfil (email, teléfono, foto)

### Administrador
- ✅ **Todo lo del usuario normal, más:**
- ✅ Crear, editar y banear usuarios
- ✅ Crear y gestionar abonos
- ✅ Marcar abonos como pagados
- ✅ Escanear códigos QR para control de acceso
- ✅ Ver historial de accesos de todos
- ✅ Ver estadísticas generales
- ✅ Gestionar pruebas de salud

---

## 🎯 Tipos de Abonos

| Tipo | Duración | Precio Sugerido |
|------|----------|-----------------|
| Mensual | 1 mes | $5,000 |
| Trimestral | 3 meses | $14,000 |
| Semestral | 6 meses | $26,000 |
| Anual | 12 meses | $48,000 |

*Los precios son configurables por el administrador*

---

## ⚠️ Motivos de Rechazo en Escaneo

El sistema valida automáticamente y rechaza el acceso por:

| Código | Motivo | Icono |
|--------|--------|-------|
| `qr_invalido` | Código QR no existe en el sistema | ❌ |
| `usuario_inactivo` | Usuario desactivado | ⚠️ |
| `usuario_baneado` | Usuario ha sido baneado | 🚫 |
| `sin_abono` | No tiene ningún abono asignado | 💳 |
| `abono_no_pagado` | Abono creado pero no pagado | 💰 |
| `abono_vencido` | El abono ya expiró | 📅 |
| `sin_prueba_salud` | No tiene prueba de salud | 🏥 |
| `prueba_salud_vencida` | Prueba de salud expiró | 🏥 |

---

## 🔑 API Endpoints

### Autenticación
```
POST   /api/auth/register       - Registrar usuario
POST   /api/auth/login          - Login
GET    /api/auth/me             - Obtener perfil
PUT    /api/auth/me             - Actualizar perfil
```

### Usuarios (Admin)
```
GET    /api/users               - Listar usuarios
GET    /api/users/:id           - Obtener usuario
POST   /api/users               - Crear usuario
PUT    /api/users/:id           - Actualizar usuario
PUT    /api/users/:id/ban       - Banear/desbanear usuario
```

### Abonos
```
GET    /api/abonos              - Listar abonos (Admin)
POST   /api/abonos              - Crear abono (Admin)
PUT    /api/abonos/:id/pagar    - Marcar como pagado (Admin)
GET    /api/abonos/mi-abono     - Mi abono actual (Usuario)
GET    /api/abonos/mi-historial - Mi historial (Usuario)
```

### Escaneos
```
POST   /api/escaneos/escanear   - Escanear QR (Admin)
GET    /api/escaneos            - Listar escaneos (Admin)
GET    /api/escaneos/hoy        - Escaneos del día (Admin)
GET    /api/escaneos/mi-historial - Mi historial (Usuario)
```

---




---

## 📝 TODO / Roadmap

### ✅ Completado
- [x] Sistema de autenticación
- [x] Gestión de usuarios
- [x] Sistema de abonos
- [x] Códigos QR
- [x] Escaneo y validación
- [x] Historial de abonos
- [x] Historial de accesos
- [x] Dashboard responsive
- [x] Acceso desde red local

### 🔄 En Progreso
- [ ] Gestión completa de pruebas de salud
- [ ] Página de reportes con gráficos
- [ ] Sistema de notificaciones

### 📋 Próximas Funcionalidades Posibles
- [ ] Exportar reportes a PDF/Excel
- [ ] Integración con MercadoPago
- [ ] Notificaciones por email/SMS
- [ ] Panel de configuración avanzada
- [ ] Modo dark/light
- [ ] PWA (Progressive Web App)
- [ ] Backup automático de base de datos

---

## 👨‍💻 Autor

**Juan Hiribarren**
- GitHub: [@juanelvasco](https://github.com/juanelvasco)
- Proyecto: [piletaTIP](https://github.com/juanelvasco/piletaTIP)

---


*Última actualización: Noviembre 2025*


