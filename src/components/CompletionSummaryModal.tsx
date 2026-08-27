import React, { useEffect, useState } from 'react';
import { 
  CheckCircle2, 
  Send, 
  Copy, 
  Check, 
  Camera, 
  User, 
  Clock, 
  Layers, 
  ExternalLink, 
  Sparkles,
  X,
  FileCheck2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ChecklistSubmission, ManagerSettings } from '../types';
import { generateWhatsAppMessage } from '../utils/storage';

interface CompletionSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  submission: ChecklistSubmission;
  settings: ManagerSettings;
  onResetChecklist: () => void;
}

export const CompletionSummaryModal: React.FC<CompletionSummaryModalProps> = ({
  isOpen,
  onClose,
  submission,
  settings,
  onResetChecklist,
}) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger festive celebration confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10B981', '#F59E0B', '#3B82F6', '#EC4899'],
        });
      } catch (e) {
        console.log('Confetti effect triggered');
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const { messageText, whatsappUrl } = generateWhatsAppMessage(submission, settings);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy text', err);
    }
  };

  const handleOpenWhatsApp = () => {
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white text-slate-900 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-8"
        >
          {/* Top Success Banner */}
          <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 text-center relative overflow-hidden">
            <div className="absolute -right-8 -top-8 w-32 h-32 bg-white/10 rounded-full blur-xl pointer-events-none" />
            <button
              type="button"
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-black/20 hover:bg-black/30 text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-16 h-16 rounded-2xl bg-white text-emerald-600 mx-auto flex items-center justify-center shadow-xl shadow-black/10 mb-3">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <span className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider bg-white/20 text-white px-3 py-0.5 rounded-full mb-1">
              <Sparkles className="w-3.5 h-3.5" /> Checklist 100% Concluído
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-white">
              Rotina Finalizada com Sucesso!
            </h2>
            <p className="text-xs text-emerald-100 mt-1 max-w-sm mx-auto">
              Todas as tarefas foram cumpridas e as fotos comprovatórias foram anexadas à auditoria.
            </p>
          </div>

          {/* Submission Details Card */}
          <div className="p-6 space-y-4">
            
            {/* Quick Stats Grid */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Setor</span>
                <strong className="text-xs font-bold text-slate-800 truncate block">
                  {submission.sectorName}
                </strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Tarefas</span>
                <strong className="text-xs font-bold text-emerald-600 block">
                  {submission.completedTasksCount}/{submission.totalTasks} Feitas
                </strong>
              </div>
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="text-[11px] font-semibold text-slate-500 block">Comprovantes</span>
                <strong className="text-xs font-bold text-amber-600 block flex items-center justify-center gap-1">
                  <Camera className="w-3.5 h-3.5" /> {submission.photosCount} Fotos
                </strong>
              </div>
            </div>

            {/* Metadata Info */}
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 text-xs space-y-2 text-slate-600">
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <User className="w-3.5 h-3.5 text-slate-400" /> Responsável:
                </span>
                <strong className="text-slate-900 font-bold">
                  {submission.responsibleName} {submission.responsibleRole ? `(${submission.responsibleRole})` : ''}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <Clock className="w-3.5 h-3.5 text-slate-400" /> Turno & Horário:
                </span>
                <span className="font-semibold text-slate-800">
                  {submission.shift.toUpperCase()} • {new Date(submission.completedAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center gap-1.5 text-slate-500">
                  <FileCheck2 className="w-3.5 h-3.5 text-slate-400" /> Código da Auditoria:
                </span>
                <span className="font-mono text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md font-bold">
                  #{submission.submissionCode}
                </span>
              </div>
            </div>

            {/* Primary Action: Send to WhatsApp */}
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                id="btn-send-whatsapp"
                onClick={handleOpenWhatsApp}
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-slate-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 transition active:scale-98"
              >
                <Send className="w-5 h-5 fill-slate-950" />
                <span>Enviar Relatório para o WhatsApp do Gestor</span>
              </button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold border border-slate-200 transition flex items-center justify-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-700 font-bold">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Copiar Texto do Relatório</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onResetChecklist();
                    onClose();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>Novo Checklist</span>
                </button>
              </div>
            </div>

            {/* WhatsApp Number Hint */}
            <p className="text-[11px] text-slate-400 text-center">
              {settings.managerWhatsapp ? (
                <span>Número configurado: <strong className="text-slate-600">+{settings.managerWhatsapp}</strong> ({settings.managerName})</span>
              ) : (
                <span>Dica: O gestor pode cadastrar o número exato do WhatsApp no Painel do Gestor.</span>
              )}
            </p>

          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
