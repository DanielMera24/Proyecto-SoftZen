import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import { therapyTypes } from './predefinedTherapy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const JWT_SECRET = 'therapeutic-yoga-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database initialization
let db;

async function initDatabase() {
  db = await open({
    filename: path.join(__dirname, 'therapy.db'),
    driver: sqlite3.Database
  });

  // Create tables
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'instructor',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS patients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT,
      email TEXT NOT NULL,
      age INTEGER,
      condition TEXT,
      instructor_id INTEGER NOT NULL,
      assigned_series TEXT,
      current_session INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instructor_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS therapy_series (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      therapy_type TEXT NOT NULL,
      postures TEXT NOT NULL,
      total_sessions INTEGER NOT NULL,
      instructor_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (instructor_id) REFERENCES users (id)
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      patient_id INTEGER NOT NULL,
      series_id INTEGER NOT NULL,
      session_number INTEGER NOT NULL,
      pain_before INTEGER,
      pain_after INTEGER,
      comments TEXT,
      completed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patient_id) REFERENCES patients (id),
      FOREIGN KEY (series_id) REFERENCES therapy_series (id)
    );
  `);

  console.log('Database initialized successfully');
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Auth routes
app.post('/api/register', async (req, res) => {
  try {
    const { email, password, name, role } = req.body;
    
    // Check if user exists
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await db.run(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, name, role || 'instructor']
    );

    const user = await db.get('SELECT id, email, name, role FROM users WHERE id = ?', [result.lastID]);
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    
    res.json({ token, user });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role } 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Patient routes
app.get('/api/patients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const patients = await db.all(
      'SELECT * FROM patients WHERE instructor_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Parse assigned_series JSON for each patient
    const patientsWithSeries = patients.map(patient => ({
      ...patient,
      assignedSeries: patient.assigned_series ? JSON.parse(patient.assigned_series) : null
    }));

    res.json(patientsWithSeries);
  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/patients', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, age, condition } = req.body;
    
    const result = await db.run(
      'INSERT INTO patients (name, email, age, condition, instructor_id) VALUES (?, ?, ?, ?, ?)',
      [name, email, age, condition, req.user.id]
    );

    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [result.lastID]);
    res.json(patient);
  } catch (error) {
    console.error('Create patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patientId = parseInt(req.params.id);
    const { name, email, age, condition } = req.body;
    
    const result = await db.run(
      'UPDATE patients SET name = ?, email = ?, age = ?, condition = ? WHERE id = ? AND instructor_id = ?',
      [name, email, age, condition, patientId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);
    res.json(patient);
  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/patients/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patientId = parseInt(req.params.id);
    
    const result = await db.run(
      'DELETE FROM patients WHERE id = ? AND instructor_id = ?',
      [patientId, req.user.id]
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    res.json({ message: 'Patient deleted successfully' });
  } catch (error) {
    console.error('Delete patient error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Therapy types and postures
app.get('/api/therapy-types', authenticateToken, (req, res) => {
  const types = Object.keys(therapyTypes).map(key => ({
    id: key,
    name: key.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    postures: therapyTypes[key]
  }));
  res.json(types);
});

// Therapy series routes
app.get('/api/therapy-series', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const series = await db.all(
      'SELECT * FROM therapy_series WHERE instructor_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );

    // Parse postures JSON for each series
    const seriesWithPostures = series.map(s => ({
      ...s,
      postures: JSON.parse(s.postures)
    }));

    res.json(seriesWithPostures);
  } catch (error) {
    console.error('Get therapy series error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/therapy-series', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, therapyType, postures, totalSessions } = req.body;
    
    const result = await db.run(
      'INSERT INTO therapy_series (name, therapy_type, postures, total_sessions, instructor_id) VALUES (?, ?, ?, ?, ?)',
      [name, therapyType, JSON.stringify(postures), totalSessions, req.user.id]
    );

    const series = await db.get('SELECT * FROM therapy_series WHERE id = ?', [result.lastID]);
    
    res.json({
      ...series,
      postures: JSON.parse(series.postures)
    });
  } catch (error) {
    console.error('Create therapy series error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Assign series to patient
app.post('/api/patients/:id/assign-series', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patientId = parseInt(req.params.id);
    const { seriesId } = req.body;
    
    // Get patient and series
    const patient = await db.get(
      'SELECT * FROM patients WHERE id = ? AND instructor_id = ?',
      [patientId, req.user.id]
    );
    
    const series = await db.get(
      'SELECT * FROM therapy_series WHERE id = ? AND instructor_id = ?',
      [seriesId, req.user.id]
    );
    
    if (!patient || !series) {
      return res.status(404).json({ error: 'Patient or series not found' });
    }

    // Update patient with assigned series
    const seriesData = {
      ...series,
      postures: JSON.parse(series.postures)
    };

    await db.run(
      'UPDATE patients SET assigned_series = ?, current_session = 0 WHERE id = ?',
      [JSON.stringify(seriesData), patientId]
    );

    const updatedPatient = await db.get('SELECT * FROM patients WHERE id = ?', [patientId]);
    
    res.json({
      ...updatedPatient,
      assignedSeries: JSON.parse(updatedPatient.assigned_series)
    });
  } catch (error) {
    console.error('Assign series error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Patient session routes
app.get('/api/my-series', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patient = await db.get('SELECT * FROM patients WHERE email = ?', [req.user.email]);
    
    if (!patient || !patient.assigned_series) {
      return res.status(404).json({ error: 'No assigned series found' });
    }

    res.json({
      series: JSON.parse(patient.assigned_series),
      currentSession: patient.current_session || 0
    });
  } catch (error) {
    console.error('Get my series error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/sessions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'patient') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { painBefore, painAfter, comments } = req.body;
    const patient = await db.get('SELECT * FROM patients WHERE email = ?', [req.user.email]);
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const assignedSeries = JSON.parse(patient.assigned_series);
    const sessionNumber = (patient.current_session || 0) + 1;

    // Insert session
    const result = await db.run(
      'INSERT INTO sessions (patient_id, series_id, session_number, pain_before, pain_after, comments) VALUES (?, ?, ?, ?, ?, ?)',
      [patient.id, assignedSeries.id, sessionNumber, painBefore, painAfter, comments]
    );

    // Update patient's current session
    await db.run(
      'UPDATE patients SET current_session = ? WHERE id = ?',
      [sessionNumber, patient.id]
    );

    const session = await db.get('SELECT * FROM sessions WHERE id = ?', [result.lastID]);
    res.json(session);
  } catch (error) {
    console.error('Create session error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get patient sessions for instructor
app.get('/api/patients/:id/sessions', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'instructor') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const patientId = parseInt(req.params.id);
    
    // Verify patient belongs to instructor
    const patient = await db.get(
      'SELECT * FROM patients WHERE id = ? AND instructor_id = ?',
      [patientId, req.user.id]
    );
    
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const sessions = await db.all(
      'SELECT * FROM sessions WHERE patient_id = ? ORDER BY completed_at DESC',
      [patientId]
    );

    res.json(sessions);
  } catch (error) {
    console.error('Get patient sessions error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Initialize database and start server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}).catch(error => {
  console.error('Failed to initialize database:', error);
  process.exit(1);
});