const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const os = require('os');
const reportesRoutes = require('./routes/reportes');


// Cargar variables de entorno
dotenv.config();

const app = express();

// Middlewares
app.use(cors());
// Aumentar el límite del body para permitir imágenes en base64
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/pileta-control')
.then(() => {
  console.log('✅ Conectado a MongoDB');
  
  // Importar modelos para verificar que funcionan
  const { Usuario, Abono, Escaneo, PruebaSalud, Configuracion } = require('./models');
  console.log('✅ Modelos cargados correctamente:');
  console.log('   - Usuario');
  console.log('   - Abono');
  console.log('   - Escaneo');
  console.log('   - PruebaSalud');
  console.log('   - Configuracion');
})
.catch((err) => console.error('❌ Error conectando a MongoDB:', err));

// Rutas básicas
app.get('/', (req, res) => {
  res.json({ message: 'API de Control de Acceso - Pileta' });
});



// Rutas de autenticación
app.use('/api/auth', require('./routes/auth'));
 
// Rutas de usuarios (admin)
app.use('/api/users', require('./routes/users'));

// Rutas de abonos
app.use('/api/abonos', require('./routes/abonos'));

// ✅ RUTA DE CONFIGURACIÓN (usa /api/configuracion)
app.use('/api/configuracion', require('./routes/configuracion'));

// Rutas de pruebas de salud
app.use('/api/salud', require('./routes/salud'));

// Rutas de escaneos
app.use('/api/escaneos', require('./routes/escaneos'));

// Rutas de reportes
app.use('/api/reportes', reportesRoutes);



// Manejo de errores
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Algo salió mal!', error: err.message });
});

const PORT = process.env.PORT || 5000;

// Función para obtener la IP local
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Buscar IPv4 y que no sea localhost
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ✅ CORRECCIÓN: Escuchar en 0.0.0.0 para permitir conexiones desde red local
app.listen(PORT, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📱 Acceso local:    http://localhost:${PORT}`);
  console.log(`🌐 Acceso en red:   http://${localIP}:${PORT}`);
  console.log(`\n💡 Para acceder desde tu celular, usa: http://${localIP}:${PORT}`);
});