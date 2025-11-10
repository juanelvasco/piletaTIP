import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import QRCode from 'qrcode';
import * as escaneoService from '../../services/escaneoService';

function MiQR() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const canvasRef = useRef(null);

  // Estados
  const [qrGenerado, setQrGenerado] = useState(false);
  const [historial, setHistorial] = useState([]);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [showHistorial, setShowHistorial] = useState(false);

  // Generar QR cuando se monta el componente
  useEffect(() => {
    if (user?.qrCode && canvasRef.current) {
      generarQR();
    }
  }, [user]);

  const generarQR = async () => {
    try {
      await QRCode.toCanvas(canvasRef.current, user.qrCode, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrGenerado(true);
    } catch (error) {
      console.error('Error al generar QR:', error);
    }
  };

  // Descargar QR como imagen
  const descargarQR = () => {
    if (canvasRef.current) {
      const url = canvasRef.current.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `QR-${user.nombre}-${user.apellido}.png`;
      link.href = url;
      link.click();
    }
  };

  // Cargar historial de escaneos
  const cargarHistorial = async () => {
    try {
      setLoadingHistorial(true);
      const data = await escaneoService.getMiHistorial(20);
      setHistorial(data.escaneos);
    } catch (error) {
      console.error('Error al cargar historial:', error);
      setHistorial([]);
    } finally {
      setLoadingHistorial(false);
    }
  };

  const handleVerHistorial = async () => {
    setShowHistorial(true);
    await cargarHistorial();
  };

  // Formatear fecha y hora
  const formatFechaHora = (fecha) => {
    return new Date(fecha).toLocaleString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener icono según el motivo
  const obtenerIconoMotivo = (exitoso, motivoRechazo) => {
    if (exitoso) return { icono: '✅', texto: 'Acceso permitido', color: 'text-green-600' };
    
    const motivos = {
      'qr_invalido': { icono: '❌', texto: 'QR inválido', color: 'text-red-600' },
      'usuario_inactivo': { icono: '⚠️', texto: 'Usuario inactivo', color: 'text-orange-600' },
      'usuario_baneado': { icono: '🚫', texto: 'Usuario baneado', color: 'text-red-600' },
      'sin_abono': { icono: '💳', texto: 'Sin abono', color: 'text-yellow-600' },
      'abono_no_pagado': { icono: '💰', texto: 'Abono no pagado', color: 'text-yellow-600' },
      'abono_vencido': { icono: '📅', texto: 'Abono vencido', color: 'text-red-600' },
      'sin_prueba_salud': { icono: '🏥', texto: 'Sin prueba de salud', color: 'text-purple-600' },
      'prueba_salud_vencida': { icono: '🏥', texto: 'Prueba de salud vencida', color: 'text-red-600' }
    };

    return motivos[motivoRechazo] || { icono: '❓', texto: motivoRechazo, color: 'text-gray-600' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/usuario/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-900">Mi Código QR</h1>
            <p className="text-gray-600 mt-1">Presenta este código para ingresar a la pileta</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Card principal con QR */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-6">
          <div className="flex flex-col items-center">
            {/* Información del usuario */}
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">
                {user?.nombre} {user?.apellido}
              </h2>
              <p className="text-gray-600">DNI: {user?.dni}</p>
            </div>

            {/* Canvas del QR */}
            <div className="bg-white p-6 rounded-lg border-4 border-blue-500 mb-6">
              <canvas ref={canvasRef} />
            </div>

            {/* Código QR en texto */}
            <div className="bg-gray-50 p-4 rounded-lg mb-6 w-full max-w-md">
              <p className="text-xs text-gray-600 mb-1 text-center">Código QR</p>
              <p className="font-mono text-sm text-center break-all">{user?.qrCode}</p>
            </div>

            {/* Botones */}
            <div className="flex gap-4 flex-wrap justify-center">
              <button
                onClick={descargarQR}
                disabled={!qrGenerado}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 transition flex items-center gap-2"
              >
                📥 Descargar QR
              </button>
              <button
                onClick={handleVerHistorial}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-2"
              >
                📋 Ver Historial de Accesos
              </button>
            </div>

            {/* Instrucciones */}
            <div className="mt-8 w-full max-w-2xl">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">
                  📱 Instrucciones de uso
                </h3>
                <ul className="space-y-2 text-blue-800">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">1.</span>
                    <span>Presenta este código QR al personal de recepción cuando ingreses a la pileta</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">2.</span>
                    <span>El personal escaneará el código para validar tu acceso</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">3.</span>
                    <span>Puedes descargar el QR y guardarlo en tu teléfono para mayor comodidad</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600">4.</span>
                    <span>Asegúrate de tener tu abono al día y tu prueba de salud vigente</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Información de estado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">👤</div>
              <div>
                <p className="text-sm text-gray-600">Estado de Usuario</p>
                <p className="font-semibold text-gray-900">
                  {user?.activo ? '✓ Activo' : '✗ Inactivo'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">💳</div>
              <div>
                <p className="text-sm text-gray-600">Abono</p>
                <p className="font-semibold text-gray-900">
                  {user?.abonoActual ? '✓ Activo' : '✗ Sin abono'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🏥</div>
              <div>
                <p className="text-sm text-gray-600">Prueba de Salud</p>
                <p className="font-semibold text-gray-900">
                  {user?.pruebaSalud ? '✓ Vigente' : '✗ Sin registrar'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Historial de Accesos */}
      {showHistorial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">
                  📋 Historial de Accesos
                </h2>
                <button
                  onClick={() => setShowHistorial(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              <p className="text-gray-600 mt-1">Últimos 20 intentos de acceso</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingHistorial ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Cargando historial...</p>
                </div>
              ) : historial.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📭</div>
                  <p className="text-gray-600">No hay registros de acceso</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historial.map((escaneo) => {
                    const info = obtenerIconoMotivo(escaneo.exitoso, escaneo.motivoRechazo);
                    return (
                      <div
                        key={escaneo._id}
                        className={`border rounded-lg p-4 ${
                          escaneo.exitoso ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                        }`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex items-start gap-3">
                            <div className="text-2xl">{info.icono}</div>
                            <div>
                              <p className={`font-semibold ${info.color}`}>
                                {info.texto}
                              </p>
                              <p className="text-sm text-gray-600">
                                {formatFechaHora(escaneo.fechaHora)}
                              </p>
                              {escaneo.escaneadoPor && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Escaneado por: {escaneo.escaneadoPor.nombre} {escaneo.escaneadoPor.apellido}
                                </p>
                              )}
                              {escaneo.notas && (
                                <p className="text-xs text-gray-600 mt-1 italic">
                                  Nota: {escaneo.notas}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
              <button
                onClick={() => setShowHistorial(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MiQR;