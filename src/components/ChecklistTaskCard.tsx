import React, { useState } from 'react';
import { 
  TaskTemplate, 
  TaskCompletion 
} from '../types';
import { 
  Check, 
  Camera, 
  Upload, 
  AlertCircle, 
  Info, 
  Maximize2, 
  Trash2, 
  Clock, 
  Sparkles,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface ChecklistTaskCardProps {
  task: TaskTemplate;
  completion?: TaskCompletion;
  onToggleComplete: (taskId: string) => void;
  onOpenCamera: (task: TaskTemplate) => void;
  onRemovePhoto: (taskId: string) => void;
  onViewPhoto: (photoUrl: string, taskTitle: string, timestamp?: string, notes?: string) => void;
  onUpdateNotes: (taskId: string, notes: string) => void;
}

export const ChecklistTaskCard: React.FC<ChecklistTaskCardProps> = ({
  task,
  completion,
  onToggleComplete,
  onOpenCamera,
  onRemovePhoto,
  onViewPhoto,
  onUpdateNotes,
}) => {
  const [showNotes, setShowNotes] = useState(Boolean(completion?.notes));
  const [notesInput, setNotesInput] = useState(completion?.notes || '');

  const isCompleted = Boolean(completion?.completed);
  const hasPhoto = Boolean(completion?.photoUrl);
  const photoTimestamp = completion?.photoTimestamp;

  const handleNotesBlur = () => {
    onUpdateNotes(task.id, notesInput);
  };

  const handleCheckClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onToggleComplete(task.id);
  };

  return (
    <div
      id={`task-card-${task.id}`}
      className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
        isCompleted
          ? 'bg-emerald-50/70 border-emerald-300/80 shadow-xs'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      }`}
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          
          {/* Checkbox Button */}
          <button
            type="button"
            id={`task-check-btn-${task.id}`}
            onClick={handleCheckClick}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-all duration-200 mt-0.5 ${
              isCompleted
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                : 'border-2 border-slate-300 hover:border-emerald-500 bg-white text-transparent'
            }`}
            title={isCompleted ? 'Marcar como pendente' : 'Marcar como concluída'}
          >
            <Check className="w-4 h-4 sm:w-5 sm:h-5 stroke-[3]" />
          </button>

          {/* Main Task Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
              {/* Category */}
              <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                {task.category}
              </span>

              {/* Photo Requirement Badge */}
              {task.requiresPhoto ? (
                <span
                  className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md flex items-center gap-1 ${
                    hasPhoto
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse'
                  }`}
                >
                  <Camera className="w-3 h-3" />
                  {hasPhoto ? 'Foto Anexada ✓' : 'Foto Obrigatória'}
                </span>
              ) : (
                <span className="text-[10px] sm:text-xs text-slate-600 px-2 py-0.5 rounded-md bg-slate-50 border border-slate-200">
                  Foto Opcional
                </span>
              )}

              {/* Shift badge */}
              <span className="text-[10px] sm:text-xs text-slate-600 capitalize px-2 py-0.5 rounded-md bg-slate-100">
                {task.shift === 'abertura' ? 'Abertura' : task.shift === 'fechamento' ? 'Fechamento' : 'Durante o Turno'}
              </span>
            </div>

            {/* Task Title */}
            <h4
              className={`text-sm sm:text-base font-bold leading-snug ${
                isCompleted ? 'text-emerald-950 line-through/20' : 'text-slate-900'
              }`}
            >
              {task.title}
            </h4>

            {/* Task Description */}
            {task.description && (
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {task.description}
              </p>
            )}

            {/* Critical Alert Warning */}
            {task.criticalNotice && (
              <div className="mt-2.5 flex items-start gap-1.5 text-xs text-amber-900 bg-amber-50/90 border border-amber-200 p-2 rounded-xl">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{task.criticalNotice}</span>
              </div>
            )}

            {/* Attached Photo Preview */}
            {hasPhoto && completion?.photoUrl && (
              <div className="mt-3 p-2 bg-slate-900 rounded-xl flex items-center justify-between gap-3 text-white">
                <div 
                  className="flex items-center gap-3 cursor-pointer group flex-1 min-w-0"
                  onClick={() => onViewPhoto(completion.photoUrl!, task.title, photoTimestamp, completion.notes)}
                >
                  <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-slate-700 bg-black">
                    <img
                      src={completion.photoUrl}
                      alt="Comprovante"
                      className="w-full h-full object-cover group-hover:scale-105 transition"
                    />
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                      <Maximize2 className="w-4 h-4 text-white" />
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Comprovante Registrado</span>
                    </div>
                    {photoTimestamp && (
                      <p className="text-[11px] text-slate-400 truncate mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {photoTimestamp}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => onOpenCamera(task)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                    title="Tirar outra foto"
                  >
                    Substituir
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(task.id)}
                    className="p-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800 transition"
                    title="Remover foto"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Bar (Camera button & Notes toggle) */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                {!hasPhoto && (
                  <button
                    type="button"
                    id={`btn-camera-${task.id}`}
                    onClick={() => onOpenCamera(task)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition shadow-xs ${
                      task.requiresPhoto
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                    }`}
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{task.requiresPhoto ? 'Tirar Foto Comprobatória' : 'Anexar Foto Opcional'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setShowNotes(!showNotes)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{notesInput ? 'Editar Observação' : 'Adicionar Observação'}</span>
                  {showNotes ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Notes input area */}
            {showNotes && (
              <div className="mt-2.5">
                <textarea
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  onBlur={handleNotesBlur}
                  placeholder="Escreva uma observação importante para o gestor (ex: termômetro estava em 3.2°C, reabastecido azeite extra)..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-800 placeholder-slate-400 resize-none h-16"
                />
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};
