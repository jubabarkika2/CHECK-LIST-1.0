import { doc, getDoc, setDoc, onSnapshot, collection, getDocs, deleteDoc, updateDoc, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '../firebase';
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

// IndexedDB Helper for fast local caching
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const idb = request.result;
      if (!idb.objectStoreNames.contains(STORE_SUBMISSIONS)) {
        const store = idb.createObjectStore(STORE_SUBMISSIONS, { keyPath: 'id' });
        store.createIndex('completedAt', 'completedAt', { unique: false });
        store.createIndex('sectorId', 'sectorId', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// REAL-TIME FIRESTORE SUBSCRIPTIONS
// ==========================================

export function subscribeToSettings(onUpdate: (settings: ManagerSettings) => void): Unsubscribe {
  try {
    const docRef = doc(db, 'config', 'settings');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as ManagerSettings;
        if (data && data.restaurantName) {
          saveStoredSettings(data, true, false);
          onUpdate(data);
        }
      }
    }, (error) => {
      console.warn('Firestore settings subscription error:', error);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToCollaborators(onUpdate: (collaborators: Collaborator[]) => void): Unsubscribe {
  try {
    const docRef = doc(db, 'config', 'collaborators');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as { list?: Collaborator[] };
        if (data && Array.isArray(data.list)) {
          saveStoredCollaborators(data.list, true, false);
          onUpdate(data.list);
        }
      }
    }, (error) => {
      console.warn('Firestore collaborators subscription error:', error);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToSectors(onUpdate: (sectors: Sector[]) => void): Unsubscribe {
  try {
    const docRef = doc(db, 'config', 'sectors');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as { list?: Sector[] };
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          saveStoredSectors(data.list, true, false);
          onUpdate(data.list);
        }
      }
    }, (error) => {
      console.warn('Firestore sectors subscription error:', error);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToTasks(onUpdate: (tasks: TaskTemplate[]) => void): Unsubscribe {
  try {
    const docRef = doc(db, 'config', 'tasks');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as { list?: TaskTemplate[] };
        if (data && Array.isArray(data.list) && data.list.length > 0) {
          const currentList = [...data.list];
          let hasNew = false;
          for (const dt of DEFAULT_TASKS) {
            if (!currentList.some((t) => t.id === dt.id)) {
              currentList.unshift(dt);
              hasNew = true;
            }
          }
          if (hasNew) {
            setDoc(docRef, { list: currentList }).catch(() => {});
          }
          saveStoredTasks(currentList, true, false);
          onUpdate(currentList);
        }
      }
    }, (error) => {
      console.warn('Firestore tasks subscription error:', error);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

export function subscribeToSubmissions(onUpdate: (submissions: ChecklistSubmission[]) => void): Unsubscribe {
  try {
    const collRef = collection(db, 'submissions');
    const q = query(collRef, orderBy('completedAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const list: ChecklistSubmission[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as ChecklistSubmission);
      });
      if (list.length > 0) {
        syncSubmissionsToIndexedDB(list).catch(() => {});
        onUpdate(list);
      }
    }, (error) => {
      console.warn('Firestore submissions subscription error:', error);
    });
  } catch (e) {
    console.warn('Firestore subscription unavailable:', e);
    return () => {};
  }
}

// ==========================================
// INITIAL SERVER & CLOUD FETCH
// ==========================================

export async function fetchSettingsFromServer(): Promise<ManagerSettings | null> {
  // 1. Try Firestore
  try {
    const docRef = doc(db, 'config', 'settings');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as ManagerSettings;
      if (data && data.restaurantName) {
        const merged = { ...DEFAULT_SETTINGS, ...data };
        saveStoredSettings(merged, true, false);
        return merged;
      }
    } else {
      // Initialize with local/default data if empty in cloud
      const current = getStoredSettings();
      await setDoc(docRef, current);
      return current;
    }
  } catch (e) {
    console.warn('Firestore settings fetch error:', e);
  }

  // 2. If localStorage has saved settings, keep them
  const localSaved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
  if (localSaved) {
    return getStoredSettings();
  }

  // 3. Try Node/Express API
  try {
    const res = await fetch('/api/settings');
    if (res.ok) {
      const data = await res.json();
      if (data && data.restaurantName) {
        saveStoredSettings(data, false, false);
        return data;
      }
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}

export async function fetchSectorsFromServer(): Promise<Sector[] | null> {
  // 1. Try Firestore
  try {
    const docRef = doc(db, 'config', 'sectors');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as { list?: Sector[] };
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        const currentList = [...data.list];
        let hasNew = false;
        for (const ds of DEFAULT_SECTORS) {
          if (!currentList.some((s) => s.id === ds.id)) {
            currentList.push(ds);
            hasNew = true;
          }
        }
        if (hasNew) {
          await setDoc(docRef, { list: currentList });
        }
        saveStoredSectors(currentList, true, false);
        return currentList;
      }
    } else {
      const current = getStoredSectors();
      await setDoc(docRef, { list: current });
      return current;
    }
  } catch (e) {
    console.warn('Firestore sectors fetch error:', e);
  }

  // 2. If localStorage has saved sectors, keep them
  const localSaved = localStorage.getItem(STORAGE_KEYS.SECTORS);
  if (localSaved) {
    return getStoredSectors();
  }

  // 3. Try Node API
  try {
    const res = await fetch('/api/sectors');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredSectors(data, false, false);
        return data;
      }
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}

export async function fetchTasksFromServer(): Promise<TaskTemplate[] | null> {
  // 1. Try Firestore with auto-merging of default and server tasks
  try {
    const docRef = doc(db, 'config', 'tasks');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as { list?: TaskTemplate[] };
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        const currentList = [...data.list];
        let hasNew = false;
        for (const dt of DEFAULT_TASKS) {
          if (!currentList.some((t) => t.id === dt.id)) {
            currentList.unshift(dt);
            hasNew = true;
          }
        }
        if (hasNew) {
          await setDoc(docRef, { list: currentList });
        }
        saveStoredTasks(currentList, true, false);
        return currentList;
      }
    } else {
      const current = getStoredTasks();
      await setDoc(docRef, { list: current });
      return current;
    }
  } catch (e) {
    console.warn('Firestore tasks fetch error:', e);
  }

  // 2. If localStorage has saved tasks, keep them
  const localSaved = localStorage.getItem(STORAGE_KEYS.TASKS);
  if (localSaved) {
    return getStoredTasks();
  }

  // 3. Try Node API
  try {
    const res = await fetch('/api/tasks');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredTasks(data, false, false);
        return data;
      }
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}

export async function fetchCollaboratorsFromServer(): Promise<Collaborator[] | null> {
  // 1. Try Firestore
  try {
    const docRef = doc(db, 'config', 'collaborators');
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as { list?: Collaborator[] };
      if (data && Array.isArray(data.list) && data.list.length > 0) {
        const currentList = [...data.list];
        let hasNew = false;
        for (const dc of DEFAULT_COLLABORATORS) {
          if (!currentList.some((c) => c.id === dc.id)) {
            currentList.push(dc);
            hasNew = true;
          }
        }
        if (hasNew) {
          await setDoc(docRef, { list: currentList });
        }
        saveStoredCollaborators(currentList, true, false);
        return currentList;
      }
    } else {
      const current = getStoredCollaborators();
      await setDoc(docRef, { list: current });
      return current;
    }
  } catch (e) {
    console.warn('Firestore collaborators fetch error:', e);
  }

  // 2. If localStorage has saved collaborators, keep them
  const localSaved = localStorage.getItem(STORAGE_KEYS.COLLABORATORS);
  if (localSaved) {
    return getStoredCollaborators();
  }

  // 3. Try Node API
  try {
    const res = await fetch('/api/collaborators');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        saveStoredCollaborators(data, false, false);
        return data;
      }
    }
  } catch (e) {
    // Silent catch
  }
  return null;
}

