import React, { useState } from 'react';
import { 
  Sector, 
  TaskTemplate, 
  ManagerSettings, 
  ChecklistSubmission,
  Collaborator 
} from '../../types';
import { 
  FileText, 
  ListChecks, 
  Settings, 
  ShieldCheck, 
  ArrowLeft,
  Sparkles,
  Users
} from 'lucide-react';
import { AuditReportsTab } from './AuditReportsTab';
import { TaskSectorManagerTab } from './TaskSectorManagerTab';
import { SettingsTab } from './SettingsTab';
import { CollaboratorsTab } from './CollaboratorsTab';

interface ManagerDashboardProps {
  sectors: Sector[];
  tasks: TaskTemplate[];
  collaborators: Collaborator[];
  settings: ManagerSettings;
  submissions: ChecklistSubmission[];
  onSaveSectors: (sectors: Sector[]) => void;
  onSaveTasks: (tasks: TaskTemplate[]) => void;
  onSaveCollaborators: (collaborators: Collaborator[]) => void;
  onSaveSettings: (settings: ManagerSettings) => void;
  onRefreshSubmissions: () => void;
  onResetAll: () => void;
  onExitManagerMode: () => void;
  onViewPhoto: (photoUrl: string, taskTitle: string, timestamp?: string, notes?: string) => void;
  onPrintSubmission: (submission: ChecklistSubmission) => void;
}

export const ManagerDashboard: React.FC<ManagerDashboardProps> = ({
  sectors,
  tasks,
  collaborators,
  settings,
  submissions,
  onSaveSectors,
  onSaveTasks,
  onSaveCollaborators,
  onSaveSettings,
  onRefreshSubmissions,
  onResetAll,
  onExitManagerMode,
  onViewPhoto,
  onPrintSubmission,
}) => {
  const [activeTab, setActiveTab] = useState<'audits' | 'collaborators' | 'tasks' | 'settings'>('audits');

  const tabs = [
    {
      id: 'audits',
      label: 'Relatórios & Auditorias',
      icon: <FileText className="w-4 h-4" />,
      badge: submissions.length > 0 ? submissions.length : undefined,
    },
    {
      id: 'collaborators',
      label: 'Colaboradores & Senhas',
      icon: <Users className="w-4 h-4" />,
      badge: collaborators.length,
    },
    {
      id: 'tasks',
      label: 'Gerenciar Tarefas & Setores',
      icon: <ListChecks className="w-4 h-4" />,
      badge: tasks.length,
    },
    {
      id: 'settings',
      label: 'Configurações & WhatsApp',
      icon: <Settings className="w-4 h-4" />,
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Tab Navigation */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-md border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Painel Administrativo do Gestor
                </h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                  Acesso Protegido
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Auditoria de rotinas, histórico de fotos comprovatórias e controle total de checklists.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onExitManagerMode}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold border border-slate-700 flex items-center gap-2 transition self-start sm:self-auto"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar ao Checklist Operacional</span>
          </button>
        </div>

        {/* Tab Buttons */}
        <div className="flex flex-wrap gap-2 pt-4">
          {tabs.map((tab) => {
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
                  isSelected
                    ? 'bg-amber-500 text-slate-950 ring-2 ring-amber-400/40 shadow-md'
                    : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isSelected ? 'bg-slate-950 text-amber-400' : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content Display */}
      {activeTab === 'audits' && (
        <AuditReportsTab
          submissions={submissions}
          sectors={sectors}
          settings={settings}
          onRefreshSubmissions={onRefreshSubmissions}
          onViewPhoto={onViewPhoto}
          onPrintSubmission={onPrintSubmission}
        />
      )}

      {activeTab === 'collaborators' && (
        <CollaboratorsTab
          collaborators={collaborators}
          onSaveCollaborators={onSaveCollaborators}
        />
      )}

      {activeTab === 'tasks' && (
        <TaskSectorManagerTab
          sectors={sectors}
          tasks={tasks}
          onSaveSectors={onSaveSectors}
          onSaveTasks={onSaveTasks}
        />
      )}

      {activeTab === 'settings' && (
        <SettingsTab
          settings={settings}
          onSaveSettings={onSaveSettings}
          onResetAll={onResetAll}
        />
      )}

    </div>
  );
};
