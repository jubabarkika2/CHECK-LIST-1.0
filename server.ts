import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import {
  getSettings,
  updateSettings,
  getSectors,
  saveSectors,
  addSector,
  deleteSector,
  getTasks,
  saveTasks,
  addTask,
  deleteTask,
  getCollaborators,
  saveCollaborators,
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
  getSubmissions,
  getSubmissionById,
  addSubmission,
  deleteSubmission,
  updateSubmissionReview,
  resetDatabaseToDefaults,
  readDatabase
} from './server/db';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON with high limit for image payloads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ==========================================
  // REST API ROUTES
  // ==========================================

  // Health check
  app.get('/api/health', (req: Request, res: Response) => {
    res.json({
      status: 'ok',
      service: 'restaurant-checklist-backend',
      timestamp: new Date().toISOString(),
    });
  });

  // Settings
  app.get('/api/settings', (req: Request, res: Response) => {
    try {
      const settings = getSettings();
      res.json(settings);
    } catch (error) {
      console.error('Error fetching settings:', error);
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.put('/api/settings', (req: Request, res: Response) => {
    try {
      const updated = updateSettings(req.body);
      res.json(updated);
    } catch (error) {
      console.error('Error updating settings:', error);
      res.status(500).json({ error: 'Failed to update settings' });
    }
  });

  // Sectors
  app.get('/api/sectors', (req: Request, res: Response) => {
    try {
      const sectors = getSectors();
      res.json(sectors);
    } catch (error) {
      console.error('Error fetching sectors:', error);
      res.status(500).json({ error: 'Failed to fetch sectors' });
    }
  });

  app.put('/api/sectors', (req: Request, res: Response) => {
    try {
      const sectors = req.body;
      if (!Array.isArray(sectors)) {
        res.status(400).json({ error: 'Expected an array of sectors' });
        return;
      }
      const saved = saveSectors(sectors);
      res.json(saved);
    } catch (error) {
      console.error('Error saving sectors:', error);
      res.status(500).json({ error: 'Failed to save sectors' });
    }
  });

  app.post('/api/sectors', (req: Request, res: Response) => {
    try {
      const sector = req.body;
      if (!sector || !sector.id || !sector.name) {
        res.status(400).json({ error: 'Invalid sector data' });
        return;
      }
      const saved = addSector(sector);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error adding sector:', error);
      res.status(500).json({ error: 'Failed to add sector' });
    }
  });

  app.delete('/api/sectors/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      deleteSector(id);
      res.json({ success: true, message: `Sector ${id} deleted` });
    } catch (error) {
      console.error('Error deleting sector:', error);
      res.status(500).json({ error: 'Failed to delete sector' });
    }
  });

  // Tasks
  app.get('/api/tasks', (req: Request, res: Response) => {
    try {
      const tasks = getTasks();
      res.json(tasks);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });

  app.put('/api/tasks', (req: Request, res: Response) => {
    try {
      const tasks = req.body;
      if (!Array.isArray(tasks)) {
        res.status(400).json({ error: 'Expected an array of tasks' });
        return;
      }
      const saved = saveTasks(tasks);
      res.json(saved);
    } catch (error) {
      console.error('Error saving tasks:', error);
      res.status(500).json({ error: 'Failed to save tasks' });
    }
  });

  app.post('/api/tasks', (req: Request, res: Response) => {
    try {
      const task = req.body;
      if (!task || !task.id || !task.title) {
        res.status(400).json({ error: 'Invalid task data' });
        return;
      }
      const saved = addTask(task);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error adding task:', error);
      res.status(500).json({ error: 'Failed to add task' });
    }
  });

  app.delete('/api/tasks/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      deleteTask(id);
      res.json({ success: true, message: `Task ${id} deleted` });
    } catch (error) {
      console.error('Error deleting task:', error);
      res.status(500).json({ error: 'Failed to delete task' });
    }
  });

  // Collaborators (Staff & Passwords)
  app.get('/api/collaborators', (req: Request, res: Response) => {
    try {
      const collaborators = getCollaborators();
      res.json(collaborators);
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      res.status(500).json({ error: 'Failed to fetch collaborators' });
    }
  });

  app.put('/api/collaborators', (req: Request, res: Response) => {
    try {
      const collaborators = req.body;
      if (!Array.isArray(collaborators)) {
        res.status(400).json({ error: 'Expected an array of collaborators' });
        return;
      }
      const saved = saveCollaborators(collaborators);
      res.json(saved);
    } catch (error) {
      console.error('Error saving collaborators:', error);
      res.status(500).json({ error: 'Failed to save collaborators' });
    }
  });

  app.post('/api/collaborators', (req: Request, res: Response) => {
    try {
      const collaborator = req.body;
      if (!collaborator || !collaborator.id || !collaborator.name) {
        res.status(400).json({ error: 'Invalid collaborator data' });
        return;
      }
      const saved = addCollaborator(collaborator);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error adding collaborator:', error);
      res.status(500).json({ error: 'Failed to add collaborator' });
    }
  });

  app.put('/api/collaborators/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const updated = updateCollaborator(id, req.body);
      if (!updated) {
        res.status(404).json({ error: 'Collaborator not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('Error updating collaborator:', error);
      res.status(500).json({ error: 'Failed to update collaborator' });
    }
  });

  app.delete('/api/collaborators/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      deleteCollaborator(id);
      res.json({ success: true, message: `Collaborator ${id} deleted` });
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      res.status(500).json({ error: 'Failed to delete collaborator' });
    }
  });

  // Submissions (Audits)
  app.get('/api/submissions', (req: Request, res: Response) => {
    try {
      const submissions = getSubmissions();
      res.json(submissions);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      res.status(500).json({ error: 'Failed to fetch submissions' });
    }
  });

  app.get('/api/submissions/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const submission = getSubmissionById(id);
      if (!submission) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      res.json(submission);
    } catch (error) {
      console.error('Error fetching submission:', error);
      res.status(500).json({ error: 'Failed to fetch submission' });
    }
  });

  app.post('/api/submissions', (req: Request, res: Response) => {
    try {
      const submission = req.body;
      if (!submission || !submission.id || !submission.sectorId) {
        res.status(400).json({ error: 'Invalid submission data' });
        return;
      }
      const saved = addSubmission(submission);
      res.status(201).json(saved);
    } catch (error) {
      console.error('Error adding submission:', error);
      res.status(500).json({ error: 'Failed to save submission' });
    }
  });

  app.delete('/api/submissions/:id', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      deleteSubmission(id);
      res.json({ success: true, message: `Submission ${id} deleted` });
    } catch (error) {
      console.error('Error deleting submission:', error);
      res.status(500).json({ error: 'Failed to delete submission' });
    }
  });

  app.put('/api/submissions/:id/review', (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { status, feedback } = req.body;
      const updated = updateSubmissionReview(id, { status, feedback });
      if (!updated) {
        res.status(404).json({ error: 'Submission not found' });
        return;
      }
      res.json(updated);
    } catch (error) {
      console.error('Error reviewing submission:', error);
      res.status(500).json({ error: 'Failed to update review' });
    }
  });

  // Overview Stats
  app.get('/api/stats', (req: Request, res: Response) => {
    try {
      const db = readDatabase();
      const submissions = db.submissions;
      const now = new Date();
      const todayString = now.toISOString().slice(0, 10);

      const todaySubmissions = submissions.filter(
        (s) => s.completedAt && s.completedAt.startsWith(todayString)
      );

      const totalPhotos = submissions.reduce((acc, curr) => acc + (curr.photosCount || 0), 0);

      res.json({
        totalSubmissions: submissions.length,
        todaySubmissionsCount: todaySubmissions.length,
        totalPhotosAttached: totalPhotos,
        totalSectorsCount: db.sectors.length,
        totalTasksCount: db.tasks.length,
        restaurantName: db.settings.restaurantName,
        databaseVersion: db.version,
        lastUpdated: db.lastUpdated,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ error: 'Failed to fetch stats' });
    }
  });

  // Reset database to defaults
  app.post('/api/reset', (req: Request, res: Response) => {
    try {
      const resetData = resetDatabaseToDefaults();
      res.json({ success: true, message: 'Database reset to defaults', data: resetData });
    } catch (error) {
      console.error('Error resetting database:', error);
      res.status(500).json({ error: 'Failed to reset database' });
    }
  });

  // ==========================================
  // VITE / STATIC SERVING
  // ==========================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server and Database API running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
