import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';
import { therapyTypes } from './predefinedTherapy.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const JWT_SECRET = 'therapeutic-yoga-secret-key';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// In-memory database 
let users = [];
let patients = [];
let therapySeries = [];
let sessions = [];

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
    
    if (users.find(u => u.email === email)) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = {
      id: users.length + 1,
      email,
      password: hashedPassword,
      name,
      role: role || 'instructor',
      createdAt: new Date()
    };

    users.push(user);
    
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email);

    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET);
    
    res.json({ 
      token, 
      user: { id: user.id, email: user.email, name: user.name, role: user.role } 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Patient routes
app.get('/api/patients', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const instructorPatients = patients.filter(p => p.instructorId === req.user.id);
  res.json(instructorPatients);
});

app.post('/api/patients', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { name, email, age, condition } = req.body;
  const patient = {
    id: patients.length + 1,
    name,
    email,
    age,
    condition,
    instructorId: req.user.id,
    assignedSeries: null,
    createdAt: new Date()
  };

  patients.push(patient);
  res.json(patient);
});

app.put('/api/patients/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const patientId = parseInt(req.params.id);
  const patientIndex = patients.findIndex(p => p.id === patientId && p.instructorId === req.user.id);
  
  if (patientIndex === -1) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  patients[patientIndex] = { ...patients[patientIndex], ...req.body };
  res.json(patients[patientIndex]);
});

app.delete('/api/patients/:id', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const patientId = parseInt(req.params.id);
  const patientIndex = patients.findIndex(p => p.id === patientId && p.instructorId === req.user.id);
  
  if (patientIndex === -1) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  patients.splice(patientIndex, 1);
  res.json({ message: 'Patient deleted successfully' });
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
app.get('/api/therapy-series', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }
  
  const instructorSeries = therapySeries.filter(s => s.instructorId === req.user.id);
  res.json(instructorSeries);
});

app.post('/api/therapy-series', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { name, therapyType, postures, totalSessions } = req.body;
  const series = {
    id: therapySeries.length + 1,
    name,
    therapyType,
    postures,
    totalSessions,
    instructorId: req.user.id,
    createdAt: new Date()
  };

  therapySeries.push(series);
  res.json(series);
});

// Assign series to patient
app.post('/api/patients/:id/assign-series', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const patientId = parseInt(req.params.id);
  const { seriesId } = req.body;
  
  const patientIndex = patients.findIndex(p => p.id === patientId && p.instructorId === req.user.id);
  const series = therapySeries.find(s => s.id === seriesId && s.instructorId === req.user.id);
  
  if (patientIndex === -1 || !series) {
    return res.status(404).json({ error: 'Patient or series not found' });
  }

  patients[patientIndex].assignedSeries = series;
  patients[patientIndex].currentSession = 0;
  
  res.json(patients[patientIndex]);
});

// Patient session routes
app.get('/api/my-series', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const patient = patients.find(p => p.email === req.user.email);
  if (!patient || !patient.assignedSeries) {
    return res.status(404).json({ error: 'No assigned series found' });
  }

  res.json({
    series: patient.assignedSeries,
    currentSession: patient.currentSession || 0
  });
});

app.post('/api/sessions', authenticateToken, (req, res) => {
  if (req.user.role !== 'patient') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { painBefore, painAfter, comments } = req.body;
  const patient = patients.find(p => p.email === req.user.email);
  
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const session = {
    id: sessions.length + 1,
    patientId: patient.id,
    seriesId: patient.assignedSeries.id,
    sessionNumber: (patient.currentSession || 0) + 1,
    painBefore,
    painAfter,
    comments,
    completedAt: new Date()
  };

  sessions.push(session);
  
  // Update patient's current session
  const patientIndex = patients.findIndex(p => p.id === patient.id);
  patients[patientIndex].currentSession = session.sessionNumber;

  res.json(session);
});

// Get patient sessions for instructor
app.get('/api/patients/:id/sessions', authenticateToken, (req, res) => {
  if (req.user.role !== 'instructor') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const patientId = parseInt(req.params.id);
  const patient = patients.find(p => p.id === patientId && p.instructorId === req.user.id);
  
  if (!patient) {
    return res.status(404).json({ error: 'Patient not found' });
  }

  const patientSessions = sessions.filter(s => s.patientId === patientId);
  res.json(patientSessions);
});

// Serve frontend
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});