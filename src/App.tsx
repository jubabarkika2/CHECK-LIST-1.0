import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sector, 
  TaskTemplate, 
  ManagerSettings, 
  ChecklistSubmission, 
  TaskCompletion, 
  ShiftType,
  Collaborator 
} from './types';
import { 
  getStoredSettings, 
  saveStoredSettings, 
  getStoredSectors, 
  saveStoredSectors, 
  getStoredTasks, 
  saveStoredTasks, 
  getStoredCollaborators,
  saveStoredCollaborators,
  getStoredDraft, 
  saveStoredDraft, 
  clearStoredDraft, 
  saveSubmission, 
  getAllSubmissions,
  fetchSettingsFromServer,
  fetchSectorsFromServer,
  fetchTasksFromServer,
  fetchCollaboratorsFromServer,
  subscribeToSettings,
  subscribeToCollaborators,
  subscribeToSectors,
  subscribeToTasks,
  subscribeToSubmissions
} from './utils/storage';
import { Header } from './components/Header';
import { PinModal } from './components/PinModal';
import { SectorSelector } from './components/SectorSelector';
import { ChecklistTaskCard } from './components/ChecklistTaskCard';
import { CameraModal } from './components/CameraModal';
import { PhotoViewerModal } from './components/PhotoViewerModal';
import { StaffEntryModal } from './components/StaffEntryModal';
import { CompletionSummaryModal } from './components/CompletionSummaryModal';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { PrintableReport } from './components/manager/PrintableReport';
import { 
  CheckCircle2, 
  Send, 
  Camera, 
  AlertCircle, 
  UserCheck, 
  Clock, 
  Sparkles, 
  RefreshCw, 
  RotateCcw,
  ChefHat,
  UtensilsCrossed,
  Info
} from 'lucide-react';

