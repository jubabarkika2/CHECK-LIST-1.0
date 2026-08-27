import React, { useState } from 'react';
import { Collaborator } from '../../types';
import { 
  Users, 
  Plus, 
  Search, 
  KeyRound, 
  Edit3, 
  Trash2, 
  Check, 
  X, 
  Eye, 
  EyeOff, 
  Sparkles, 
  ShieldCheck, 
  UserCheck, 
  Shuffle, 
  Lock,
  BadgeCheck,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CollaboratorsTabProps {
  collaborators: Collaborator[];
  onSaveCollaborators: (collaborators: Collaborator[]) => void;
}

export const CollaboratorsTab: React.FC<CollaboratorsTabProps> = ({
  collaborators,
  onSaveCollaborators,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});
  const [editingCollaborator, setEditingCollaborator] = useState<Collaborator | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formName, setFormName] = useState('');
  const [formRole, setFormRole] = useState('Garçom / Atendente');
  const [formPin, setFormPin] = useState('');
  const [formActive, setFormActive] = useState(true);

  const presetRoles = [
    'Garçom / Atendente',
    'Cozinheiro(a)',
    'Chef de Cozinha',
    'Bartender',
    'Auxiliar de Cozinha',
    'Líder de Turno / Maître',
    'Operador(a) de Caixa',
    'Auxiliar de Limpeza',
  ];

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ text, type });
    setTimeout(() => setFeedbackMsg(null), 3000);
  };

  const handleOpenNewModal = () => {
    setEditingCollaborator(null);
    setFormName('');
    setFormRole('Garçom / Atendente');
    // Generate a random 4-digit PIN default
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormPin(randomPin);
    setFormActive(true);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (collab: Collaborator) => {
    setEditingCollaborator(collab);
    setFormName(collab.name);
    setFormRole(collab.role);
    setFormPin(collab.pin);
    setFormActive(collab.active ?? true);
    setIsModalOpen(true);
  };

  const handleGenerateRandomPin = () => {
    const randomPin = Math.floor(1000 + Math.random() * 9000).toString();
    setFormPin(randomPin);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast('Por favor, informe o nome do colaborador.', 'error');
      return;
    }

    if (!formPin.trim() || formPin.trim().length < 3) {
      showToast('A senha/PIN deve ter no mínimo 3 caracteres ou dígitos.', 'error');
      return;
    }

    if (editingCollaborator) {
      // Edit existing
      const updated = collaborators.map((c) =>
        c.id === editingCollaborator.id
          ? {
              ...c,
              name: formName.trim(),
              role: formRole.trim(),
              pin: formPin.trim(),
              active: formActive,
            }
          : c
      );
      onSaveCollaborators(updated);
      showToast(`Colaborador "${formName.trim()}" atualizado com sucesso!`);
    } else {
      // Create new
      const newCollab: Collaborator = {
        id: `collab-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        name: formName.trim(),
        role: formRole.trim(),
        pin: formPin.trim(),
        active: formActive,
        createdAt: new Date().toISOString(),
      };
      onSaveCollaborators([...collaborators, newCollab]);
      showToast(`Colaborador "${formName.trim()}" cadastrado com sucesso!`);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (collab: Collaborator) => {
    if (window.confirm(`Tem certeza que deseja remover o colaborador "${collab.name}"?`)) {
      const updated = collaborators.filter((c) => c.id !== collab.id);
      onSaveCollaborators(updated);
      showToast(`Colaborador "${collab.name}" removido.`);
    }
  };

  const togglePinVisibility = (id: string) => {
    setShowPins((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredCollaborators = collaborators.filter((c) => {
    const term = searchTerm.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.role.toLowerCase().includes(term) ||
      c.pin.includes(term)
    );
  });

  const activeCount = collaborators.filter((c) => c.active !== false).length;

  return (
    <div className="space-y-6">
      
      {/* Toast Feedback */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold shadow-md ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-rose-50 text-rose-800 border-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{feedbackMsg.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Header & Metrics */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-emerald-600" />
              <span>Cadastro de Colaboradores & Senhas</span>
            </h3>
            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full border border-slate-200">
              {activeCount} de {collaborators.length} ativos
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Cadastre nomes e senhas (PINs) individuais para cada membro da equipe registrar seus checklists.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewModal}
          className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 transition flex-shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Cadastrar Novo Colaborador</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar colaborador por nome, função ou senha..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-white border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-medium text-slate-800 shadow-xs"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
          >
            Limpar
          </button>
        )}
      </div>

      {/* Collaborators List */}
      {filteredCollaborators.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400 mb-3">
            <Users className="w-6 h-6" />
          </div>
          <h4 className="font-bold text-slate-800 text-sm">
            {searchTerm ? 'Nenhum colaborador encontrado' : 'Nenhum colaborador cadastrado'}
          </h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
            {searchTerm
              ? 'Tente buscar por outro termo ou limpe a busca.'
              : 'Cadastre os membros da sua equipe para que eles tenham acesso com nome e senha individual.'}
          </p>
          {!searchTerm && (
            <button
              type="button"
              onClick={handleOpenNewModal}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold inline-flex items-center gap-1.5 transition shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Colaborador</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredCollaborators.map((collab) => {
            const isPinVisible = showPins[collab.id] || false;
            const isActive = collab.active !== false;

            return (
              <div
                key={collab.id}
                className={`bg-white rounded-2xl border p-4 shadow-xs flex flex-col justify-between transition hover:shadow-md ${
                  isActive ? 'border-slate-200' : 'border-slate-200/60 opacity-60 bg-slate-50'
                }`}
              >
                <div>
                  {/* Top line with role and status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200/80 truncate">
                      {collab.role}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border border-slate-200'
                      }`}
                    >
                      {isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>

                  {/* Name */}
                  <div className="flex items-center gap-2.5 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center font-bold text-sm flex-shrink-0">
                      {collab.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <h4 className="font-bold text-slate-900 text-sm truncate">
                        {collab.name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {isActive ? 'Liberado para checklists' : 'Acesso suspenso'}
                      </p>
                    </div>
                  </div>

                  {/* Password / PIN Box */}
                  <div className="bg-slate-900 text-white rounded-xl p-2.5 flex items-center justify-between gap-2 mb-3 border border-slate-800">
                    <div className="flex items-center gap-2 min-w-0">
                      <KeyRound className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <span className="text-[11px] text-slate-400 font-medium">Senha/PIN:</span>
                      <span className="font-mono font-bold text-sm tracking-wider text-amber-400">
                        {isPinVisible ? collab.pin : '••••'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => togglePinVisibility(collab.id)}
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition"
                      title={isPinVisible ? 'Ocultar PIN' : 'Ver PIN'}
                    >
                      {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(collab)}
                    className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition"
                    title="Editar colaborador e senha"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(collab)}
                    className="p-2 rounded-lg text-rose-600 hover:text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition"
                    title="Excluir colaborador"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal for Creating / Editing Collaborator */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200"
            >
              {/* Modal Header */}
              <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center flex-shrink-0">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-white">
                      {editingCollaborator ? 'Editar Colaborador' : 'Novo Colaborador'}
                    </h3>
                    <p className="text-xs text-slate-300">
                      Configure o nome, cargo e a senha individual de acesso.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSave} className="p-5 space-y-4 text-xs">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Nome Completo do Colaborador *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Carlos Silva, Mariana Lima..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-600 mb-1">
                    Função / Cargo no Restaurante
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    {presetRoles.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setFormRole(r)}
                        className={`py-1.5 px-2.5 rounded-lg text-xs font-medium text-left truncate transition ${
                          formRole === r
                            ? 'bg-slate-900 text-white font-bold'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    placeholder="Ou digite outra função..."
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium text-slate-700"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block font-bold uppercase tracking-wider text-slate-600">
                      Senha / PIN de Acesso (4 dígitos ou código) *
                    </label>
                    <button
                      type="button"
                      onClick={handleGenerateRandomPin}
                      className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1"
                    >
                      <Shuffle className="w-3 h-3" /> Gerar PIN Aleatório
                    </button>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      value={formPin}
                      onChange={(e) => setFormPin(e.target.value)}
                      placeholder="Ex: 1234, 8842..."
                      maxLength={12}
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm font-bold text-slate-900"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    O colaborador usará esse PIN para iniciar e assinar seus checklists de rotina.
                  </p>
                </div>

                {/* Status Active Toggle */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div>
                    <span className="font-bold text-slate-800 block text-xs">Status do Colaborador</span>
                    <span className="text-[11px] text-slate-400">Permitir login e preenchimento de checklists</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFormActive(!formActive)}
                    className={`w-11 h-6 flex items-center rounded-full p-1 transition duration-300 ${
                      formActive ? 'bg-emerald-600' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`bg-white w-4 h-4 rounded-full shadow-md transform transition duration-300 ${
                        formActive ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Buttons */}
                <div className="flex gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold hover:bg-slate-50 transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
                  >
                    <Check className="w-4 h-4" />
                    <span>{editingCollaborator ? 'Salvar Alterações' : 'Cadastrar Colaborador'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
