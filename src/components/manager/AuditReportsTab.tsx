import React, { useState } from 'react';
import { 
  ChecklistSubmission, 
  Sector, 
  ShiftType, 
  ManagerSettings 
} from '../../types';
import { 
  FileText, 
  Calendar, 
  User, 
  Camera, 
  CheckCircle2, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Printer, 
  Filter, 
  Search, 
  ExternalLink,
  MessageSquare,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { deleteSubmission, updateSubmissionReview, generateWhatsAppMessage } from '../../utils/storage';

interface AuditReportsTabProps {
  submissions: ChecklistSubmission[];
  sectors: Sector[];
  settings: ManagerSettings;
  onRefreshSubmissions: () => void;
  onViewPhoto: (photoUrl: string, taskTitle: string, timestamp?: string, notes?: string) => void;
  onPrintSubmission: (submission: ChecklistSubmission) => void;
}

export const AuditReportsTab: React.FC<AuditReportsTabProps> = ({
  submissions,
  sectors,
  settings,
  onRefreshSubmissions,
  onViewPhoto,
  onPrintSubmission,
}) => {
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});

  // Filter submissions
  const filteredSubmissions = submissions.filter((sub) => {
    if (selectedSector !== 'all' && sub.sectorId !== selectedSector) return false;
    if (selectedShift !== 'all' && sub.shift !== selectedShift) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchStaff = sub.responsibleName.toLowerCase().includes(q);
      const matchCode = sub.submissionCode.toLowerCase().includes(q);
      const matchSector = sub.sectorName.toLowerCase().includes(q);
      if (!matchStaff && !matchCode && !matchSector) return false;
    }
    return true;
  });

  const handleDelete = async (id: string, code: string) => {
    if (window.confirm(`Deseja realmente excluir a auditoria #${code}?`)) {
      await deleteSubmission(id);
      onRefreshSubmissions();
    }
  };

  const handleUpdateReview = async (
    id: string, 
    status: 'aprovado' | 'pendente' | 'ressalvas',
    feedback?: string
  ) => {
    await updateSubmissionReview(id, { status, feedback });
    onRefreshSubmissions();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Filter Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por colaborador, setor ou código..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Sector Filter */}
          <div className="flex gap-2">
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-slate-50 focus:bg-white focus:outline-none"
            >
              <option value="all">Todos os Setores</option>
              {sectors.map((sec) => (
                <option key={sec.id} value={sec.id}>
                  {sec.name}
                </option>
              ))}
            </select>

            {/* Shift Filter */}
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-medium text-slate-700 bg-slate-50 focus:bg-white focus:outline-none"
            >
              <option value="all">Todos os Turnos</option>
              <option value="abertura">Abertura</option>
              <option value="durante">Durante o Turno</option>
              <option value="fechamento">Fechamento</option>
            </select>
          </div>

        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <span>
            Exibindo <strong>{filteredSubmissions.length}</strong> de {submissions.length} auditorias realizadas
          </span>
          <span className="text-emerald-600 font-semibold">
            {submissions.reduce((acc, curr) => acc + curr.photosCount, 0)} fotos comprovatórias arquivadas
          </span>
        </div>
      </div>

      {/* Submissions List */}
      {filteredSubmissions.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-slate-800 text-base">Nenhum relatório encontrado</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Quando os colaboradores concluírem os checklists no modo operacional, os relatórios completos e fotos aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredSubmissions.map((sub) => {
            const isExpanded = expandedId === sub.id;
            const completedDate = new Date(sub.completedAt);
            const dateFormatted = completedDate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
            });
            const timeFormatted = completedDate.toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const reviewStatus = sub.managerReview?.status || 'pendente';

            return (
              <div
                key={sub.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all duration-200"
              >
                {/* Submission Header Card */}
                <div
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-slate-50/70 transition"
                  onClick={() => setExpandedId(isExpanded ? null : sub.id)}
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold flex-shrink-0">
                      <FileText className="w-5 h-5 text-emerald-400" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                          #{sub.submissionCode}
                        </span>
                        <span className="font-bold text-slate-900 text-sm sm:text-base">
                          {sub.sectorName}
                        </span>
                        <span className="text-xs text-slate-500 capitalize bg-slate-100 px-2 py-0.5 rounded-md">
                          {sub.shift}
                        </span>

                        {/* Review Status Badge */}
                        <span
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full capitalize ${
                            reviewStatus === 'aprovado'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : reviewStatus === 'ressalvas'
                              ? 'bg-amber-100 text-amber-900 border border-amber-300'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {reviewStatus === 'aprovado' ? '✓ Aprovado pelo Gestor' : reviewStatus === 'ressalvas' ? '⚠ Com Ressalvas' : '⏳ Aguardando Revisão'}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <strong>{sub.responsibleName}</strong> {sub.responsibleRole ? `(${sub.responsibleRole})` : ''}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {dateFormatted} às {timeFormatted}
                        </span>
                        <span className="flex items-center gap-1 text-amber-600 font-semibold">
                          <Camera className="w-3.5 h-3.5" />
                          {sub.photosCount} fotos anexadas
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Chevron */}
                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPrintSubmission(sub);
                      }}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                      title="Imprimir ou Salvar PDF"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(sub.id, sub.submissionCode);
                      }}
                      className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                      title="Excluir auditoria"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <div className="p-2 text-slate-400">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details View */}
                {isExpanded && (
                  <div className="p-4 sm:p-6 bg-slate-50/80 border-t border-slate-200 space-y-6">
                    
                    {/* General Notes if any */}
                    {sub.generalNotes && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
                        <strong>Observação Geral do Turno:</strong> {sub.generalNotes}
                      </div>
                    )}

                    {/* Photo Evidence Gallery */}
                    {sub.photosCount > 0 && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                          <Camera className="w-4 h-4 text-emerald-600" />
                          <span>Galeria de Comprovação Fotográfica ({sub.photosCount} fotos)</span>
                        </h4>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                          {sub.tasks
                            .filter((t) => t.completion.photoUrl)
                            .map((item) => (
                              <div
                                key={item.task.id}
                                onClick={() =>
                                  onViewPhoto(
                                    item.completion.photoUrl!,
                                    item.task.title,
                                    item.completion.photoTimestamp,
                                    item.completion.notes
                                  )
                                }
                                className="group relative bg-slate-900 rounded-xl overflow-hidden cursor-pointer border border-slate-700 shadow-sm aspect-4/3 flex items-center justify-center"
                              >
                                <img
                                  src={item.completion.photoUrl}
                                  alt={item.task.title}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                                />
                                
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-between p-2">
                                  <div className="self-end p-1 rounded-md bg-black/50 text-white opacity-0 group-hover:opacity-100 transition">
                                    <Maximize2 className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <p className="text-[10px] font-bold text-white line-clamp-1">
                                      {item.task.title}
                                    </p>
                                    {item.completion.photoTimestamp && (
                                      <p className="text-[9px] text-slate-300">
                                        {item.completion.photoTimestamp}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Detailed Task Checklist Breakdown */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>Detalhamento das Tarefas ({sub.completedTasksCount}/{sub.totalTasks})</span>
                      </h4>

                      <div className="space-y-2">
                        {sub.tasks.map((item, idx) => (
                          <div
                            key={item.task.id}
                            className="bg-white p-3 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-xs"
                          >
                            <div className="flex items-start gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center flex-shrink-0 text-[11px]">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-slate-900">
                                  {item.task.title}
                                </p>
                                {item.completion.notes && (
                                  <p className="text-slate-500 italic mt-0.5">
                                    Obs: {item.completion.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                              {item.completion.photoUrl ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    onViewPhoto(
                                      item.completion.photoUrl!,
                                      item.task.title,
                                      item.completion.photoTimestamp,
                                      item.completion.notes
                                    )
                                  }
                                  className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] flex items-center gap-1 hover:bg-emerald-100 transition"
                                >
                                  <Camera className="w-3 h-3" /> Ver Foto
                                </button>
                              ) : (
                                <span className="text-[10px] text-slate-400">Sem foto</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Manager Review Controls */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
                      <h5 className="text-xs font-bold text-slate-800">
                        Parecer do Gestor / Auditoria
                      </h5>
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateReview(sub.id, 'aprovado')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            reviewStatus === 'aprovado'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Aprovar 100% Conforme</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleUpdateReview(sub.id, 'ressalvas', reviewNotes[sub.id])}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                            reviewStatus === 'ressalvas'
                              ? 'bg-amber-500 text-slate-950 font-bold shadow-xs'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                          }`}
                        >
                          <AlertCircle className="w-3.5 h-3.5" />
                          <span>Aprovar com Ressalvas</span>
                        </button>
                      </div>

                      {sub.managerReview?.feedback && (
                        <p className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                          <strong>Comentário do Gestor:</strong> {sub.managerReview.feedback}
                        </p>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