// ==========================================
// LOCAL STORAGE & CLOUD SAVE METHODS
// ==========================================

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

export async function saveStoredSettings(settings: ManagerSettings, syncToServer = true, syncToFirestore = true): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Error saving settings to localStorage', e);
  }

  if (syncToFirestore) {
    try {
      const docRef = doc(db, 'config', 'settings');
      await setDoc(docRef, settings, { merge: true });
      console.log('✅ Settings synced to Firestore');
    } catch (e) {
      console.warn('Failed to sync settings to Firestore', e);
    }
  }

  if (syncToServer) {
    fetch('/api/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(settings),
    }).catch((err) => console.warn('Failed to sync settings to server backend', err));
  }
}

export function getStoredSectors(): Sector[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.SECTORS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        let hasNew = false;
        for (const ds of DEFAULT_SECTORS) {
          if (!merged.some((s) => s.id === ds.id)) {
            merged.push(ds);
            hasNew = true;
          }
        }
        if (hasNew) {
          localStorage.setItem(STORAGE_KEYS.SECTORS, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading sectors from localStorage', e);
  }
  return DEFAULT_SECTORS;
}

export async function saveStoredSectors(sectors: Sector[], syncToServer = true, syncToFirestore = true): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.SECTORS, JSON.stringify(sectors));
  } catch (e) {
    console.error('Error saving sectors to localStorage', e);
  }

  if (syncToFirestore) {
    try {
      const docRef = doc(db, 'config', 'sectors');
      await setDoc(docRef, { list: sectors });
      console.log('✅ Sectors synced to Firestore');
    } catch (e) {
      console.warn('Failed to sync sectors to Firestore', e);
    }
  }

  if (syncToServer) {
    fetch('/api/sectors', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sectors),
    }).catch((err) => console.warn('Failed to sync sectors to server backend', err));
  }
}

