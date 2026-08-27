import React from 'react';
import { ChecklistSubmission, ManagerSettings } from '../../types';
import { Printer, ArrowLeft, CheckCircle2, Camera } from 'lucide-react';

interface PrintableReportProps {
  submission: ChecklistSubmission;
  settings: ManagerSettings;
  onBack: () => void;
}

export const PrintableReport: React.FC<PrintableReportProps> = ({
  submission,
  settings,
  onBack,
}) => {
  const completedDate = new Date(submission.completedAt);
  const dateFormatted = completedDate.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const timeFormatted = completedDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="bg-white min-h-screen text-slate-900 p-4 sm:p-8">
      {/* Control bar (hidden during print) */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs flex items-center gap-2 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar aos Relatórios</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-2 shadow-md transition"
        >
          <Printer className="w-4 h-4" />
          <span>Imprimir / Salvar em PDF</span>
        </button>
      </div>

      {/* Printable Paper Sheet */}
      <div className="max-w-4xl mx-auto border border-slate-200 p-8 rounded-2xl shadow-xs print:border-none print:p-0 print:shadow-none bg-white">
        
        {/* Header */}
        <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-slate-900">
              {settings.restaurantName}
            </h1>
            <p className="text-xs font-semibold text-slate-600">
              RELATÓRIO DE AUDITORIA OPERACIONAL & CHECKLIST
            </p>
          </div>

          <div className="text-right">
            <span className="inline-block bg-slate-900 text-white text-xs font-mono font-bold px-2.5 py-1 rounded">
              #{submission.submissionCode}
            </span>
            <p className="text-[11px] text-slate-500 mt-1">
              Emitido em {dateFormatted} às {timeFormatted}
            </p>
          </div>
        </div>

        {/* Audit Meta Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50 rounded-xl mb-6 text-xs border border-slate-200">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Setor:</span>
            <strong className="text-slate-900 text-sm">{submission.sectorName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Turno:</span>
            <strong className="text-slate-900 text-sm capitalize">{submission.shift}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Responsável:</span>
            <strong className="text-slate-900 text-sm">{submission.responsibleName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase font-bold">Conformidade:</span>
            <strong className="text-emerald-700 text-sm">
              {submission.completedTasksCount}/{submission.totalTasks} (100%)
            </strong>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="mb-6">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
            1. Registro das Tarefas Executadas
          </h3>
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-300 bg-slate-100 text-slate-700">
                <th className="py-2 px-2 w-8">#</th>
                <th className="py-2 px-2">Tarefa / Item Verificado</th>
                <th className="py-2 px-2 w-28">Categoria</th>
                <th className="py-2 px-2 w-20 text-center">Status</th>
                <th className="py-2 px-2 w-24 text-center">Comprovante</th>
              </tr>
            </thead>
            <tbody>
              {submission.tasks.map((item, idx) => (
                <tr key={item.task.id} className="border-b border-slate-200">
                  <td className="py-2 px-2 font-bold text-slate-500">{idx + 1}</td>
                  <td className="py-2 px-2">
                    <strong className="text-slate-900">{item.task.title}</strong>
                    {item.completion.notes && (
                      <p className="text-[11px] text-slate-500 italic mt-0.5">
                        Obs: {item.completion.notes}
                      </p>
                    )}
                  </td>
                  <td className="py-2 px-2 text-slate-600">{item.task.category}</td>
                  <td className="py-2 px-2 text-center">
                    <span className="text-emerald-700 font-bold">✓ Feito</span>
                  </td>
                  <td className="py-2 px-2 text-center text-slate-600">
                    {item.completion.photoUrl ? '📸 Anexada' : '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Photo Evidence Section */}
        {submission.photosCount > 0 && (
          <div className="mb-8 break-inside-avoid">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>2. Evidências Fotográficas Carimbadas ({submission.photosCount} fotos)</span>
            </h3>

            <div className="grid grid-cols-2 gap-4">
              {submission.tasks
                .filter((t) => t.completion.photoUrl)
                .map((item) => (
                  <div
                    key={item.task.id}
                    className="border border-slate-200 rounded-xl overflow-hidden bg-slate-50 p-2 break-inside-avoid"
                  >
                    <img
                      src={item.completion.photoUrl}
                      alt={item.task.title}
                      className="w-full h-44 object-contain bg-black rounded-lg"
                    />
                    <div className="p-1.5 text-[11px] text-slate-700">
                      <strong className="block truncate">{item.task.title}</strong>
                      {item.completion.photoTimestamp && (
                        <span className="text-slate-500 text-[10px]">
                          🕒 {item.completion.photoTimestamp}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Signatures & Auditor Sign-off */}
        <div className="mt-12 pt-8 border-t border-slate-300 grid grid-cols-2 gap-8 text-xs break-inside-avoid">
          <div className="text-center">
            <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
            <strong className="block text-slate-900">{submission.responsibleName}</strong>
            <span className="text-slate-500">Colaborador Responsável pelo Turno</span>
          </div>

          <div className="text-center">
            <div className="border-b border-slate-400 w-3/4 mx-auto mb-2" />
            <strong className="block text-slate-900">{settings.managerName}</strong>
            <span className="text-slate-500">Gestão Operacional / Auditoria</span>
          </div>
        </div>

      </div>
    </div>
  );
};
