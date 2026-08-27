import fs from 'fs';
import path from 'path';
import { Sector, TaskTemplate, ManagerSettings, ChecklistSubmission, Collaborator } from '../src/types';
import { DEFAULT_SECTORS, DEFAULT_TASKS, DEFAULT_SETTINGS, DEFAULT_COLLABORATORS } from '../src/data/defaultData';

export interface DatabaseSchema {
  settings: ManagerSettings;
  sectors: Sector[];
  tasks: TaskTemplate[];
  collaborators: Collaborator[];
  submissions: ChecklistSubmission[];
  version: number;
  lastUpdated: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'restaurant_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial Database Data
function getInitialDatabase(): DatabaseSchema {
  return {
    settings: DEFAULT_SETTINGS,
    sectors: DEFAULT_SECTORS,
    tasks: DEFAULT_TASKS,
    collaborators: DEFAULT_COLLABORATORS,
    submissions: [],
    version: 1,
    lastUpdated: new Date().toISOString(),
  };
}

// Read database from disk
export function readDatabase(): DatabaseSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      const initial = getInitialDatabase();
      writeDatabase(initial);
      return initial;
    }
    const data = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      settings: parsed.settings || DEFAULT_SETTINGS,
      sectors: parsed.sectors || DEFAULT_SECTORS,
      tasks: parsed.tasks || DEFAULT_TASKS,
      collaborators: parsed.collaborators || DEFAULT_COLLABORATORS,
      submissions: parsed.submissions || [],
      version: parsed.version || 1,
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error reading database file, using defaults:', error);
    const initial = getInitialDatabase();
    writeDatabase(initial);
    return initial;
  }
}

// Write database to disk safely (atomic write)
export function writeDatabase(db: DatabaseSchema): void {
  try {
    db.lastUpdated = new Date().toISOString();
    const tempFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(db, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
  } catch (error) {
    console.error('Error writing database file:', error);
  }
}

// Settings methods
export function getSettings(): ManagerSettings {
  const db = readDatabase();
  return db.settings;
}

export function updateSettings(settings: Partial<ManagerSettings>): ManagerSettings {
  const db = readDatabase();
  db.settings = { ...db.settings, ...settings };
  writeDatabase(db);
  return db.settings;
}

// Sectors methods
export function getSectors(): Sector[] {
  const db = readDatabase();
  return db.sectors;
}

export function saveSectors(sectors: Sector[]): Sector[] {
  const db = readDatabase();
  db.sectors = sectors;
  writeDatabase(db);
  return db.sectors;
}

export function addSector(sector: Sector): Sector {
  const db = readDatabase();
  const index = db.sectors.findIndex((s) => s.id === sector.id);
  if (index >= 0) {
    db.sectors[index] = sector;
  } else {
    db.sectors.push(sector);
  }
  writeDatabase(db);
  return sector;
}

export function deleteSector(id: string): boolean {
  const db = readDatabase();
  db.sectors = db.sectors.filter((s) => s.id !== id);
  // Also remove tasks associated with this sector
  db.tasks = db.tasks.filter((t) => t.sectorId !== id);
  writeDatabase(db);
  return true;
}

// Tasks methods
export function getTasks(): TaskTemplate[] {
  const db = readDatabase();
  return db.tasks;
}

export function saveTasks(tasks: TaskTemplate[]): TaskTemplate[] {
  const db = readDatabase();
  db.tasks = tasks;
  writeDatabase(db);
  return db.tasks;
}

export function addTask(task: TaskTemplate): TaskTemplate {
  const db = readDatabase();
  const index = db.tasks.findIndex((t) => t.id === task.id);
  if (index >= 0) {
    db.tasks[index] = task;
  } else {
    db.tasks.push(task);
  }
  writeDatabase(db);
  return task;
}

export function deleteTask(id: string): boolean {
  const db = readDatabase();
  db.tasks = db.tasks.filter((t) => t.id !== id);
  writeDatabase(db);
  return true;
}

// Collaborators methods
export function getCollaborators(): Collaborator[] {
  const db = readDatabase();
  return db.collaborators || [];
}

export function saveCollaborators(collaborators: Collaborator[]): Collaborator[] {
  const db = readDatabase();
  db.collaborators = collaborators;
  writeDatabase(db);
  return db.collaborators;
}

export function addCollaborator(collaborator: Collaborator): Collaborator {
  const db = readDatabase();
  if (!db.collaborators) db.collaborators = [];
  const index = db.collaborators.findIndex((c) => c.id === collaborator.id);
  if (index >= 0) {
    db.collaborators[index] = collaborator;
  } else {
    db.collaborators.push(collaborator);
  }
  writeDatabase(db);
  return collaborator;
}

export function updateCollaborator(id: string, data: Partial<Collaborator>): Collaborator | null {
  const db = readDatabase();
  if (!db.collaborators) db.collaborators = [];
  const index = db.collaborators.findIndex((c) => c.id === id);
  if (index === -1) return null;
  db.collaborators[index] = { ...db.collaborators[index], ...data };
  writeDatabase(db);
  return db.collaborators[index];
}

export function deleteCollaborator(id: string): boolean {
  const db = readDatabase();
  if (!db.collaborators) return true;
  db.collaborators = db.collaborators.filter((c) => c.id !== id);
  writeDatabase(db);
  return true;
}

// Submissions methods
export function getSubmissions(): ChecklistSubmission[] {
  const db = readDatabase();
  return db.submissions.sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );
}

export function getSubmissionById(id: string): ChecklistSubmission | null {
  const db = readDatabase();
  return db.submissions.find((s) => s.id === id) || null;
}

export function addSubmission(submission: ChecklistSubmission): ChecklistSubmission {
  const db = readDatabase();
  const index = db.submissions.findIndex((s) => s.id === submission.id);
  if (index >= 0) {
    db.submissions[index] = submission;
  } else {
    db.submissions.unshift(submission);
  }
  writeDatabase(db);
  return submission;
}

export function deleteSubmission(id: string): boolean {
  const db = readDatabase();
  db.submissions = db.submissions.filter((s) => s.id !== id);
  writeDatabase(db);
  return true;
}

export function updateSubmissionReview(
  id: string,
  review: { status: 'aprovado' | 'pendente' | 'ressalvas'; feedback?: string }
): ChecklistSubmission | null {
  const db = readDatabase();
  const submission = db.submissions.find((s) => s.id === id);
  if (!submission) return null;

  submission.managerReview = {
    ...review,
    reviewedAt: new Date().toISOString(),
  };

  writeDatabase(db);
  return submission;
}

// Reset data to defaults
export function resetDatabaseToDefaults(): DatabaseSchema {
  const initial = getInitialDatabase();
  writeDatabase(initial);
  return initial;
}