export default function App() {
  // Core application state
  const [settings, setSettings] = useState<ManagerSettings>(getStoredSettings);
  const [sectors, setSectors] = useState<Sector[]>(getStoredSectors);
  const [tasks, setTasks] = useState<TaskTemplate[]>(getStoredTasks);
  const [collaborators, setCollaborators] = useState<Collaborator[]>(getStoredCollaborators);
  const [submissions, setSubmissions] = useState<ChecklistSubmission[]>([]);

  // Operational view state
  const [activeSectorId, setActiveSectorId] = useState<string>(() => sectors[0]?.id || 'salao-garcons');
  const [activeShift, setActiveShift] = useState<ShiftType>('abertura');
  const [staffName, setStaffName] = useState<string>(() => localStorage.getItem('rest_active_staff_name') || '');
  const [staffRole, setStaffRole] = useState<string>(() => localStorage.getItem('rest_active_staff_role') || 'Colaborador');

  // Active checklist completions (in-progress draft)
  const [completions, setCompletions] = useState<Record<string, TaskCompletion>>(() => 
    getStoredDraft(sectors[0]?.id || 'salao-garcons', 'abertura')
  );

  // Modals & Navigation state
  const [isManagerMode, setIsManagerMode] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [isStaffModalOpen, setIsStaffModalOpen] = useState<boolean>(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState<boolean>(false);
  const [activeCameraTask, setActiveCameraTask] = useState<TaskTemplate | null>(null);

  // Photo Lightbox state
  const [photoViewerState, setPhotoViewerState] = useState<{
    isOpen: boolean;
    photoUrl: string | null;
    taskTitle: string;
    timestamp?: string;
    notes?: string;
    staffName?: string;
  }>({
    isOpen: false,
    photoUrl: null,
    taskTitle: '',
  });

  // Completion Summary state
  const [completionSummaryState, setCompletionSummaryState] = useState<{
    isOpen: boolean;
    submission: ChecklistSubmission | null;
  }>({
    isOpen: false,
    submission: null,
  });

  // Printable View state
  const [printingSubmission, setPrintingSubmission] = useState<ChecklistSubmission | null>(null);

  // Load and subscribe to real-time Cloud updates across all devices
  useEffect(() => {
    loadSubmissions();

    // Initial fetch from cloud/server
    fetchSettingsFromServer().then((s) => s && setSettings(s));
    fetchSectorsFromServer().then((sec) => sec && setSectors(sec));
    fetchTasksFromServer().then((t) => t && setTasks(t));
    fetchCollaboratorsFromServer().then((c) => c && setCollaborators(c));

    // Real-time Cloud listeners (syncs instant updates across all phones/tablets/desktops)
    const unsubSettings = subscribeToSettings((newSettings) => {
      setSettings(newSettings);
    });
    const unsubCollaborators = subscribeToCollaborators((newCollabs) => {
      setCollaborators(newCollabs);
    });
    const unsubSectors = subscribeToSectors((newSectors) => {
      setSectors(newSectors);
    });
    const unsubTasks = subscribeToTasks((newTasks) => {
      setTasks(newTasks);
    });
    const unsubSubmissions = subscribeToSubmissions((newSubs) => {
      setSubmissions(newSubs);
    });

    return () => {
      unsubSettings();
      unsubCollaborators();
      unsubSectors();
      unsubTasks();
      unsubSubmissions();
    };
  }, []);

  const loadSubmissions = async () => {
    try {
      const items = await getAllSubmissions();
      setSubmissions(items);
    } catch (e) {
      console.error('Error loading submissions from IndexedDB', e);
    }
  };

  // Sync draft whenever sector or shift changes
  useEffect(() => {
    const draft = getStoredDraft(activeSectorId, activeShift);
    setCompletions(draft);
  }, [activeSectorId, activeShift]);

  // Save draft whenever completions change
  useEffect(() => {
    saveStoredDraft(activeSectorId, activeShift, completions);
  }, [activeSectorId, activeShift, completions]);

  // Current active sector object
  const currentSector = useMemo(() => {
    return sectors.find((s) => s.id === activeSectorId) || sectors[0];
  }, [sectors, activeSectorId]);

  // Filter tasks for active sector and shift
  const currentTasks = useMemo(() => {
    return tasks
      .filter((t) => t.sectorId === activeSectorId && (activeShift === 'todos' || t.shift === activeShift))
      .sort((a, b) => a.order - b.order);
  }, [tasks, activeSectorId, activeShift]);

  // Statistics calculation for current checklist
  const totalTasksCount = currentTasks.length;
  const completedTasksCount = useMemo(() => {
    return currentTasks.filter((t) => completions[t.id]?.completed).length;
  }, [currentTasks, completions]);

  const photosAttachedCount = useMemo(() => {
    return currentTasks.filter((t) => completions[t.id]?.photoUrl).length;
  }, [currentTasks, completions]);

  const mandatoryPhotosRequired = useMemo(() => {
    return currentTasks.filter((t) => t.requiresPhoto).length;
  }, [currentTasks]);

  const missingMandatoryPhotosCount = useMemo(() => {
    return currentTasks.filter((t) => t.requiresPhoto && !completions[t.id]?.photoUrl).length;
  }, [currentTasks, completions]);

  const completionPercentage = totalTasksCount > 0 
    ? Math.round((completedTasksCount / totalTasksCount) * 100) 
    : 0;

  const isAllDone = totalTasksCount > 0 && completedTasksCount === totalTasksCount && missingMandatoryPhotosCount === 0;

  // Manager Mode Access Gate
  const handleToggleManagerMode = () => {
    if (isManagerMode) {
      setIsManagerMode(false);
    } else {
      setIsPinModalOpen(true);
    }
  };

  // Handle staff identification
  const handleStaffConfirm = (name: string, role: string) => {
    setStaffName(name);
    setStaffRole(role);
    localStorage.setItem('rest_active_staff_name', name);
    localStorage.setItem('rest_active_staff_role', role);
    setIsStaffModalOpen(false);
  };

  // Task Completion Toggle
  const handleToggleComplete = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    const existing = completions[taskId];
    const willBeCompleted = !existing?.completed;

    // If task requires photo and has no photo, guide user directly to take photo
    if (willBeCompleted && task?.requiresPhoto && !existing?.photoUrl) {
      handleOpenCamera(task);
      return;
    }

    setCompletions((prev) => ({
      ...prev,
      [taskId]: {
        taskId,
        completed: willBeCompleted,
        completedAt: willBeCompleted ? new Date().toISOString() : undefined,
        photoUrl: existing?.photoUrl,
        photoTimestamp: existing?.photoTimestamp,
        notes: existing?.notes,
      },
    }));
  };

  // Camera Handlers
  const handleOpenCamera = (task: TaskTemplate) => {
    if (!staffName && settings.requireStaffName) {
      setIsStaffModalOpen(true);
      return;
    }
    setActiveCameraTask(task);
    setIsCameraModalOpen(true);
  };

  const handlePhotoCaptured = (photoUrl: string, timestamp: string) => {
    if (!activeCameraTask) return;
    const taskId = activeCameraTask.id;

    setCompletions((prev) => ({
      ...prev,
      [taskId]: {
        taskId,
        completed: true, // Automatically mark task as completed when photo is captured
        completedAt: new Date().toISOString(),
        photoUrl,
        photoTimestamp: timestamp,
        notes: prev[taskId]?.notes,
      },
    }));
  };

  const handleRemovePhoto = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    setCompletions((prev) => {
      const updated = { ...prev };
      if (updated[taskId]) {
        updated[taskId] = {
          ...updated[taskId],
          photoUrl: undefined,
          photoTimestamp: undefined,
          // If photo was strictly mandatory, also uncheck completion
          completed: task?.requiresPhoto ? false : updated[taskId].completed,
        };
      }
      return updated;
    });
  };

  const handleUpdateNotes = (taskId: string, notes: string) => {
    setCompletions((prev) => ({
      ...prev,
      [taskId]: {
        taskId,
        completed: prev[taskId]?.completed || false,
        photoUrl: prev[taskId]?.photoUrl,
        photoTimestamp: prev[taskId]?.photoTimestamp,
        notes,
      },
    }));
  };

  // View full size photo
  const handleViewPhoto = (
    photoUrl: string, 
    taskTitle: string, 
    timestamp?: string, 
    notes?: string
  ) => {
    setPhotoViewerState({
      isOpen: true,
      photoUrl,
      taskTitle,
      timestamp,
      notes,
      staffName,
    });
  };

  // Finish & Submit Checklist
  const handleFinishChecklist = async () => {
    if (!staffName && settings.requireStaffName) {
      setIsStaffModalOpen(true);
      return;
    }

    // Check if there are incomplete tasks
    if (completedTasksCount < totalTasksCount) {
      const firstIncomplete = currentTasks.find((t) => !completions[t.id]?.completed);
      if (firstIncomplete) {
        const el = document.getElementById(`task-card-${firstIncomplete.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert(`Atenção: faltam ${totalTasksCount - completedTasksCount} tarefas para completar este checklist.`);
      return;
    }

    // Check if there are missing mandatory photos
    if (missingMandatoryPhotosCount > 0) {
      const missingPhotoTask = currentTasks.find((t) => t.requiresPhoto && !completions[t.id]?.photoUrl);
      if (missingPhotoTask) {
        const el = document.getElementById(`task-card-${missingPhotoTask.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      alert(`Atenção: Existem tarefas que exigem foto comprobatória pendentes.`);
      return;
    }

    // Build unique submission code
    const now = new Date();
    const dateCode = now.toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const submissionCode = `CHK-${dateCode}-${randomSuffix}`;

    const submissionTasks = currentTasks.map((t) => ({
      task: t,
      completion: completions[t.id] || {
        taskId: t.id,
        completed: true,
        completedAt: new Date().toISOString(),
      },
    }));

    const newSubmission: ChecklistSubmission = {
      id: `sub-${Date.now()}`,
      submissionCode,
      sectorId: activeSectorId,
      sectorName: currentSector?.name || 'Salão',
      shift: activeShift,
      responsibleName: staffName || 'Colaborador',
      responsibleRole: staffRole,
      startedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
      completedAt: new Date().toISOString(),
      totalTasks: totalTasksCount,
      completedTasksCount: totalTasksCount,
      photosCount: photosAttachedCount,
      tasks: submissionTasks,
      managerReview: {
        status: 'pendente',
      },
    };

    // Save to IndexedDB
    await saveSubmission(newSubmission);
    await loadSubmissions();

    // Show completion celebration & WhatsApp prompt
    setCompletionSummaryState({
      isOpen: true,
      submission: newSubmission,
    });
  };

  // Reset current checklist draft
  const handleResetChecklist = () => {
    clearStoredDraft(activeSectorId, activeShift);
    setCompletions({});
  };

  // Manager updates
  const handleSaveSectors = (newSectors: Sector[]) => {
    setSectors(newSectors);
    saveStoredSectors(newSectors);
  };

  const handleSaveTasks = (newTasks: TaskTemplate[]) => {
    setTasks(newTasks);
    saveStoredTasks(newTasks);
  };

  const handleSaveCollaborators = (newCollaborators: Collaborator[]) => {
    setCollaborators(newCollaborators);
    saveStoredCollaborators(newCollaborators);
  };

  const handleSaveSettings = (newSettings: ManagerSettings) => {
    setSettings(newSettings);
    saveStoredSettings(newSettings);
  };

  const handleResetAll = () => {
    setSettings(getStoredSettings());
    setSectors(getStoredSectors());
    setTasks(getStoredTasks());
    setCollaborators(getStoredCollaborators());
    setActiveSectorId('salao-garcons');
  };

  // If in printable view mode
  if (printingSubmission) {
    return (
      <PrintableReport
        submission={printingSubmission}
        settings={settings}
        onBack={() => setPrintingSubmission(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 flex flex-col font-sans selection:bg-emerald-500 selection:text-white pb-28 sm:pb-24">
      
      {/* App Header */}
      <Header
        isManagerMode={isManagerMode}
        onToggleManagerMode={handleToggleManagerMode}
        settings={settings}
        activeStaffName={staffName}
        onChangeStaffName={() => setIsStaffModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-5 sm:pt-6">
        
        {isManagerMode ? (
          // MANAGER MODE DASHBOARD
          <ManagerDashboard
            sectors={sectors}
            tasks={tasks}
            collaborators={collaborators}
            settings={settings}
            submissions={submissions}
            onSaveSectors={handleSaveSectors}
            onSaveTasks={handleSaveTasks}
            onSaveCollaborators={handleSaveCollaborators}
            onSaveSettings={handleSaveSettings}
            onRefreshSubmissions={loadSubmissions}
            onResetAll={handleResetAll}
            onExitManagerMode={() => setIsManagerMode(false)}
            onViewPhoto={handleViewPhoto}
            onPrintSubmission={(sub) => setPrintingSubmission(sub)}
          />
        ) : (
          // OPERATIONAL EMPLOYEE CHECKLIST VIEW
          <div className="space-y-6">
            
            {/* Staff Notification Banner if no staff name */}
            {!staffName && settings.requireStaffName && (
              <div 
                onClick={() => setIsStaffModalOpen(true)}
                className="bg-emerald-50 border border-emerald-300 p-3.5 rounded-2xl flex items-center justify-between gap-3 cursor-pointer hover:bg-emerald-100/70 transition shadow-xs"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs sm:text-sm text-emerald-950">
                      Identifique-se para iniciar a rotina do dia
                    </h4>
                    <p className="text-[11px] text-emerald-700">
                      Clique aqui para registrar seu nome e função no restaurante.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs flex-shrink-0 shadow-xs"
                >
                  Informar Nome
                </button>
              </div>
            )}

            {/* Sector & Shift Selector */}
            <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs">
              <SectorSelector
                sectors={sectors}
                activeSectorId={activeSectorId}
                onSelectSector={setActiveSectorId}
                activeShift={activeShift}
                onSelectShift={setActiveShift}
                tasks={tasks}
                completions={completions}
              />
            </div>

            {/* Sector Progress Bar & Quick Metrics */}
            <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-md border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-black text-white">
                    Checklist: {currentSector?.name}
                  </h2>
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2.5 py-0.5 rounded-full">
                    {activeShift.toUpperCase()}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 truncate">
                  {currentSector?.description}
                </p>
              </div>

              {/* Progress pill & metrics */}
              <div className="flex items-center gap-4 flex-shrink-0">
                <div className="text-right">
                  <span className="text-xs text-slate-400 block font-medium">Progresso</span>
                  <span className="text-sm sm:text-base font-black text-emerald-400">
                    {completedTasksCount} / {totalTasksCount} ({completionPercentage}%)
                  </span>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center border border-slate-700 font-black text-sm text-emerald-400">
                  {completionPercentage}%
                </div>
              </div>
            </div>

            {/* Mandatory Photos Alert Badge */}
            {missingMandatoryPhotosCount > 0 && (
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-900">
                <Camera className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>
                  <strong>Atenção:</strong> Restam <strong>{missingMandatoryPhotosCount} tarefas com foto obrigatória</strong> a serem fotografadas para liberar o envio do relatório.
                </span>
              </div>
            )}

            {/* Tasks List */}
            {currentTasks.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Nenhuma tarefa para este filtro</h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Alterne para outro turno ou selecione outro setor no menu acima.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentTasks.map((task) => (
                  <ChecklistTaskCard
                    key={task.id}
                    task={task}
                    completion={completions[task.id]}
                    onToggleComplete={handleToggleComplete}
                    onOpenCamera={handleOpenCamera}
                    onRemovePhoto={handleRemovePhoto}
                    onViewPhoto={handleViewPhoto}
                    onUpdateNotes={handleUpdateNotes}
                  />
                ))}
              </div>
            )}

            {/* Reset Draft Button */}
            {completedTasksCount > 0 && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Deseja limpar as marcações e fotos deste checklist em andamento?')) {
                      handleResetChecklist();
                    }
                  }}
                  className="text-xs text-slate-500 hover:text-slate-700 font-medium inline-flex items-center gap-1.5 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar marcações deste turno e recomeçar</span>
                </button>
              </div>
            )}

          </div>
        )}

      </main>

      {/* Sticky Bottom Action Bar (in Employee Mode) */}
      {!isManagerMode && totalTasksCount > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-30 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 p-3 sm:p-4 text-white shadow-2xl">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            
            {/* Progress summary on mobile */}
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-200 truncate">
                  {currentSector?.name}
                </span>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.2 rounded-full border border-emerald-800/60">
                  {completedTasksCount}/{totalTasksCount} Feitas
                </span>
              </div>
              <p className="text-[11px] text-slate-400 truncate mt-0.5">
                {isAllDone 
                  ? '✨ Tudo pronto! Clique para enviar o relatório.' 
                  : `${totalTasksCount - completedTasksCount} pendentes • ${missingMandatoryPhotosCount} fotos pendentes`}
              </p>
            </div>

            {/* Submit / WhatsApp Button */}
            <button
              type="button"
              id="btn-complete-checklist"
              onClick={handleFinishChecklist}
              className={`px-5 sm:px-6 py-3 rounded-2xl font-bold text-xs sm:text-sm flex items-center gap-2 transition-all duration-200 flex-shrink-0 shadow-lg ${
                isAllDone
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-4 ring-emerald-500/30 scale-102'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white'
              }`}
            >
              <Send className="w-4 h-4" />
              <span>Concluir & Enviar Relatório</span>
            </button>

          </div>
        </div>
      )}

      {/* PIN Security Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={() => setIsManagerMode(true)}
        correctPin={settings.managerPin}
      />

      {/* Staff Identification Modal */}
      <StaffEntryModal
        isOpen={isStaffModalOpen}
        onClose={() => setIsStaffModalOpen(false)}
        onConfirm={handleStaffConfirm}
        currentName={staffName}
        currentRole={staffRole}
        sectorName={currentSector?.name || 'Salão'}
        collaborators={collaborators}
      />

      {/* Camera Capture Modal */}
      {isCameraModalOpen && activeCameraTask && (
        <CameraModal
          isOpen={isCameraModalOpen}
          onClose={() => {
            setIsCameraModalOpen(false);
            setActiveCameraTask(null);
          }}
          onPhotoCaptured={handlePhotoCaptured}
          taskTitle={activeCameraTask.title}
          sectorName={currentSector?.name || 'Salão'}
          staffName={staffName || 'Colaborador'}
          settings={settings}
        />
      )}

      {/* Fullscreen Photo Lightbox Modal */}
      <PhotoViewerModal
        isOpen={photoViewerState.isOpen}
        onClose={() => setPhotoViewerState((prev) => ({ ...prev, isOpen: false }))}
        photoUrl={photoViewerState.photoUrl}
        taskTitle={photoViewerState.taskTitle}
        timestamp={photoViewerState.timestamp}
        notes={photoViewerState.notes}
        staffName={photoViewerState.staffName || staffName}
      />

      {/* Completion Summary & WhatsApp Modal */}
      {completionSummaryState.isOpen && completionSummaryState.submission && (
        <CompletionSummaryModal
          isOpen={completionSummaryState.isOpen}
          onClose={() => setCompletionSummaryState({ isOpen: false, submission: null })}
          submission={completionSummaryState.submission}
          settings={settings}
          onResetChecklist={handleResetChecklist}
        />
      )}

    </div>
  );
}
