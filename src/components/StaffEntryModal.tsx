import React, { useState, useEffect } from 'react';
import { User, Check, KeyRound, ArrowLeft, Plus, AlertCircle, Sparkles, UserCheck, Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Collaborator } from '../types';

interface StaffEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, role: string) => void;
  currentName: string;
  currentRole: string;
  sectorName: string;
  collaborators?: Collaborator[];
}

export const StaffEntryModal: React.FC<StaffEntryModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  currentName,
  currentRole,
  sectorName,
  collaborators = [],
}) => {
  const activeCollaborators = collaborators.filter((c) => c.active !== false);

  // If there are registered collaborators, default to selection mode; otherwise manual mode
  const [mode, setMode] = useState<'select' | 'pin' | 'manual'>(
    activeCollaborators.length > 0 ? 'select' : 'manual'
  );

  const [selectedCollab, setSelectedCollab] = useState<Collaborator | null>(null);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Manual form state
  const [manualName, setManualName] = useState(currentName || '');
  const [manualRole, setManualRole] = useState(currentRole || 'Colaborador');

  const presetRoles = [
    'Garçom / Atendente',
    'Cozinheiro(a)',
    'Chef de Cozinha',
    'Bartender',
    'Auxiliar de Cozinha',
    'Líder de Turno / Maître',
    'Operador(a) de Caixa',
  ];

  useEffect(() => {
    if (isOpen) {
      if (activeCollaborators.length > 0) {
        setMode('select');
      } else {
        setMode('manual');
      }
      setSelectedCollab(null);
      setPinInput('');
      setPinError(false);
      setErrorMessage('');
      setManualName(currentName || '');
      setManualRole(currentRole || 'Colaborador');
    }
  }, [isOpen, collaborators.length]);

  const handleSelectCollaborator = (collab: Collaborator) => {
    setSelectedCollab(collab);
    setPinInput('');
    setPinError(false);
    setErrorMessage('');

    // If collaborator has a pin, ask for pin, otherwise immediately confirm
    if (collab.pin && collab.pin.trim().length > 0) {
      setMode('pin');
    } else {
      onConfirm(collab.name, collab.role);
    }
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!selectedCollab) return;

    if (pinInput.trim() === selectedCollab.pin.trim()) {
      setPinError(false);
      onConfirm(selectedCollab.name, selectedCollab.role);
    } else {
      setPinError(true);
      setErrorMessage('Senha/PIN incorreto. Tente novamente.');
      setPinInput('');
    }
  };

  const handleKeypadPress = (val: string) => {
    if (pinInput.length < 8) {
      const nextPin = pinInput + val;
      setPinInput(nextPin);
      setPinError(false);
      setErrorMessage('');

      // Auto submit if matches length of target pin
      if (selectedCollab && nextPin.length === selectedCollab.pin.length) {
        if (nextPin === selectedCollab.pin) {
          onConfirm(selectedCollab.name, selectedCollab.role);
        } else {
          setPinError(true);
          setErrorMessage('Senha/PIN incorreto. Tente novamente.');
          setTimeout(() => setPinInput(''), 400);
        }
      }
    }
  };

  const handleKeypadBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
    setPinError(false);
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualName.trim()) {
      onConfirm(manualName.trim(), manualRole);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
        >
          {/* Header */}
          <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base text-white truncate">Identificação do Colaborador</h3>
                <p className="text-xs text-slate-300 truncate">
                  Checklist do setor: <strong className="text-emerald-400">{sectorName}</strong>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 active:bg-slate-600 text-slate-300 hover:text-white flex items-center justify-center transition flex-shrink-0 ml-2"
              title="Fechar / Voltar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* VIEW 1: SELECT REGISTERED COLLABORATOR */}
          {mode === 'select' && (
            <div className="p-5 space-y-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Selecione seu nome na equipe:
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {activeCollaborators.map((collab) => (
                    <button
                      key={collab.id}
                      type="button"
                      onClick={() => handleSelectCollaborator(collab)}
                      className="w-full p-3 rounded-xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/50 flex items-center justify-between text-left transition group shadow-2xs"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 group-hover:bg-emerald-600 group-hover:text-white text-slate-700 font-bold text-sm flex items-center justify-center transition flex-shrink-0">
                          {collab.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-sm text-slate-900 group-hover:text-emerald-900 truncate">
                            {collab.name}
                          </h4>
                          <span className="text-[11px] text-slate-500">
                            {collab.role}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-xs text-slate-400 group-hover:text-emerald-600 font-semibold pl-2">
                        <KeyRound className="w-3.5 h-3.5" />
                        <span>Entrar</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => setMode('manual')}
                  className="text-xs text-slate-600 hover:text-slate-900 font-semibold flex items-center gap-1 py-1.5 px-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Digitação Manual</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition flex items-center gap-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar / Fechar</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 2: PIN ENTRY FOR SELECTED COLLABORATOR */}
          {mode === 'pin' && selectedCollab && (
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-slate-100 transition"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Trocar Colaborador</span>
                </button>
                <span className="text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  {selectedCollab.role}
                </span>
              </div>

              <div className="text-center py-1">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 font-bold text-lg flex items-center justify-center mx-auto mb-2 shadow-xs">
                  {selectedCollab.name.charAt(0).toUpperCase()}
                </div>
                <h4 className="font-bold text-slate-900 text-base">{selectedCollab.name}</h4>
                <p className="text-xs text-slate-500">Digite sua senha/PIN de 4 dígitos:</p>
              </div>

              {/* PIN circles indicator */}
              <div className="flex justify-center gap-3 my-2">
                {[0, 1, 2, 3].map((index) => {
                  const isFilled = index < pinInput.length;
                  return (
                    <div
                      key={index}
                      className={`w-3.5 h-3.5 rounded-full transition-all duration-200 ${
                        pinError
                          ? 'bg-rose-500 ring-2 ring-rose-300'
                          : isFilled
                            ? 'bg-emerald-600 scale-110'
                            : 'bg-slate-200'
                      }`}
                    />
                  );
                })}
              </div>

              {/* Error text */}
              {errorMessage && (
                <p className="text-xs font-bold text-rose-600 text-center flex items-center justify-center gap-1 animate-shake">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{errorMessage}</span>
                </p>
              )}

              {/* Numeric Keypad */}
              <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleKeypadPress(digit)}
                    className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-lg flex items-center justify-center transition shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={() => setPinInput('')}
                  className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-500 font-medium text-xs flex items-center justify-center transition"
                >
                  Limpar
                </button>

                <button
                  type="button"
                  onClick={() => handleKeypadPress('0')}
                  className="h-11 rounded-xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 font-bold text-lg flex items-center justify-center transition shadow-2xs"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleKeypadBackspace}
                  className="h-11 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold text-sm flex items-center justify-center transition"
                >
                  ⌫
                </button>
              </div>

              {/* Buttons Row */}
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs transition text-center"
                >
                  Cancelar / Voltar
                </button>
                <button
                  type="button"
                  onClick={() => handlePinSubmit()}
                  disabled={pinInput.length === 0}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 font-bold text-white text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Confirmar</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 3: MANUAL ENTRY */}
          {mode === 'manual' && (
            <form onSubmit={handleManualSubmit} className="p-5 space-y-4">
              {activeCollaborators.length > 0 && (
                <button
                  type="button"
                  onClick={() => setMode('select')}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 pb-1"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Voltar para Lista de Colaboradores</span>
                </button>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Seu Nome Completo ou Primeiro Nome
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  placeholder="Ex: Carlos Silva, Juliana..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                  Sua Função no Restaurante
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  {presetRoles.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setManualRole(r)}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-medium text-left truncate transition ${
                        manualRole === r
                          ? 'bg-slate-900 text-white font-bold'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 text-xs transition"
                >
                  Cancelar / Voltar
                </button>
                <button
                  type="submit"
                  disabled={!manualName.trim()}
                  className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 font-bold text-white text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 transition"
                >
                  <Check className="w-4 h-4" />
                  <span>Continuar</span>
                </button>
              </div>
            </form>
          )}

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