export function getStoredTasks(): TaskTemplate[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        let hasNew = false;
        for (const dt of DEFAULT_TASKS) {
          if (!merged.some((t) => t.id === dt.id)) {
            merged.unshift(dt);
            hasNew = true;
          }
        }
        if (hasNew) {
          localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading tasks from localStorage', e);
  }
  return DEFAULT_TASKS;
}

export async function saveStoredTasks(tasks: TaskTemplate[], syncToServer = true, syncToFirestore = true): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  } catch (e) {
    console.error('Error saving tasks to localStorage', e);
  }

  if (syncToFirestore) {
    try {
      const docRef = doc(db, 'config', 'tasks');
      await setDoc(docRef, { list: tasks });
      console.log('✅ Tasks synced to Firestore');
    } catch (e) {
      console.warn('Failed to sync tasks to Firestore', e);
    }
  }

  if (syncToServer) {
    fetch('/api/tasks', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tasks),
    }).catch((err) => console.warn('Failed to sync tasks to server backend', err));
  }
}

export function getStoredCollaborators(): Collaborator[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.COLLABORATORS);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const merged = [...parsed];
        let hasNew = false;
        for (const dc of DEFAULT_COLLABORATORS) {
          if (!merged.some((c) => c.id === dc.id)) {
            merged.push(dc);
            hasNew = true;
          }
        }
        if (hasNew) {
          localStorage.setItem(STORAGE_KEYS.COLLABORATORS, JSON.stringify(merged));
        }
        return merged;
      }
    }
  } catch (e) {
    console.error('Error loading collaborators from localStorage', e);
  }
  return DEFAULT_COLLABORATORS;
}

export async function saveStoredCollaborators(collaborators: Collaborator[], syncToServer = true, syncToFirestore = true): Promise<void> {
  try {
    localStorage.setItem(STORAGE_KEYS.COLLABORATORS, JSON.stringify(collaborators));
  } catch (e) {
    console.error('Error saving collaborators to localStorage', e);
  }

  if (syncToFirestore) {
    try {
      const docRef = doc(db, 'config', 'collaborators');
      await setDoc(docRef, { list: collaborators });
      console.log('✅ Collaborators synced to Firestore');
    } catch (e) {
      console.warn('Failed to sync collaborators to Firestore', e);
    }
  }

  if (syncToServer) {
    fetch('/api/collaborators', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(collaborators),
    }).catch((err) => console.warn('Failed to sync collaborators to server backend', err));
  }
}

