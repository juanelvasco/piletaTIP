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
  const [notas, setNotas] = useState('');
  const [escaneosHoy, setEscaneosHoy] = useState([]);
  const [statsHoy, setStatsHoy] = useState(null);

  // ============================================================================
  // NUEVO: Estados para modal de resultado
  // ============================================================================
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);

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

  // ============================================================================
  // NUEVO: Procesar escaneo con modal de resultado
  // ============================================================================
  const procesarEscaneo = async (codigoQR) => {
    if (procesando) return;

    try {
      setProcesando(true);

      const data = await escaneoService.escanearQR(codigoQR, notas);
      
      // Preparar datos para el modal
      setResultData(data);
      setShowResultModal(true);
      
      setQrCode('');
      setNotas('');
      
      // Recargar estadísticas
      await cargarEscaneosHoy();

    } catch (error) {
      const errorData = error.response?.data;
      
      // Mostrar error en modal
      setResultData(errorData || {
        exitoso: false,
        message: 'Error al procesar el escaneo'
      });
      setShowResultModal(true);
      
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
      'qr_invalido': { texto: 'QR inválido', color: 'text-red-600', emoji: '🔴' },
      'usuario_inactivo': { texto: 'Usuario inactivo', color: 'text-orange-600', emoji: '⚠️' },
      'usuario_baneado': { texto: 'Usuario baneado', color: 'text-red-600', emoji: '🚫' },
      'sin_abono': { texto: 'Sin abono', color: 'text-yellow-600', emoji: '📭' },
      'abono_no_pagado': { texto: 'Abono no pagado', color: 'text-yellow-600', emoji: '💳' },
      'abono_vencido': { texto: 'Abono vencido', color: 'text-red-600', emoji: '⏰' },
      'sin_prueba_salud': { texto: 'Sin prueba de salud', color: 'text-purple-600', emoji: '🏥' },
      'prueba_salud_vencida': { texto: 'Prueba de salud vencida', color: 'text-red-600', emoji: '📋' }
    };

    return motivos[motivoRechazo] || { texto: motivoRechazo, color: 'text-gray-600', emoji: '❓' };
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

      {/* ========================================================================
          ✨ MODAL DE RESULTADO DEL ESCANEO ✨
          Muestra el resultado de forma profesional (éxito o rechazo)
      ======================================================================== */}
      {showResultModal && resultData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-in-out]">
            
            {/* Header dinámico según resultado */}
            <div className={`p-6 text-center ${
              resultData.exitoso
                ? 'bg-gradient-to-r from-green-500 to-emerald-600'
                : 'bg-gradient-to-r from-red-500 to-rose-600'
            }`}>
              <div className="w-24 h-24 bg-white rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg animate-[pulse_1s_ease-in-out]">
                <span className="text-7xl">{resultData.exitoso ? '✅' : '❌'}</span>
              </div>
              <h2 className="text-3xl font-bold text-white mb-2">
                {resultData.exitoso ? '¡Acceso Permitido!' : 'Acceso Denegado'}
              </h2>
              <p className={`text-lg font-medium ${
                resultData.exitoso ? 'text-green-50' : 'text-red-50'
              }`}>
                {resultData.message}
              </p>
            </div>

            {/* Contenido del modal */}
            <div className="p-6 space-y-4">
              
              {/* Información del usuario */}
              {resultData.usuario && (
                <>
                  <div className="text-center border-b pb-4">
                    <h3 className="text-2xl font-bold text-gray-800">
                      {resultData.usuario.nombre} {resultData.usuario.apellido}
                    </h3>
                    <p className="text-gray-600 mt-1">
                      DNI: <span className="font-semibold">{resultData.usuario.dni}</span>
                    </p>
                  </div>

                  {/* Si es exitoso - Mostrar info del abono */}
                  {resultData.exitoso && resultData.usuario.abono && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-gray-700 uppercase">Información del Abono</p>
                      
                      {/* Tipo de abono */}
                      <div className="bg-blue-50 rounded-lg p-3 flex items-start border-2 border-blue-200">
                        <span className="text-2xl mr-3">🎫</span>
                        <div className="flex-1">
                          <p className="text-xs text-blue-600 font-medium">Tipo de Abono</p>
                          <p className="text-sm text-gray-800 font-bold capitalize">
                            {resultData.usuario.abono.tipo}
                          </p>
                        </div>
                      </div>

                      {/* Días restantes */}
                      <div className={`rounded-lg p-3 flex items-start border-2 ${
                        resultData.usuario.abono.diasRestantes > 7
                          ? 'bg-green-50 border-green-200'
                          : resultData.usuario.abono.diasRestantes > 3
                          ? 'bg-yellow-50 border-yellow-200'
                          : 'bg-orange-50 border-orange-200'
                      }`}>
                        <span className="text-2xl mr-3">
                          {resultData.usuario.abono.diasRestantes > 7 ? '✅' : 
                           resultData.usuario.abono.diasRestantes > 3 ? '⚠️' : '⏰'}
                        </span>
                        <div className="flex-1">
                          <p className={`text-xs font-medium ${
                            resultData.usuario.abono.diasRestantes > 7 ? 'text-green-600' :
                            resultData.usuario.abono.diasRestantes > 3 ? 'text-yellow-600' : 'text-orange-600'
                          }`}>
                            Días Restantes
                          </p>
                          <p className="text-2xl font-bold text-gray-800">
                            {resultData.usuario.abono.diasRestantes} 
                            <span className="text-sm font-normal ml-1">días</span>
                          </p>
                          {resultData.usuario.abono.diasRestantes <= 7 && (
                            <p className="text-xs text-gray-600 mt-1">
                              {resultData.usuario.abono.diasRestantes <= 3 
                                ? '⚠️ Abono próximo a vencer' 
                                : 'Considerar renovación pronto'}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Hora de acceso */}
                      <div className="bg-gray-50 rounded-lg p-3 flex items-start">
                        <span className="text-2xl mr-3">🕐</span>
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Hora de Acceso</p>
                          <p className="text-sm text-gray-800 font-semibold">
                            {new Date().toLocaleTimeString('es-AR', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit'
                            })}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Si es rechazo - Mostrar motivo */}
                  {!resultData.exitoso && resultData.motivoRechazo && (
                    <div className="space-y-3">
                      <p className="text-sm font-bold text-gray-700 uppercase">Motivo del Rechazo</p>
                      
                      <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <span className="text-3xl mr-3">
                            {obtenerInfoMotivo(resultData.motivoRechazo).emoji}
                          </span>
                          <div className="flex-1">
                            <p className={`text-lg font-bold ${obtenerInfoMotivo(resultData.motivoRechazo).color}`}>
                              {obtenerInfoMotivo(resultData.motivoRechazo).texto}
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                              {resultData.motivoRechazo === 'qr_invalido' && 'El código QR no es válido o no existe en el sistema.'}
                              {resultData.motivoRechazo === 'usuario_inactivo' && 'El usuario debe activar su cuenta.'}
                              {resultData.motivoRechazo === 'usuario_baneado' && 'El usuario ha sido suspendido del sistema.'}
                              {resultData.motivoRechazo === 'sin_abono' && 'El usuario no tiene un abono asignado.'}
                              {resultData.motivoRechazo === 'abono_no_pagado' && 'El abono existe pero aún no ha sido pagado.'}
                              {resultData.motivoRechazo === 'abono_vencido' && 'El abono ha expirado. Debe renovarse.'}
                              {resultData.motivoRechazo === 'sin_prueba_salud' && 'Falta el certificado de aptitud física.'}
                              {resultData.motivoRechazo === 'prueba_salud_vencida' && 'El certificado de aptitud ha vencido.'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Instrucciones para el usuario */}
                      <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <span className="text-2xl mr-3">💡</span>
                          <div className="flex-1">
                            <p className="text-xs text-yellow-700 font-bold uppercase mb-1">Acción Requerida</p>
                            <p className="text-sm text-gray-700">
                              {resultData.motivoRechazo === 'sin_abono' && 'El usuario debe adquirir un abono para acceder.'}
                              {resultData.motivoRechazo === 'abono_no_pagado' && 'El usuario debe completar el pago de su abono.'}
                              {resultData.motivoRechazo === 'abono_vencido' && 'El usuario debe renovar su abono.'}
                              {resultData.motivoRechazo === 'sin_prueba_salud' && 'El usuario debe presentar su certificado de aptitud física.'}
                              {resultData.motivoRechazo === 'prueba_salud_vencida' && 'El usuario debe renovar su certificado de aptitud física.'}
                              {(resultData.motivoRechazo === 'usuario_baneado' || resultData.motivoRechazo === 'usuario_inactivo') && 'Contactar con administración.'}
                              {resultData.motivoRechazo === 'qr_invalido' && 'Verificar el código QR del usuario.'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Botón cerrar */}
              <button
                onClick={() => setShowResultModal(false)}
                className={`w-full mt-6 py-3 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg ${
                  resultData.exitoso
                    ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                    : 'bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700'
                }`}
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

export default EscanearQR;