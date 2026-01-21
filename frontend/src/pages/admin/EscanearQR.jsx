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
  const procesandoRef = useRef(false);

  // Estados
  const [modoEscaneo, setModoEscaneo] = useState('camara');
  const [qrCode, setQrCode] = useState('');
  const [procesando, setProcesando] = useState(false);
  const [notas, setNotas] = useState('');
  const [escaneosHoy, setEscaneosHoy] = useState([]);
  const [statsHoy, setStatsHoy] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultData, setResultData] = useState(null);
  const [showPhotoLightbox, setShowPhotoLightbox] = useState(false);

  useEffect(() => {
    cargarEscaneosHoy();
  }, []);

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
    procesandoRef.current = false;
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
    procesandoRef.current = false;
  };

  const onScanSuccess = (decodedText) => {
    if (procesandoRef.current) {
      console.log('Ya procesando, ignorando escaneo duplicado');
      return;
    }
    
    console.log('🔍 QR escaneado:', decodedText);
    procesandoRef.current = true;
    
    // Pausar el escáner con try-catch para evitar errores
    if (html5QrcodeScannerRef.current) {
      try {
        html5QrcodeScannerRef.current.pause(true);
        console.log('✅ Scanner pausado correctamente');
      } catch (error) {
        // Ignorar el error, no es crítico
        console.log('⚠️ No se pudo pausar (no es crítico):', error.message);
      }
    }
    
    procesarEscaneo(decodedText);
  };

  const onScanError = (errorMessage) => {
    // Ignorar errores de escaneo continuo
  };

  const cargarEscaneosHoy = async () => {
    try {
      const data = await escaneoService.getEscaneosHoy();
      setEscaneosHoy(data.escaneos.slice(0, 5));
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
    console.log('1️⃣ Iniciando procesarEscaneo con:', codigoQR);
    try {
      setProcesando(true);
      console.log('2️⃣ Llamando a escaneoService.escanearQR...');
      
      const data = await escaneoService.escanearQR(codigoQR, notas);
      
      console.log('3️⃣ Respuesta del backend:', data);
      console.log('4️⃣ Seteando resultData:', data);
      
      setResultData(data);
      setShowResultModal(true);
      
      console.log('5️⃣ showResultModal debería ser true ahora');
      console.log('6️⃣ resultData:', data);
      
      setQrCode('');
      setNotas('');
      await cargarEscaneosHoy();
      
      console.log('7️⃣ Modal debería estar visible');
      
    } catch (error) {
      console.error('❌ Error en procesarEscaneo:', error);
      const errorData = error.response?.data;
      console.log('8️⃣ ErrorData:', errorData);
      
      setResultData(errorData || {
        exitoso: false,
        message: 'Error al procesar el escaneo'
      });
      setShowResultModal(true);
      
      console.log('9️⃣ Modal de error debería estar visible');
      
    } finally {
      setProcesando(false);
      
      // Reanudar el escáner después de 2 segundos
      setTimeout(() => {
        console.log('🔄 Reseteando procesandoRef y resumiendo scanner...');
        procesandoRef.current = false;
        if (html5QrcodeScannerRef.current && modoEscaneo === 'camara') {
          try {
            html5QrcodeScannerRef.current.resume();
            console.log('✅ Scanner resumido');
          } catch (e) {
            console.log('⚠️ No se pudo resumir scanner:', e.message);
          }
        }
      }, 2000);
    }
  };

  const handleEscaneoManual = (e) => {
    e.preventDefault();
    if (qrCode.trim() && !procesandoRef.current) {
      procesandoRef.current = true;
      procesarEscaneo(qrCode.trim());
    }
  };

  const formatFechaHora = (fecha) => {
    return new Date(fecha).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const obtenerInfoMotivo = (motivoRechazo) => {
    const motivos = {
      'qr_invalido': { texto: 'QR inválido', color: 'text-red-600', emoji: '🔴' },
      'usuario_inactivo': { texto: 'Usuario inactivo', color: 'text-orange-600', emoji: '⚠️' },
      'usuario_baneado': { texto: 'Usuario baneado', color: 'text-red-600', emoji: '🚫' },
      'sin_abono': { texto: 'Sin abono', color: 'text-yellow-600', emoji: '📭' },
      'abono_no_pagado': { texto: 'Abono no pagado', color: 'text-yellow-600', emoji: '💳' },
      'abono_vencido': { texto: 'Abono vencido', color: 'text-red-600', emoji: '⏰' },
      'sin_prueba_salud': { texto: 'Sin apto médico', color: 'text-purple-600', emoji: '🏥' },
      'prueba_salud_vencida': { texto: 'Apto médico vencido', color: 'text-red-600', emoji: '📋' }
    };
    return motivos[motivoRechazo] || { texto: motivoRechazo, color: 'text-gray-600', emoji: '❓' };
  };

  // DEBUG: Log cuando cambian los estados del modal
  useEffect(() => {
    console.log('🎭 showResultModal cambió a:', showResultModal);
  }, [showResultModal]);

  useEffect(() => {
    console.log('📦 resultData cambió a:', resultData);
  }, [resultData]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <nav className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => navigate('/admin/dashboard')}
                className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center hover:opacity-80 transition"
              >
                <span className="text-white text-xl font-bold">←</span>
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Escanear QR - Control de Acceso</h1>
                <p className="text-xs text-gray-500">Panel de Administración</p>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors text-sm font-medium"
            >
              Salir
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Panel izquierdo - Escáner */}
          <div className="lg:col-span-2">
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

            <div className="bg-white rounded-lg shadow p-6">
              {modoEscaneo === 'camara' ? (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Escanear con Cámara</h3>
                  <div id="reader" ref={scannerRef}></div>
                  {procesando && (
                    <div className="mt-4 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg text-center">
                      <p className="text-blue-700 font-semibold">⏳ Procesando escaneo...</p>
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Entrada Manual</h3>
                  <form onSubmit={handleEscaneoManual} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Código QR</label>
                      <input
                        type="text"
                        value={qrCode}
                        onChange={(e) => setQrCode(e.target.value)}
                        placeholder="Ingrese el código QR"
                        className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-lg font-mono"
                        autoFocus
                        disabled={procesando}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-gray-700">Notas (opcional)</label>
                      <textarea
                        value={notas}
                        onChange={(e) => setNotas(e.target.value)}
                        placeholder="Agregar notas sobre el escaneo..."
                        className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                        rows="2"
                        disabled={procesando}
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
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">📊 Estadísticas de Hoy</h3>
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

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">🕐 Últimos Escaneos</h3>
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
                        <div className="text-lg">{escaneo.exitoso ? '✅' : '❌'}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">
                            {escaneo.usuario?.nombre} {escaneo.usuario?.apellido}
                          </p>
                          <p className="text-xs text-gray-600">{formatFechaHora(escaneo.fechaHora)}</p>
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

      {/* MODAL DE RESULTADO - VERSIÓN COMPACTA */}
{showResultModal && resultData && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
    <div className="bg-white rounded-2xl max-w-2xl w-full my-8 overflow-hidden shadow-2xl animate-[fadeIn_0.3s_ease-in-out]">
      
      {/* Header dinámico - COMPACTO */}
      <div className={`p-4 text-center ${
        resultData.exitoso
          ? 'bg-gradient-to-r from-green-500 to-emerald-600'
          : 'bg-gradient-to-r from-red-500 to-rose-600'
      }`}>
        <div className="w-16 h-16 bg-white rounded-full mx-auto mb-2 flex items-center justify-center shadow-lg animate-[pulse_1s_ease-in-out]">
          <span className="text-5xl">{resultData.exitoso ? '✅' : '❌'}</span>
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">
          {resultData.exitoso ? '¡Acceso Permitido!' : 'Acceso Denegado'}
        </h2>
        <p className={`text-sm font-medium ${resultData.exitoso ? 'text-green-50' : 'text-red-50'}`}>
          {resultData.message}
        </p>
      </div>

      {/* Contenido del modal - COMPACTO */}
      <div className="p-4 space-y-3 max-h-[calc(100vh-200px)] overflow-y-auto">
        
        {/* Información del usuario con foto CLICKEABLE */}
        {resultData.usuario && (
          <>
            <div className="text-center border-b pb-3">
              <div className="flex justify-center mb-2">
                <img
                  src={resultData.usuario.fotoPerfil || `https://ui-avatars.com/api/?name=${resultData.usuario.nombre}+${resultData.usuario.apellido}&background=3B82F6&color=fff&size=128`}
                  alt={`${resultData.usuario.nombre} ${resultData.usuario.apellido}`}
                  className="w-20 h-20 rounded-full object-cover border-4 border-gray-200 shadow-lg cursor-pointer hover:opacity-80 hover:scale-105 transition-all"
                  onClick={() => setShowPhotoLightbox(true)}
                  title="Click para ampliar foto"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-800">
                {resultData.usuario.nombre} {resultData.usuario.apellido}
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                DNI: <span className="font-semibold">{resultData.usuario.dni}</span>
              </p>
              <p className="text-xs text-gray-500 mt-1 italic">
                💡 Click en la foto para ampliar
              </p>
            </div>

            {/* GRID DE 2 COLUMNAS - COMPACTO */}
            <div className="space-y-2">
              <p className="text-xs font-bold text-gray-700 uppercase text-center">
                Estado de Acceso
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                
                {/* COLUMNA 1: ABONO */}
                <div className="flex flex-col h-full">
                  <p className="text-xs font-semibold text-gray-600 uppercase text-center mb-1">
                    💳 Abono
                  </p>
                  
                  {resultData.usuario.abono ? (
                    <div className="flex flex-col flex-1">
                      <div className="space-y-1 flex-1">
                        <div className="bg-blue-50 rounded-lg p-2 border-2 border-blue-200">
                          <p className="text-xs text-blue-600 font-medium">Tipo</p>
                          <p className="text-sm text-gray-800 font-bold capitalize">
                            {resultData.usuario.abono.tipo}
                          </p>
                        </div>

                        <div className={`rounded-lg p-2 border-2 ${
                          resultData.usuario.abono.diasRestantes > 7
                            ? 'bg-green-50 border-green-200'
                            : resultData.usuario.abono.diasRestantes > 3
                            ? 'bg-yellow-50 border-yellow-200'
                            : resultData.usuario.abono.diasRestantes > 0
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <p className={`text-xs font-medium ${
                            resultData.usuario.abono.diasRestantes > 7 ? 'text-green-600' :
                            resultData.usuario.abono.diasRestantes > 3 ? 'text-yellow-600' : 
                            resultData.usuario.abono.diasRestantes > 0 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            Vigencia
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {resultData.usuario.abono.diasRestantes > 0 ? (
                              <>
                                {resultData.usuario.abono.diasRestantes} 
                                <span className="text-xs font-normal ml-1">días</span>
                              </>
                            ) : (
                              <span className="text-sm">Vencido</span>
                            )}
                          </p>
                          {resultData.usuario.abono.diasRestantes <= 7 && resultData.usuario.abono.diasRestantes > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              ⚠️ Próximo a vencer
                            </p>
                          )}
                        </div>
                      </div>

                      <div className={`mt-1 rounded-lg p-1 text-center border-2 ${
                        resultData.usuario.abono.diasRestantes > 0
                          ? 'bg-green-50 border-green-300'
                          : 'bg-red-50 border-red-300'
                      }`}>
                        <p className={`text-xs font-bold ${
                          resultData.usuario.abono.diasRestantes > 0
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}>
                          {resultData.usuario.abono.diasRestantes > 0 ? '✅ Vigente' : '❌ Vencido'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 justify-between">
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center flex-1 flex flex-col justify-center">
                        <p className="text-2xl mb-1">📭</p>
                        <p className="text-sm font-bold text-red-700">Sin Abono</p>
                        <p className="text-xs text-gray-600 mt-1">Debe adquirir un abono</p>
                      </div>
                      <div className="mt-1 rounded-lg p-1 text-center border-2 bg-red-50 border-red-300">
                        <p className="text-xs font-bold text-red-700">❌ Sin Abono</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* COLUMNA 2: APTO MÉDICO */}
                <div className="flex flex-col h-full">
                  <p className="text-xs font-semibold text-gray-600 uppercase text-center mb-1">
                    🏥 Apto Médico
                  </p>
                  
                  {resultData.usuario.pruebaSalud ? (
                    <div className="flex flex-col flex-1">
                      <div className="space-y-1 flex-1">
                        <div className={`rounded-lg p-2 border-2 ${
                          resultData.usuario.pruebaSalud.diasRestantes > 30
                            ? 'bg-green-50 border-green-200'
                            : resultData.usuario.pruebaSalud.diasRestantes > 7
                            ? 'bg-yellow-50 border-yellow-200'
                            : resultData.usuario.pruebaSalud.diasRestantes > 0
                            ? 'bg-orange-50 border-orange-200'
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <p className={`text-xs font-medium ${
                            resultData.usuario.pruebaSalud.diasRestantes > 30 ? 'text-green-600' :
                            resultData.usuario.pruebaSalud.diasRestantes > 7 ? 'text-yellow-600' : 
                            resultData.usuario.pruebaSalud.diasRestantes > 0 ? 'text-orange-600' : 'text-red-600'
                          }`}>
                            Vigencia
                          </p>
                          <p className="text-lg font-bold text-gray-800">
                            {resultData.usuario.pruebaSalud.diasRestantes > 0 ? (
                              <>
                                {resultData.usuario.pruebaSalud.diasRestantes}
                                <span className="text-xs font-normal ml-1">días</span>
                              </>
                            ) : (
                              <span className="text-sm">Vencido</span>
                            )}
                          </p>
                          {resultData.usuario.pruebaSalud.diasRestantes <= 30 && resultData.usuario.pruebaSalud.diasRestantes > 0 && (
                            <p className="text-xs text-gray-600 mt-1">
                              {resultData.usuario.pruebaSalud.diasRestantes <= 7 
                                ? '⚠️ Próximo a vencer' 
                                : '⏰ Renovar pronto'}
                            </p>
                          )}
                        </div>

                        <div className="bg-gray-50 rounded-lg p-2 border-2 border-gray-200">
                          <p className="text-xs text-gray-600 font-medium">Vence</p>
                          <p className="text-sm text-gray-800 font-semibold">
                            {new Date(resultData.usuario.pruebaSalud.vence).toLocaleDateString('es-AR')}
                          </p>
                        </div>
                      </div>

                      <div className={`mt-1 rounded-lg p-1 text-center border-2 ${
                        resultData.usuario.pruebaSalud.diasRestantes > 0
                          ? 'bg-green-50 border-green-300'
                          : 'bg-red-50 border-red-300'
                      }`}>
                        <p className={`text-xs font-bold ${
                          resultData.usuario.pruebaSalud.diasRestantes > 0
                            ? 'text-green-700'
                            : 'text-red-700'
                        }`}>
                          {resultData.usuario.pruebaSalud.diasRestantes > 0 ? '✅ Vigente' : '❌ Vencido'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col flex-1 justify-between">
                      <div className="bg-red-50 border-2 border-red-300 rounded-lg p-3 text-center flex-1 flex flex-col justify-center">
                        <p className="text-2xl mb-1">🏥</p>
                        <p className="text-sm font-bold text-red-700">Sin Apto Médico</p>
                        <p className="text-xs text-gray-600 mt-1">Debe presentar certificado</p>
                      </div>
                      <div className="mt-1 rounded-lg p-1 text-center border-2 bg-red-50 border-red-300">
                        <p className="text-xs font-bold text-red-700">❌ Sin Apto</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Motivo del rechazo - COMPACTO */}
            {!resultData.exitoso && resultData.motivoRechazo && (
              <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3">
                <div className="flex items-start">
                  <span className="text-2xl mr-2">
                    {obtenerInfoMotivo(resultData.motivoRechazo).emoji}
                  </span>
                  <div className="flex-1">
                    <p className="text-xs text-red-600 font-bold uppercase mb-1">Motivo del Rechazo</p>
                    <p className={`text-base font-bold ${obtenerInfoMotivo(resultData.motivoRechazo).color}`}>
                      {obtenerInfoMotivo(resultData.motivoRechazo).texto}
                    </p>
                    <p className="text-xs text-gray-600 mt-1">
                      {resultData.motivoRechazo === 'qr_invalido' && 'El código QR no es válido o no existe en el sistema.'}
                      {resultData.motivoRechazo === 'usuario_inactivo' && 'El usuario debe activar su cuenta.'}
                      {resultData.motivoRechazo === 'usuario_baneado' && 'El usuario ha sido suspendido del sistema.'}
                      {resultData.motivoRechazo === 'sin_abono' && 'El usuario no tiene un abono asignado.'}
                      {resultData.motivoRechazo === 'abono_no_pagado' && 'El abono existe pero aún no ha sido pagado.'}
                      {resultData.motivoRechazo === 'abono_vencido' && 'El abono ha expirado y debe renovarse.'}
                      {resultData.motivoRechazo === 'sin_prueba_salud' && 'Falta el certificado de aptitud física (apto médico).'}
                      {resultData.motivoRechazo === 'prueba_salud_vencida' && 'El certificado de aptitud física ha vencido.'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Hora de acceso - COMPACTO */}
            <div className="bg-gray-50 rounded-lg p-2 flex items-center justify-center">
              <span className="text-lg mr-2">🕐</span>
              <div>
                <p className="text-xs text-gray-500 font-medium">Hora de Escaneo</p>
                <p className="text-sm text-gray-800 font-semibold">
                  {new Date().toLocaleTimeString('es-AR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </>
        )}

        {/* Botón cerrar - COMPACTO */}
        <button
          onClick={() => setShowResultModal(false)}
          className={`w-full py-2.5 text-white font-bold rounded-lg transition-all shadow-md hover:shadow-lg ${
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

      {/* LIGHTBOX PARA AMPLIAR LA FOTO */}
      {showPhotoLightbox && resultData?.usuario && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[60] cursor-pointer animate-[fadeIn_0.2s_ease-in-out]"
          onClick={() => setShowPhotoLightbox(false)}
        >
          <div className="relative max-w-4xl w-full">
            <div className="absolute top-4 left-0 right-0 text-center">
              <p className="text-white text-sm bg-black bg-opacity-50 inline-block px-4 py-2 rounded-full">
                Click en cualquier lugar para cerrar
              </p>
            </div>

            <img
              src={resultData.usuario.fotoPerfil || `https://ui-avatars.com/api/?name=${resultData.usuario.nombre}+${resultData.usuario.apellido}&background=3B82F6&color=fff&size=512`}
              alt={`${resultData.usuario.nombre} ${resultData.usuario.apellido}`}
              className="w-full h-auto max-h-[80vh] object-contain rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />

            <div className="absolute bottom-4 left-0 right-0 text-center">
              <div className="bg-black bg-opacity-70 inline-block px-6 py-3 rounded-full">
                <p className="text-white text-xl font-bold">
                  {resultData.usuario.nombre} {resultData.usuario.apellido}
                </p>
                <p className="text-gray-300 text-sm">
                  DNI: {resultData.usuario.dni}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EscanearQR;