import React, { useState } from 'react';
import { ManagerSettings } from '../../types';
import { 
  Lock, 
  Phone, 
  Store, 
  User, 
  Sparkles, 
  Camera, 
  Save, 
  RotateCcw, 
  Download, 
  Upload, 
  Check, 
  AlertCircle,
  ExternalLink,
  Cloud,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { resetAllDataToDefaults } from '../../utils/storage';

interface SettingsTabProps {
  settings: ManagerSettings;
  onSaveSettings: (settings: ManagerSettings) => void;
  onResetAll: () => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({
  settings,
  onSaveSettings,
  onResetAll,
}) => {
  const [formData, setFormData] = useState<ManagerSettings>({ ...settings });
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPinInput, setNewPinInput] = useState('');
  const [confirmPinInput, setConfirmPinInput] = useState('');
  const [pinMessage, setPinMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSavedSuccess(true);
    showToast('Configurações salvas com sucesso e sincronizadas na nuvem!');
    setTimeout(() => setSavedSuccess(false), 3500);
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    setPinMessage(null);

    if (currentPinInput !== settings.managerPin) {
      setPinMessage({ text: 'PIN atual incorreto.', isError: true });
      return;
    }
    if (newPinInput.length !== 4 || !/^\d{4}$/.test(newPinInput)) {
      setPinMessage({ text: 'O novo PIN deve conter exatamente 4 dígitos numéricos.', isError: true });
      return;
    }
    if (newPinInput !== confirmPinInput) {
      setPinMessage({ text: 'A confirmação do novo PIN não confere.', isError: true });
      return;
    }

    const updated = { ...settings, managerPin: newPinInput };
    onSaveSettings(updated);
    setFormData(updated);
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setPinMessage({ text: 'PIN alterado e salvo com sucesso na nuvem!', isError: false });
    showToast('Novo PIN do Gestor salvo com sucesso!');
  };

  const handleTestWhatsApp = () => {
    const cleanPhone = (formData.managerWhatsapp || '').replace(/\D/g, '');
    const text = encodeURIComponent(`Olá! Teste de conexão do sistema de checklist de ${formData.restaurantName}.`);
    const url = cleanPhone
      ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
      : `https://api.whatsapp.com/send?text=${text}`;
    window.open(url, '_blank');
  };

  const handleResetDefaults = () => {
    if (
      window.confirm(
        'Tem certeza que deseja restaurar as configurações, setores e tarefas para o padrão de fábrica? Todas as tarefas customizadas serão restauradas.'
      )
    ) {
      resetAllDataToDefaults();
      onResetAll();
    }
  };

  return (
    <div className="space-y-6 relative">
      
      {/* Floating Save Toast Banner */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-3 rounded-2xl shadow-xl shadow-emerald-900/30 flex items-center gap-3 border border-emerald-400/30 text-sm font-bold"
          >
            <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white leading-tight">{toastMessage}</p>
              <p className="text-[11px] text-emerald-100 font-normal mt-0.5 flex items-center gap-1">
                <Cloud className="w-3 h-3" /> Alteração gravada no banco de dados
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* General Settings */}
      <form onSubmit={handleSaveGeneral} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Store className="w-4 h-4 text-emerald-600" />
              <span>Configurações do Restaurante & WhatsApp</span>
            </h3>
            <p className="text-xs text-slate-500">
              Configure o destino automático dos relatórios e parâmetros operacionais.
            </p>
          </div>

          {savedSuccess && (
            <motion.span 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Salvo com Sucesso!
            </motion.span>
          )}
        </div>

        {/* Big Alert Banner when saved */}
        <AnimatePresence>
          {savedSuccess && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3 text-emerald-900 text-xs">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center flex-shrink-0">
                  <Cloud className="w-4 h-4" />
                </div>
                <div>
                  <strong className="font-bold block">Configurações Salvas com Sucesso!</strong>
                  <span className="text-emerald-700 text-[11px]">
                    Os dados foram atualizados e sincronizados em nuvem para todos os dispositivos.
                  </span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
              Nome do Restaurante / Estabelecimento
            </label>
            <input
              type="text"
              required
              value={formData.restaurantName}
              onChange={(e) => setFormData({ ...formData, restaurantName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
              Nome do Gestor / Responsável Geral
            </label>
            <input
              type="text"
              value={formData.managerName}
              onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
              WhatsApp do Gestor (com DDI e DDD - Ex: 5511999998888)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  required
                  value={formData.managerWhatsapp}
                  onChange={(e) => setFormData({ ...formData, managerWhatsapp: e.target.value })}
                  placeholder="5511999998888"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-mono font-medium"
                />
              </div>

              <button
                type="button"
                onClick={handleTestWhatsApp}
                className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Testar Link</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Ao concluir o checklist, o botão no app abrirá uma conversa direta com este número com o relatório pronto.
            </p>
          </div>
        </div>

        {/* Photo & Watermark Preferences */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <div>
              <strong className="text-slate-800 block">Carimbo Automático de Auditoria nas Fotos</strong>
              <span className="text-slate-500 text-[11px]">
                Insere data, hora exata, setor, nome da tarefa e do colaborador na foto.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.autoWatermark}
              onChange={(e) => setFormData({ ...formData, autoWatermark: e.target.checked })}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <div>
              <strong className="text-slate-800 block">Exigir Identificação do Colaborador</strong>
              <span className="text-slate-500 text-[11px]">
                Solicita o nome do funcionário ao iniciar o checklist.
              </span>
            </div>
            <input
              type="checkbox"
              checked={formData.requireStaffName}
              onChange={(e) => setFormData({ ...formData, requireStaffName: e.target.checked })}
              className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-600/20 transition"
          >
            <Save className="w-4 h-4" />
            <span>Salvar Configurações</span>
          </button>
        </div>
      </form>

      {/* Change PIN Security Box */}
      <form onSubmit={handleChangePin} className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="pb-3 border-b border-slate-100">
          <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-500" />
            <span>Alterar Senha / PIN do Gestor</span>
          </h3>
          <p className="text-xs text-slate-500">
            O PIN protege o acesso às configurações e exclusão de relatórios (Padrão: 1234).
          </p>
        </div>

        {pinMessage && (
          <div
            className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
              pinMessage.isError
                ? 'bg-rose-50 text-rose-800 border border-rose-200'
                : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
            }`}
          >
            {pinMessage.isError ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{pinMessage.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
              PIN Atual
            </label>
            <input
              type="password"
              maxLength={4}
              required
              value={currentPinInput}
              onChange={(e) => setCurrentPinInput(e.target.value)}
              placeholder="••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-mono text-sm tracking-widest"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
              Novo PIN (4 dígitos)
            </label>
            <input
              type="password"
              maxLength={4}
              required
              value={newPinInput}
              onChange={(e) => setNewPinInput(e.target.value)}
              placeholder="••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-mono text-sm tracking-widest"
            />
          </div>

          <div>
            <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
              Confirmar Novo PIN
            </label>
            <input
              type="password"
              maxLength={4}
              required
              value={confirmPinInput}
              onChange={(e) => setConfirmPinInput(e.target.value)}
              placeholder="••••"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-center font-mono text-sm tracking-widest"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Atualizar PIN</span>
          </button>
        </div>
      </form>

      {/* Danger Zone / Factory Reset */}
      <div className="bg-rose-50/50 p-5 rounded-2xl border border-rose-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <strong className="text-rose-900 font-bold block text-sm">
            Restaurar Checklists de Fábrica
          </strong>
          <span className="text-rose-700 text-xs">
            Restaura todas as tarefas e setores para os checklists completos originais (Salão, Cozinha e Bar).
          </span>
        </div>

        <button
          type="button"
          onClick={handleResetDefaults}
          className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restaurar Padrões</span>
        </button>
      </div>

    </div>
  );
};
