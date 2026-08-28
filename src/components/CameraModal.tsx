import React, { useState, useRef, useEffect } from 'react';
import { 
  Camera, 
  X, 
  RefreshCw, 
  Check, 
  Upload, 
  AlertCircle, 
  Sparkles,
  SwitchCamera,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { processAndWatermarkImage } from '../utils/imageUtils';
import { ManagerSettings } from '../types';

interface CameraModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotoCaptured: (photoDataUrl: string, timestamp: string) => void;
  taskTitle: string;
  sectorName: string;
  staffName: string;
  settings: ManagerSettings;
}

export const CameraModal: React.FC<CameraModalProps> = ({
  isOpen,
  onClose,
  onPhotoCaptured,
  taskTitle,
  sectorName,
  staffName,
  settings,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedPreview, setCapturedPreview] = useState<string | null>(null);
  const [capturedTimestamp, setCapturedTimestamp] = useState<string>('');

  useEffect(() => {
    if (isOpen && !capturedPreview) {
      startCamera();
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, facingMode, capturedPreview]);

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Câmera não suportada neste navegador.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facingMode },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(() => {});
      }
    } catch (err: any) {
      console.warn('Camera error:', err);
      setCameraError(
        'Não foi possível acessar a câmera diretamente. Você pode tirar a foto pela câmera do celular ou escolher da galeria abaixo.'
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  const handleToggleFacingMode = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  const handleCapture = async () => {
    if (!videoRef.current) return;
    setIsProcessing(true);

    try {
      const result = await processAndWatermarkImage(videoRef.current, {
        restaurantName: settings.restaurantName,
        sectorName,
        taskTitle,
        staffName,
        quality: settings.photoQuality,
        applyWatermark: settings.autoWatermark,
      });

      setCapturedPreview(result.dataUrl);
      setCapturedTimestamp(result.timestamp);
      stopCamera();
    } catch (err) {
      console.error('Error capturing image:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessing(true);

    try {
      const result = await processAndWatermarkImage(file, {
        restaurantName: settings.restaurantName,
        sectorName,
        taskTitle,
        staffName,
        quality: settings.photoQuality,
        applyWatermark: settings.autoWatermark,
      });

      setCapturedPreview(result.dataUrl);
      setCapturedTimestamp(result.timestamp);
      stopCamera();
    } catch (err) {
      console.error('Error processing uploaded file:', err);
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleConfirm = () => {
    if (capturedPreview) {
      onPhotoCaptured(capturedPreview, capturedTimestamp);
      handleClose();
    }
  };

  const handleRetake = () => {
    setCapturedPreview(null);
    setCapturedTimestamp('');
    startCamera();
  };

  const handleClose = () => {
    stopCamera();
    setCapturedPreview(null);
    setCapturedTimestamp('');
    setCameraError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/90 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-slate-900 border border-slate-800 text-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/90">
            <div className="flex items-center gap-2 min-w-0">
              <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex-shrink-0">
                <Camera className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-slate-100 truncate">
                  Comprovação Fotográfica
                </h3>
                <p className="text-[11px] text-slate-400 truncate">
                  {taskTitle}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold flex-shrink-0 ml-2 border border-slate-700/50"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          </div>

          {/* Viewfinder / Preview Area */}
          <div className="relative flex-1 bg-black flex items-center justify-center min-h-[320px] max-h-[460px] overflow-hidden">
            {capturedPreview ? (
              // Captured Snapshot Preview
              <div className="relative w-full h-full flex items-center justify-center bg-black">
                <img
                  src={capturedPreview}
                  alt="Prévia capturada"
                  className="max-h-[460px] w-auto max-w-full object-contain"
                />
                <div className="absolute top-3 left-3 bg-emerald-500/90 text-slate-950 font-bold px-2.5 py-1 rounded-full text-xs flex items-center gap-1 shadow-md">
                  <Check className="w-3.5 h-3.5" /> Foto Pronta
                </div>
              </div>
            ) : cameraError ? (
              // Camera Error / Permission Denied Fallback
              <div className="p-6 text-center max-w-xs space-y-4">
                <div className="w-12 h-12 rounded-full bg-amber-500/20 text-amber-400 mx-auto flex items-center justify-center">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {cameraError}
                </p>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition"
                >
                  <Upload className="w-4 h-4" />
                  <span>Tirar Foto ou Abrir Galeria</span>
                </button>
              </div>
            ) : (
              // Live Video Stream
              <div className="relative w-full h-full flex items-center justify-center">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover max-h-[460px]"
                />

                {/* Viewfinder Guides */}
                <div className="absolute inset-4 pointer-events-none border border-white/20 rounded-xl flex flex-col justify-between p-2">
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-emerald-400" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-emerald-400" />
                  </div>
                  <div className="flex justify-between">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-emerald-400" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-emerald-400" />
                  </div>
                </div>

                {/* Watermark notice badge */}
                <div className="absolute bottom-3 left-3 right-3 pointer-events-none bg-slate-950/70 backdrop-blur-xs text-[11px] text-slate-300 py-1.5 px-3 rounded-lg border border-white/10 flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="truncate">
                    Carimbo de data, hora e setor será aplicado automaticamente
                  </span>
                </div>
              </div>
            )}

            {/* Loading Overlay */}
            {isProcessing && (
              <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center gap-3">
                <RefreshCw className="w-8 h-8 text-emerald-400 animate-spin" />
                <p className="text-xs font-semibold text-slate-200">
                  Processando e aplicando carimbo...
                </p>
              </div>
            )}
          </div>

          {/* Hidden File Input for Gallery / Native camera picker */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileUpload}
          />

          {/* Controls Footer */}
          <div className="p-4 bg-slate-900 border-t border-slate-800">
            {capturedPreview ? (
              // Actions when photo is captured
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleRetake}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center justify-center gap-1.5"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Tirar Outra</span>
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Usar Esta Foto</span>
                </button>
              </div>
            ) : (
              // Actions during live camera
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 text-xs flex items-center gap-1.5"
                  title="Carregar da galeria"
                >
                  <Upload className="w-4 h-4" />
                  <span className="hidden sm:inline">Galeria</span>
                </button>

                {/* Shutter Button */}
                <button
                  type="button"
                  onClick={handleCapture}
                  disabled={isProcessing || !!cameraError}
                  className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 flex items-center justify-center shadow-lg shadow-emerald-500/30 transition disabled:opacity-50 disabled:pointer-events-none ring-4 ring-slate-800"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-slate-950 flex items-center justify-center">
                    <Camera className="w-6 h-6" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleToggleFacingMode}
                  className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition border border-slate-700 text-xs flex items-center gap-1.5"
                  title="Inverter câmera"
                >
                  <SwitchCamera className="w-4 h-4" />
                  <span className="hidden sm:inline">Girar</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
