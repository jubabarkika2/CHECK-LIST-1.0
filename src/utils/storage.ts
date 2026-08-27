import { Sector, TaskTemplate, ManagerSettings, ChecklistSubmission, TaskCompletion, Collaborator } from '../types';
import { DEFAULT_SECTORS, DEFAULT_TASKS, DEFAULT_SETTINGS, DEFAULT_COLLABORATORS } from '../data/defaultData';

const STORAGE_KEYS = {
  SETTINGS: 'rest_checklist_settings',
  SECTORS: 'rest_checklist_sectors',
  TASKS: 'rest_checklist_tasks',
  COLLABORATORS: 'rest_checklist_collaborators',
  CURRENT_DRAFT: 'rest_checklist_current_draft',
};

const DB_NAME = 'RestaurantChecklistDB';
const DB_VERSION = 1;
const STORE_SUBMISSIONS = 'submissions';

// IndexedDB Helper
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_SUBMISSIONS)) {
        const store = db.createObjectStore(STORE_SUBMISSIONS, { keyPath: 'id' });
        store.createIndex('completedAt', 'completedAt', { unique: false });
        store.createIndex('sectorId', 'sectorId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// SERVER API SYNC UTILITIES
// ==========================================

export async function fetchSettingsFromServer(): Promise<ManagerSettings | null> {
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      saveStoredSettings(data, false);
      return data;
    }
  } catch (e) {
    // Silent catch for offline or dev startup
  }
  return null;
}

export async function fetchSectorsFromServer(): Promise<Sector[] | null> {
  try {
    const res = await fetch('/api/sectors');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredSectors(data, false);
        return data;
      }
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}

export async function fetchTasksFromServer(): Promise<TaskTemplate[] | null> {
  try {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredTasks(data, false);
        return data;
      }
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}

export async function fetchCollaboratorsFromServer(): Promise<Collaborator[] | null> {
  try {
    const res = await fetch('/api/collaborators');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredCollaborators(data, false);
        return data;
      }
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}

// Storage methods for Settings
export function getStoredSettings(): ManagerSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (saved) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error('Error loading settings from localStorage', e);
  }
  return DEFAULT_SETTINGS;
}

export function saveStoredSettings(settings: ManagerSettings, syncToServer = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }

  if (syncToServer) {
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch((err) => console.warn('Failed to sync settings to server backend', err));
  }
}

// Storage methods for Sectors
export function getStoredSectors(): Sector[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SECTORS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading sectors from localStorage', e);
  }
  return DEFAULT_SECTORS;
}

export function saveStoredSectors(sectors: Sector[], syncToServer = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SECTORS, JSON.stringify(sectors));
  } catch (e) {
    console.error('Error saving sectors to localStorage', e);
  }

  if (syncToServer) {
    fetch('/api/sectors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sectors),
    }).catch((err) => console.warn('Failed to sync sectors to server backend', err));
  }
}

// Storage methods for Tasks
export function getStoredTasks(): TaskTemplate[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading tasks from localStorage', e);
  }
  return DEFAULT_TASKS;
}

export function saveStoredTasks(tasks: TaskTemplate[], syncToServer = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks to localStorage', e);
  }

  if (syncToServer) {
    fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    }).catch((err) => console.warn('Failed to sync tasks to server backend', err));
  }
}

// Storage methods for Collaborators
export function getStoredCollaborators(): Collaborator[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.COLLABORATORS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading collaborators from localStorage', e);
  }
  return DEFAULT_COLLABORATORS;
}

export function saveStoredCollaborators(collaborators: Collaborator[], syncToServer = true): void {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLABORATORS, JSON.stringify(collaborators));
  } catch (e) {
    console.error('Error saving collaborators to localStorage', e);
  }

  if (syncToServer) {
    fetch('/api/collaborators', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collaborators),
    }).catch((err) => console.warn('Failed to sync collaborators to server backend', err));
  }
}

// Storage methods for Current in-progress Draft
export function getStoredDraft(sectorId: string, shift: string): Record<string, TaskCompletion> {
  try {
    const saved = localStorage.getItem(`${STORAGE_KEYS.CURRENT_DRAFT}_${sectorId}_${shift}`);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error('Error loading draft', e);
  }
  return {};
}

export function saveStoredDraft(sectorId: string, shift: string, completions: Record<string, TaskCompletion>): void {
  try {
    localStorage.setItem(`${STORAGE_KEYS.CURRENT_DRAFT}_${sectorId}_${shift}`, JSON.stringify(completions));
  } catch (e) {
    console.error('Error saving draft', e);
  }
}

export function clearStoredDraft(sectorId: string, shift: string): void {
  try {
    localStorage.removeItem(`${STORAGE_KEYS.CURRENT_DRAFT}_${sectorId}_${shift}`);
  } catch (e) {
    console.error('Error clearing draft', e);
  }
}

// Submissions / Audits (Stored in Backend Database + IndexedDB Cache)
export async function saveSubmission(submission: ChecklistSubmission): Promise<void> {
  // 1. Save in server database
  try {
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  } catch (e) {
    console.warn('Backend server unreachable, saved to IndexedDB local cache', e);
  }

  // 2. Also save in IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SUBMISSIONS);
      const req = store.put(submission);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('IndexedDB save error', e);
  }
}