// Current in-progress Draft (stored per device in localStorage)
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

// ==========================================
// SUBMISSIONS & AUDITS
// ==========================================

export async function saveSubmission(submission: ChecklistSubmission): Promise<void> {
  // 1. Save in Firestore Cloud Database
  try {
    const docRef = doc(db, 'submissions', submission.id);
    await setDoc(docRef, submission);
  } catch (e) {
    console.warn('Firestore submission save error, will fallback to local storage', e);
  }

  // 2. Save in Node backend API (if running)
  try {
    await fetch('/api/submissions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    });
  } catch (e) {
    // Silent catch
  }

  // 3. Save in local IndexedDB
  try {
    const idb = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(STORE_SUBMISSIONS, 'readwrite');
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
  // 1. Try Firestore Cloud Database
  try {
    const collRef = collection(db, 'submissions');
    const q = query(collRef, orderBy('completedAt', 'desc'));
    const snapshot = await getDocs(q);
    const list: ChecklistSubmission[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ChecklistSubmission);
    });
    if (list.length > 0) {
      syncSubmissionsToIndexedDB(list).catch(() => {});
      return list;
    }
  } catch (e) {
    // Cloud query fallback
  }

  // 2. Try Node server backend
  try {
    const res = await fetch('/api/submissions');
    if (res.ok) {
      const serverItems = await res.json();
      if (Array.isArray(serverItems) && serverItems.length > 0) {
        syncSubmissionsToIndexedDB(serverItems).catch(() => {});
        return serverItems;
      }
    }
  } catch (e) {
    // Silent catch
  }

  // 3. Local IndexedDB fallback
  try {
    const idb = await openDB();
    return new Promise((resolve, reject) => {
      const tx = idb.transaction(STORE_SUBMISSIONS, 'readonly');
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
    const idb = await openDB();
    const tx = idb.transaction(STORE_SUBMISSIONS, 'readwrite');
    const store = tx.objectStore(STORE_SUBMISSIONS);
    for (const sub of submissions) {
      store.put(sub);
    }
  } catch (e) {
    // Ignore background cache sync errors
  }
}

export async function deleteSubmission(id: string): Promise<void> {
  // Delete from Firestore Cloud
  try {
    const docRef = doc(db, 'submissions', id);
    await deleteDoc(docRef);
  } catch (e) {
    console.warn('Firestore delete error', e);
  }

  // Delete from server backend
  try {
    await fetch(`/api/submissions/${id}`, {
      method: 'DELETE',
    });
  } catch (e) {
    // Silent catch
  }

  // Delete from local IndexedDB
  try {
    const idb = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(STORE_SUBMISSIONS, 'readwrite');
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
  const reviewPayload = {
    ...review,
    reviewedAt: new Date().toISOString(),
  };

  // Update in Firestore Cloud
  try {
    const docRef = doc(db, 'submissions', id);
    await updateDoc(docRef, { managerReview: reviewPayload });
  } catch (e) {
    console.warn('Firestore review update error', e);
  }

  // Update on server backend
  try {
    await fetch(`/api/submissions/${id}/review`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(review),
    });
  } catch (e) {
    // Silent catch
  }

  // Update in IndexedDB
  try {
    const idb = await openDB();
    await new Promise<void>((resolve, reject) => {
      const tx = idb.transaction(STORE_SUBMISSIONS, 'readwrite');
      const store = tx.objectStore(STORE_SUBMISSIONS);
      const getReq = store.get(id);
      getReq.onsuccess = () => {
        const submission = getReq.result as ChecklistSubmission;
        if (submission) {
          submission.managerReview = reviewPayload;
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

  try {
    setDoc(doc(db, 'config', 'settings'), DEFAULT_SETTINGS);
    setDoc(doc(db, 'config', 'sectors'), { list: DEFAULT_SECTORS });
    setDoc(doc(db, 'config', 'tasks'), { list: DEFAULT_TASKS });
    setDoc(doc(db, 'config', 'collaborators'), { list: DEFAULT_COLLABORATORS });
  } catch (e) {
    // Silent catch
  }

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
