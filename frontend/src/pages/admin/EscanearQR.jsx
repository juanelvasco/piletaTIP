import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Html5QrcodeScanner } from 'html5-qrcode';
import * as escaneoService from '../../services/escaneoService';

function EscanearQR() {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const scannerRef = useRef(null);
  const html5QrcodeScannerRef = useRef(null);

  // Estados
  const [modoEscaneo, setModoEscaneo] = useState('camara'); // 'camara' o 'manual'
  const [qrCode, setQrCode] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [notas, setNotas] = useState('');
  const [escaneosHoy, setEscaneosHoy] = useState([]);
  const [statsHoy, setStatsHoy] = useState(null);

  // Cargar estadísticas del día
  useEffect(() => {
    cargarEscaneosHoy();
  }, []);

  // Inicializar escáner cuando el modo es cámara
  useEffect(() => {
    if (modoEscaneo === 'camara') {
      iniciarEscaner();
    } else {
      detenerEscaner();
    }

    return () => {
      detenerEscaner();
    };
  }, [modoEscaneo]);

  const iniciarEscaner = () => {
    if (!scannerRef.current) return;

    html5QrcodeScannerRef.current = new Html5QrcodeScanner(
      'reader',
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    html5QrcodeScannerRef.current.render(onScanSuccess, onScanError);
  };

  const detenerEscaner = () => {
    if (html5QrcodeScannerRef.current) {
      html5QrcodeScannerRef.current.clear().catch(error => {
        console.error('Error al detener el escáner:', error);
      });
      html5QrcodeScannerRef.current = null;
    }
  };

  const onScanSuccess = (decodedText, decodedResult) => {
    console.log('QR escaneado:', decodedText);
    procesarEscaneo(decodedText);
  };

  const onScanError = (errorMessage) => {
    // Ignorar errores de escaneo continuo
  };

  const cargarEscaneosHoy = async () => {
    try {
      const data = await escaneoService.getEscaneosHoy();
      setEscaneosHoy(data.escaneos.slice(0, 5)); // Últimos 5
      setStatsHoy({
        total: data.total,
        exitosos: data.exitosos,
        rechazados: data.rechazados,
        porcentajeExito: data.porcentajeExito
      });
    } catch (error) {
      console.error('Error al cargar escaneos de hoy:', error);
    }
  };

  const procesarEscaneo = async (codigoQR) => {
    if (procesando) return;

    try {
      setProcesando(true);
      setResultado(null);

      const data = await escaneoService.escanearQR(codigoQR, notas);
      
      setResultado(data);
      setQrCode('');
      setNotas('');
      
      // Recargar estadísticas
      await cargarEscaneosHoy();

      // Limpiar resultado después de 5 segundos
      setTimeout(() => {
        setResultado(null);
      }, 5000);

    } catch (error) {
      const errorData = error.response?.data;
      setResultado(errorData || {
        exitoso: false,
        message: 'Error al procesar el escaneo'
      });

      // Limpiar resultado después de 5 segundos
      setTimeout(() => {
        setResultado(null);
      }, 5000);
    } finally {
      setProcesando(false);
    }
  };

  const handleEscaneoManual = (e) => {
    e.preventDefault();
    if (qrCode.trim()) {
      procesarEscaneo(qrCode.trim());
    }
  };

  // Formatear fecha y hora
  const formatFechaHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtener info del motivo
  const obtenerInfoMotivo = (motivoRechazo) => {
    const motivos = {
      'qr_invalido': { texto: 'QR inválido', color: 'text-red-600' },
      'usuario_inactivo': { texto: 'Usuario inactivo', color: 'text-orange-600' },
      'usuario_baneado': { texto: 'Usuario baneado', color: 'text-red-600' },
      'sin_abono': { texto: 'Sin abono', color: 'text-yellow-600' },
      'abono_no_pagado': { texto: 'Abono no pagado', color: 'text-yellow-600' },
      'abono_vencido': { texto: 'Abono vencido', color: 'text-red-600' },
      'sin_prueba_salud': { texto: 'Sin prueba de salud', color: 'text-purple-600' },
      'prueba_salud_vencida': { texto: 'Prueba de salud vencida', color: 'text-red-600' }
    };

    return motivos[motivoRechazo] || { texto: motivoRechazo, color: 'text-gray-600' };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="text-blue-600 hover:text-blue-800 mb-2"
            >
              ← Volver al Dashboard
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Escanear QR - Control de Acceso</h1>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Escáner */}
          <div className="lg:col-span-2">
            {/* Selector de modo */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <div className="flex gap-4">
                <button
                  onClick={() => setModoEscaneo('camara')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                    modoEscaneo === 'camara'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  📷 Escanear con Cámara
                </button>
                <button
                  onClick={() => setModoEscaneo('manual')}
                  className={`flex-1 px-4 py-3 rounded-lg font-medium transition ${
                    modoEscaneo === 'manual'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  ⌨️ Entrada Manual
                </button>
              </div>
            </div>

            {/* Área de escaneo */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              {modoEscaneo === 'camara' ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Escaneo con Cámara
                  </h3>
                  <div 
                    ref={scannerRef}
                    id="reader" 
                    className="w-full"
                  />
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Coloca el código QR frente a la cámara
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">
                    Entrada Manual
                  </h3>
                  <form onSubmit={handleEscaneoManual} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Código QR
                      </label>
                      <input
                        type="text"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        placeholder="Ingrese el código QR"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                        autoFocus
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">
                        Notas (opcional)
                      </label>
                      <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Agregar notas sobre el escaneo..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        rows="2"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={!qrCode.trim() || procesando}
                      className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-semibold transition"
                    >
                      {procesando ? 'Procesando...' : 'Validar Acceso'}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Resultado del escaneo */}
            {resultado && (
              <div
                className={`rounded-lg shadow-lg p-6 mb-6 border-4 ${
                  resultado.exitoso
                    ? 'bg-green-50 border-green-500'
                    : 'bg-red-50 border-red-500'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="text-6xl">
                    {resultado.exitoso ? '✅' : '❌'}
                  </div>
                  <div className="flex-1">
                    <h3 className={`text-2xl font-bold mb-2 ${
                      resultado.exitoso ? 'text-green-900' : 'text-red-900'
                    }`}>
                      {resultado.message}
                    </h3>

                    {resultado.usuario && (
                      <div className="space-y-2">
                        <p className="text-lg font-semibold text-gray-900">
                          {resultado.usuario.nombre} {resultado.usuario.apellido}
                        </p>
                        <p className="text-gray-700">DNI: {resultado.usuario.dni}</p>

                        {resultado.exitoso && resultado.usuario.abono && (
                          <div className="mt-4 bg-white rounded-lg p-4">
                            <p className="text-sm font-semibold text-gray-900 mb-2">
                              Información del Abono:
                            </p>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-600">Tipo:</span>
                                <span className="ml-2 font-semibold capitalize">
                                  {resultado.usuario.abono.tipo}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-600">Días restantes:</span>
                                <span className="ml-2 font-semibold">
                                  {resultado.usuario.abono.diasRestantes} días
                                </span>
                              </div>
                            </div>
                          </div>
                        )}

                        {!resultado.exitoso && resultado.motivoRechazo && (
                          <div className="mt-4 bg-white rounded-lg p-4">
                            <p className="text-sm font-semibold text-red-800">
                              Motivo del rechazo:
                            </p>
                            <p className={`text-sm ${obtenerInfoMotivo(resultado.motivoRechazo).color}`}>
                              {obtenerInfoMotivo(resultado.motivoRechazo).texto}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Panel derecho - Estadísticas */}
          <div className="lg:col-span-1">
            {/* Estadísticas del día */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                📊 Estadísticas de Hoy
              </h3>

              {statsHoy ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-600 font-medium">Total Escaneos</p>
                    <p className="text-3xl font-bold text-blue-900">{statsHoy.total}</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-sm text-green-600 font-medium">Exitosos</p>
                    <p className="text-3xl font-bold text-green-900">{statsHoy.exitosos}</p>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-red-600 font-medium">Rechazados</p>
                    <p className="text-3xl font-bold text-red-900">{statsHoy.rechazados}</p>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <p className="text-sm text-purple-600 font-medium">Tasa de Éxito</p>
                    <p className="text-3xl font-bold text-purple-900">{statsHoy.porcentajeExito}%</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Cargando estadísticas...</p>
              )}
            </div>

            {/* Últimos escaneos */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                🕐 Últimos Escaneos
              </h3>

              {escaneosHoy.length === 0 ? (
                <p className="text-gray-600 text-sm">No hay escaneos aún</p>
              ) : (
                <div className="space-y-3">
                  {escaneosHoy.map((escaneo) => (
                    <div
                      key={escaneo._id}
                      className={`p-3 rounded-lg border ${
                        escaneo.exitoso
                          ? 'bg-green-50 border-green-200'
                          : 'bg-red-50 border-red-200'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="text-lg">
                          {escaneo.exitoso ? '✅' : '❌'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {escaneo.usuario?.nombre} {escaneo.usuario?.apellido}
                          </p>
                          <p className="text-xs text-gray-600">
                            {formatFechaHora(escaneo.fechaHora)}
                          </p>
                          {!escaneo.exitoso && escaneo.motivoRechazo && (
                            <p className={`text-xs ${obtenerInfoMotivo(escaneo.motivoRechazo).color} mt-1`}>
                              {obtenerInfoMotivo(escaneo.motivoRechazo).texto}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button
                onClick={() => navigate('/admin/reportes')}
                className="w-full mt-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm font-medium"
              >
                Ver Todos los Escaneos →
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default EscanearQR;
