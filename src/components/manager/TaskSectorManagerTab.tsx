import React, { useState } from 'react';
import { 
  Sector, 
  TaskTemplate, 
  ShiftType, 
  TaskCategory 
} from '../../types';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Camera, 
  AlertCircle, 
  Layers, 
  Check, 
  X, 
  ChefHat, 
  UtensilsCrossed, 
  Wine, 
  ShieldCheck, 
  Boxes, 
  Sparkles,
  DollarSign
} from 'lucide-react';
import { getSectorIcon } from '../SectorSelector';

interface TaskSectorManagerTabProps {
  sectors: Sector[];
  tasks: TaskTemplate[];
  onSaveSectors: (sectors: Sector[]) => void;
  onSaveTasks: (tasks: TaskTemplate[]) => void;
}

const CATEGORIES: TaskCategory[] = [
  'Limpeza e Higiene',
  'Montagem & Setup',
  'Controle & Temperaturas',
  'Segurança & Validades',
  'Equipamentos',
  'Atendimento & Salão',
  'Outros',
];

export const TaskSectorManagerTab: React.FC<TaskSectorManagerTabProps> = ({
  sectors,
  tasks,
  onSaveSectors,
  onSaveTasks,
}) => {
  const [activeSectorId, setActiveSectorId] = useState<string>(sectors[0]?.id || 'salao-garcons');
  
  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TaskTemplate | null>(null);

  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);

  // Form states for Task
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskRequiresPhoto, setTaskRequiresPhoto] = useState(true);
  const [taskShift, setTaskShift] = useState<ShiftType>('abertura');
  const [taskCategory, setTaskCategory] = useState<TaskCategory>('Limpeza e Higiene');
  const [taskCriticalNotice, setTaskCriticalNotice] = useState('');

  // Form states for Sector
  const [sectorName, setSectorName] = useState('');
  const [sectorDesc, setSectorDesc] = useState('');
  const [sectorIcon, setSectorIcon] = useState('UtensilsCrossed');
  const [sectorColor, setSectorColor] = useState('emerald');

  const currentSector = sectors.find((s) => s.id === activeSectorId) || sectors[0];
  const currentSectorTasks = tasks
    .filter((t) => t.sectorId === activeSectorId)
    .sort((a, b) => a.order - b.order);

  // Task Handlers
  const handleOpenNewTask = () => {
    setEditingTask(null);
    setTaskTitle('');
    setTaskDesc('');
    setTaskRequiresPhoto(true);
    setTaskShift('abertura');
    setTaskCategory('Limpeza e Higiene');
    setTaskCriticalNotice('');
    setIsTaskModalOpen(true);
  };

  const handleOpenEditTask = (t: TaskTemplate) => {
    setEditingTask(t);
    setTaskTitle(t.title);
    setTaskDesc(t.description || '');
    setTaskRequiresPhoto(t.requiresPhoto);
    setTaskShift(t.shift);
    setTaskCategory(t.category);
    setTaskCriticalNotice(t.criticalNotice || '');
    setIsTaskModalOpen(true);
  };

  const handleSaveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    if (editingTask) {
      const updated = tasks.map((t) =>
        t.id === editingTask.id
          ? {
              ...t,
              title: taskTitle.trim(),
              description: taskDesc.trim(),
              requiresPhoto: taskRequiresPhoto,
              shift: taskShift,
              category: taskCategory,
              criticalNotice: taskCriticalNotice.trim() || undefined,
            }
          : t
      );
      onSaveTasks(updated);
    } else {
      const newTask: TaskTemplate = {
        id: `task-${Date.now()}`,
        sectorId: activeSectorId,
        title: taskTitle.trim(),
        description: taskDesc.trim(),
        requiresPhoto: taskRequiresPhoto,
        shift: taskShift,
        order: currentSectorTasks.length + 1,
        category: taskCategory,
        criticalNotice: taskCriticalNotice.trim() || undefined,
      };
      onSaveTasks([...tasks, newTask]);
    }

    setIsTaskModalOpen(false);
  };

  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta tarefa do checklist?')) {
      const updated = tasks.filter((t) => t.id !== taskId);
      onSaveTasks(updated);
    }
  };

  const handleMoveTask = (index: number, direction: 'up' | 'down') => {
    const newTasks = [...currentSectorTasks];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newTasks.length) return;

    const temp = newTasks[index];
    newTasks[index] = newTasks[targetIndex];
    newTasks[targetIndex] = temp;

    // Update order values
    const reorderedSectorTasks = newTasks.map((t, idx) => ({ ...t, order: idx + 1 }));
    const otherTasks = tasks.filter((t) => t.sectorId !== activeSectorId);
    onSaveTasks([...otherTasks, ...reorderedSectorTasks]);
  };

  // Sector Handlers
  const handleOpenNewSector = () => {
    setEditingSector(null);
    setSectorName('');
    setSectorDesc('');
    setSectorIcon('UtensilsCrossed');
    setSectorColor('emerald');
    setIsSectorModalOpen(true);
  };

  const handleOpenEditSector = (sec: Sector) => {
    setEditingSector(sec);
    setSectorName(sec.name);
    setSectorDesc(sec.description);
    setSectorIcon(sec.icon);
    setSectorColor(sec.color);
    setIsSectorModalOpen(true);
  };

  const handleSaveSector = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sectorName.trim()) return;

    if (editingSector) {
      const updated = sectors.map((s) =>
        s.id === editingSector.id
          ? {
              ...s,
              name: sectorName.trim(),
              description: sectorDesc.trim(),
              icon: sectorIcon,
              color: sectorColor,
            }
          : s
      );
      onSaveSectors(updated);
    } else {
      const newSec: Sector = {
        id: `sec-${Date.now()}`,
        name: sectorName.trim(),
        description: sectorDesc.trim(),
        icon: sectorIcon,
        color: sectorColor,
        isDefault: false,
      };
      onSaveSectors([...sectors, newSec]);
      setActiveSectorId(newSec.id);
    }

    setIsSectorModalOpen(false);
  };

  const handleDeleteSector = (secId: string) => {
    if (sectors.length <= 1) {
      alert('Você precisa manter ao menos 1 setor no aplicativo.');
      return;
    }
    if (
      window.confirm(
        'Deseja excluir este setor e todas as suas tarefas vinculadas? Esta ação não pode ser desfeita.'
      )
    ) {
      const updatedSectors = sectors.filter((s) => s.id !== secId);
      const updatedTasks = tasks.filter((t) => t.sectorId !== secId);
      onSaveSectors(updatedSectors);
      onSaveTasks(updatedTasks);
      setActiveSectorId(updatedSectors[0]?.id || '');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Sector Selection & Creation Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-emerald-600" />
            <h3 className="font-bold text-slate-800 text-sm">Gerenciar Setores</h3>
          </div>

          <button
            type="button"
            onClick={handleOpenNewSector}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Novo Setor</span>
          </button>
        </div>

        {/* Sector Pills */}
        <div className="flex flex-wrap gap-2">
          {sectors.map((sec) => {
            const isSelected = sec.id === activeSectorId;
            const secTaskCount = tasks.filter((t) => t.sectorId === sec.id).length;

            return (
              <div
                key={sec.id}
                className={`inline-flex items-center rounded-xl border transition ${
                  isSelected
                    ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveSectorId(sec.id)}
                  className="px-3 py-2 text-xs font-bold flex items-center gap-1.5"
                >
                  {getSectorIcon(sec.icon, 'w-3.5 h-3.5')}
                  <span>{sec.name}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-semibold ${
                      isSelected ? 'bg-slate-800 text-emerald-400' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {secTaskCount}
                  </span>
                </button>

                <div className="flex items-center pr-1.5 border-l border-white/20 pl-1">
                  <button
                    type="button"
                    onClick={() => handleOpenEditSector(sec)}
                    className="p-1 text-slate-400 hover:text-white transition"
                    title="Editar setor"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  {!sec.isDefault && (
                    <button
                      type="button"
                      onClick={() => handleDeleteSector(sec.id)}
                      className="p-1 text-slate-400 hover:text-rose-400 transition"
                      title="Excluir setor"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task List for Active Sector */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        
        {/* Sector Info Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-slate-900 text-base">
                Tarefas de: {currentSector?.name}
              </h3>
              <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                {currentSectorTasks.length} tarefas cadastradas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {currentSector?.description}
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenNewTask}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4 text-emerald-400" />
            <span>Adicionar Nova Tarefa</span>
          </button>
        </div>

        {/* Tasks List */}
        {currentSectorTasks.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs">
            Nenhuma tarefa cadastrada neste setor. Clique no botão acima para adicionar.
          </div>
        ) : (
          <div className="space-y-2.5">
            {currentSectorTasks.map((t, idx) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300 transition flex items-start justify-between gap-3 text-xs"
              >
                <div className="flex items-start gap-3 min-w-0">
                  {/* Order & Reorder arrows */}
                  <div className="flex flex-col items-center gap-0.5 mt-0.5">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => handleMoveTask(idx, 'up')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition"
                      title="Mover para cima"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-bold text-[11px] text-slate-600">
                      {idx + 1}
                    </span>
                    <button
                      type="button"
                      disabled={idx === currentSectorTasks.length - 1}
                      onClick={() => handleMoveTask(idx, 'down')}
                      className="p-0.5 text-slate-400 hover:text-slate-700 disabled:opacity-20 transition"
                      title="Mover para baixo"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Task Content */}
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="font-semibold text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded">
                        {t.category}
                      </span>
                      <span className="text-[10px] capitalize bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        Turno: {t.shift}
                      </span>
                      {t.requiresPhoto ? (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded flex items-center gap-0.5">
                          <Camera className="w-2.5 h-2.5" /> Foto Obrigatória
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400">Foto opcional</span>
                      )}
                    </div>

                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">
                      {t.title}
                    </h4>

                    {t.description && (
                      <p className="text-slate-500 text-xs mt-0.5 leading-relaxed">
                        {t.description}
                      </p>
                    )}

                    {t.criticalNotice && (
                      <p className="text-amber-800 text-[11px] font-semibold mt-1 flex items-center gap-1 bg-amber-50 p-1.5 rounded-md">
                        <AlertCircle className="w-3 h-3 text-amber-600" />
                        {t.criticalNotice}
                      </p>
                    )}
                  </div>
                </div>

                {/* Edit / Delete Buttons */}
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEditTask(t)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                    title="Editar tarefa"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteTask(t.id)}
                    className="p-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: ADD / EDIT TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200 my-8">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingTask ? 'Editar Tarefa do Checklist' : 'Nova Tarefa no Checklist'}
              </h3>
              <button
                type="button"
                onClick={() => setIsTaskModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTask} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Título da Tarefa *
                </label>
                <input
                  type="text"
                  required
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  placeholder="Ex: Sanitizar bancadas de inox..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Instruções Detalhadas para a Equipe (Opcional)
                </label>
                <textarea
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  placeholder="Explique como a tarefa deve ser feita, produtos utilizados, etc..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs h-20 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Turno de Aplicação
                  </label>
                  <select
                    value={taskShift}
                    onChange={(e) => setTaskShift(e.target.value as ShiftType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none text-xs"
                  >
                    <option value="abertura">Abertura</option>
                    <option value="durante">Durante o Turno</option>
                    <option value="fechamento">Fechamento</option>
                    <option value="todos">Todos os Turnos</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Categoria
                  </label>
                  <select
                    value={taskCategory}
                    onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none text-xs"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Photo Requirement Toggle */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="text-slate-800 block">Exigir Foto Comprobatória?</strong>
                  <span className="text-slate-500 text-[11px]">
                    O funcionário só consegue concluir a tarefa após anexar a foto com carimbo
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={taskRequiresPhoto}
                  onChange={(e) => setTaskRequiresPhoto(e.target.checked)}
                  className="w-5 h-5 accent-emerald-600 rounded cursor-pointer"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Alerta Crítico / Aviso em Destaque (Opcional)
                </label>
                <input
                  type="text"
                  value={taskCriticalNotice}
                  onChange={(e) => setTaskCriticalNotice(e.target.value)}
                  placeholder="Ex: Não ligar a fritadeira sem conferir o nível do óleo!"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTaskModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-md shadow-emerald-600/20"
                >
                  Salvar Tarefa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD / EDIT SECTOR */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">
                {editingSector ? 'Editar Setor Operacional' : 'Criar Novo Setor'}
              </h3>
              <button
                type="button"
                onClick={() => setIsSectorModalOpen(false)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSector} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Nome do Setor *
                </label>
                <input
                  type="text"
                  required
                  value={sectorName}
                  onChange={(e) => setSectorName(e.target.value)}
                  placeholder="Ex: Bar & Bebidas, Caixa, Estoque..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-medium"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Breve Descrição do Setor
                </label>
                <input
                  type="text"
                  value={sectorDesc}
                  onChange={(e) => setSectorDesc(e.target.value)}
                  placeholder="Ex: Abertura e sanitização do bar e controle de cervejeiras."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Ícone Representativo
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { id: 'UtensilsCrossed', label: 'Salão' },
                    { id: 'ChefHat', label: 'Cozinha' },
                    { id: 'Wine', label: 'Bar' },
                    { id: 'ShieldCheck', label: 'Segurança' },
                    { id: 'Boxes', label: 'Estoque' },
                  ].map((ic) => (
                    <button
                      key={ic.id}
                      type="button"
                      onClick={() => setSectorIcon(ic.id)}
                      className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition ${
                        sectorIcon === ic.id
                          ? 'bg-slate-900 border-slate-900 text-white'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      {getSectorIcon(ic.id, 'w-5 h-5')}
                      <span className="text-[9px]">{ic.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSectorModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-white shadow-md shadow-emerald-600/20"
                >
                  Salvar Setor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