export async function getAllSubmissions(): Promise<ChecklistSubmission[]> {
  // Try fetching from server backend database first
  try {
    const res = await fetch('/api/submissions');
    if (res.ok) {
      const serverItems = await res.json();
      if (Array.isArray(serverItems)) {
        // Sync local IndexedDB with server items in background
        syncSubmissionsToIndexedDB(serverItems).catch(() => {});
        return serverItems;
      }
    }
  } catch (e) {
    // Fallback to IndexedDB
  }

  // IndexedDB fallback
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_SUBMISSIONS, 'readonly');
      const store = tx.objectStore(STORE_SUBMISSIONS);
      const req = store.getAll();
      req.onsuccess = () => {
        const items = (req.result || []) as ChecklistSubmission[];
        items.sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
        resolve(items);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('IndexedDB get error', e);
    return [];
  }
}

async function syncSubmissionsToIndexedDB(submissions: ChecklistSubmission[]) {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
    const store = tx.objectStore(STORE_SUBMISSIONS);
    for (const sub of submissions) {
      store.put(sub);
    }
  } catch (e) {
    // Ignore background cache sync errors
  }
}

export async function deleteSubmission(id: string): Promise<void> {
  // Delete from server backend
  try {
    await fetch(`/api/submissions/${id}`, {
      method: 'DELETE',
    });
  } catch (e) {
    console.warn('Backend delete error', e);
  }

  // Delete from local IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SUBMISSIONS);
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (e) {
    console.error('IndexedDB delete error', e);
  }
}

export async function updateSubmissionReview(
  id: string,
  review: { status: 'aprovado' | 'pendente' | 'ressalvas'; feedback?: string }
): Promise<void> {
  // Update on server backend
  try {
    await fetch(`/api/submissions/${id}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
  } catch (e) {
    console.warn('Backend update review error', e);
  }

  // Update in IndexedDB
  try {
    const db = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_SUBMISSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SUBMISSIONS);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const submission = getReq.result as ChecklistSubmission;
        if (submission) {
          submission.managerReview = {
            ...review,
            reviewedAt: new Date().toISOString(),
          };
          const putReq = store.put(submission);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (e) {
    console.error('IndexedDB review update error', e);
  }
}

// Reset data to defaults
export function resetAllDataToDefaults(): void {
  localStorage.removeItem(STORAGE_KEYS.SECTORS);
  localStorage.removeItem(STORAGE_KEYS.TASKS);
  localStorage.removeItem(STORAGE_KEYS.SETTINGS);
  localStorage.removeItem(STORAGE_KEYS.COLLABORATORS);

  fetch('/api/reset', {
    method: 'POST',
  }).catch((err) => console.warn('Failed to reset backend database', err));
}

// Format WhatsApp message
export function generateWhatsAppMessage(
  submission: ChecklistSubmission,
  settings: ManagerSettings
): { messageText: string; whatsappUrl: string } {
  const dateObj = new Date(submission.completedAt);
  const dateStr = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  const shiftName = 
    submission.shift === 'abertura' ? 'Abertura' :
    submission.shift === 'durante' ? 'Durante o Turno' :
    submission.shift === 'fechamento' ? 'Fechamento' : 'Turno Geral';

  let msg = `*📋 RELATÓRIO DE CHECKLIST - ${settings.restaurantName.toUpperCase()}*\n`;
  msg += `─────────────────────────\n`;
  msg += `📍 *Setor:* ${submission.sectorName}\n`;
  msg += `⏰ *Turno:* ${shiftName}\n`;
  msg += `👤 *Responsável:* ${submission.responsibleName}\n`;
  msg += `📅 *Data/Hora:* ${dateStr} às ${timeStr}\n`;
  msg += `🏷️ *Código da Auditoria:* #${submission.submissionCode}\n`;
  msg += `📊 *Progresso:* ${submission.completedTasksCount}/${submission.totalTasks} tarefas concluídas (100%)\n`;
  msg += `📸 *Fotos Anexadas:* ${submission.photosCount} fotos comprovatórias\n`;
  msg += `─────────────────────────\n`;
  msg += `*✅ TAREFAS REALIZADAS:*\n`;

  submission.tasks.forEach((item, index) => {
    const hasPhoto = item.completion.photoUrl ? ' [📸 Com foto]' : '';
    msg += `${index + 1}. *${item.task.title}*${hasPhoto}\n`;
    if (item.completion.notes) {
      msg += `   _Obs: ${item.completion.notes}_\n`;
    }
  });

  if (submission.generalNotes) {
    msg += `\n📝 *Observações Gerais do Colaborador:*\n"${submission.generalNotes}"\n`;
  }

  msg += `\n✨ _Checklist auditado e conferido via App Operacional._`;

  const cleanPhone = (settings.managerWhatsapp || '').replace(/\D/g, '');
  const encodedText = encodeURIComponent(msg);
  const whatsappUrl = cleanPhone 
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`
    : `https://api.whatsapp.com/send?text=${encodedText}`;

  return { messageText: msg, whatsappUrl };
}
