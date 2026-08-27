import React from 'react';
import { X, Download, Calendar, CheckCircle2, UserCheck, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PhotoViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  photoUrl: string | null;
  taskTitle: string;
  timestamp?: string;
  staffName?: string;
  notes?: string;
}

export const PhotoViewerModal: React.FC<PhotoViewerModalProps> = ({
  isOpen,
  onClose,
  photoUrl,
  taskTitle,
  timestamp,
  staffName,
  notes,
}) => {
  if (!isOpen || !photoUrl) return null;

  const handleDownload = () => {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = `comprovante_${taskTitle.replace(/\s+/g, '_').toLowerCase()}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/95 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="relative max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh]"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 text-white z-10">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-400">
                Auditoria Fotográfica
              </span>
              <h3 className="text-sm font-bold text-slate-100 truncate">
                {taskTitle}
              </h3>
            </div>
            
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                type="button"
                onClick={handleDownload}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition text-xs flex items-center gap-1.5"
                title="Baixar foto original"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Baixar</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Photo Display Area */}
          <div className="relative flex-1 bg-black flex items-center justify-center overflow-auto p-2 min-h-[300px]">
            <img
              src={photoUrl}
              alt={taskTitle}
              className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-lg"
            />
          </div>

          {/* Footer with Metadata */}
          <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 text-xs text-slate-300 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4 flex-wrap">
              {timestamp && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{timestamp}</span>
                </div>
              )}
              {staffName && (
                <div className="flex items-center gap-1.5 text-slate-400">
                  <UserCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Por: <strong className="text-slate-200">{staffName}</strong></span>
                </div>
              )}
            </div>

            {notes && (
              <div className="w-full text-slate-300 bg-slate-800/60 p-2 rounded-lg border border-slate-700/50 text-xs">
                <strong>Observações:</strong> {notes}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
