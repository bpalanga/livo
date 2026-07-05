import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { OAuth2Client } from 'google-auth-library';

const db = new Database('rentmaster.db');
const JWT_SECRET = 'rentmaster-secret-key-123';

// --- Google Sign-In Setup ---
// Set GOOGLE_CLIENT_ID in .env.local (see .env.example) — this must match
// the same Client ID used on the frontend (VITE_GOOGLE_CLIENT_ID).
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// --- File Upload Setup ---
// Uploaded property photos are saved to disk here, and served back out
// at the /uploads/<filename> URL (see app.use('/uploads', ...) below).
const UPLOADS_DIR = path.resolve('uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, UPLOADS_DIR),
    filename: (req, file, cb) => {
      // Prefix with a timestamp so two uploads never collide,
      // keep the original extension so browsers know how to render it.
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB cap per image
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPEG, PNG, WEBP, or GIF images are allowed'));
  }
});

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE,
    password TEXT,
    displayName TEXT,
    role TEXT DEFAULT 'tenant',
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    price REAL,
    location TEXT,
    amenities TEXT,
    imageUrl TEXT,
    status TEXT DEFAULT 'Available',
    agentId INTEGER,
    createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(agentId) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS inquiries (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tenantId INTEGER,
    agentId INTEGER,
    propertyId INTEGER,
    message TEXT,
    status TEXT DEFAULT 'Pending',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(tenantId) REFERENCES users(id),
    FOREIGN KEY(agentId) REFERENCES users(id),
    FOREIGN KEY(propertyId) REFERENCES listings(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    senderId INTEGER,
    receiverId INTEGER,
    inquiryId INTEGER,
    content TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(senderId) REFERENCES users(id),
    FOREIGN KEY(receiverId) REFERENCES users(id),
    FOREIGN KEY(inquiryId) REFERENCES inquiries(id)
  );

  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    recipient_id INTEGER,
    sender_id INTEGER,
    property_id INTEGER,
    message TEXT,
    is_read INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(recipient_id) REFERENCES users(id),
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(property_id) REFERENCES listings(id)
  );
`);

async function startServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  // Serve uploaded images at http://localhost:3000/uploads/<filename>
  app.use('/uploads', express.static(UPLOADS_DIR));

  // --- Auth Middleware ---
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // --- Auth Routes ---
  app.post('/api/auth/register', async (req, res) => {
    const { email, password, displayName, role } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const info = db.prepare('INSERT INTO users (email, password, displayName, role) VALUES (?, ?, ?, ?)').run(email, hashedPassword, displayName, role || 'tenant');
      const user = { id: info.lastInsertRowid, email, displayName, role: role || 'tenant' };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ token, user });
    } catch (e) {
      res.status(400).json({ error: 'Email already exists' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    const user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(userWithoutPassword, JWT_SECRET);
    res.json({ token, user: userWithoutPassword });
  });

  app.get('/api/auth/me', authenticateToken, (req: any, res) => {
    res.json(req.user);
  });

  // Verifies a Google ID token from the frontend's "Sign in with Google"
  // button, then finds or creates a matching local user and issues our
  // own app JWT — same as a normal email/password login from here on.
  app.post('/api/auth/google', async (req, res) => {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ error: 'Missing Google credential' });
    if (!GOOGLE_CLIENT_ID) return res.status(500).json({ error: 'Google Sign-In is not configured on the server' });

    try {
      const ticket = await googleClient.verifyIdToken({ idToken: credential, audience: GOOGLE_CLIENT_ID });
      const payload = ticket.getPayload();
      if (!payload || !payload.email) return res.status(401).json({ error: 'Invalid Google token' });

      const { email, name } = payload;
      let user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (!user) {
        // First time this Google account has signed in — create a local
        // account. The password is a random hash the user will never need,
        // since they'll always sign in via Google going forward.
        const randomPassword = await bcrypt.hash(`${email}-${Date.now()}-${Math.random()}`, 10);
        const info = db.prepare(
          'INSERT INTO users (email, password, displayName, role) VALUES (?, ?, ?, ?)'
        ).run(email, randomPassword, name || email, 'tenant');
        user = { id: info.lastInsertRowid, email, displayName: name || email, role: 'tenant' };
      }

      const { password: _pw, ...userWithoutPassword } = user;
      const token = jwt.sign(userWithoutPassword, JWT_SECRET);
      res.json({ token, user: userWithoutPassword });
    } catch (e: any) {
      console.error('Google auth error:', e.message);
      res.status(401).json({ error: 'Google sign-in failed' });
    }
  });

  // --- Upload Route ---
  // Accepts one image file from a multipart/form-data request under the
  // field name "image", saves it to /uploads, and returns its public URL.
  app.post('/api/upload', authenticateToken, upload.single('image'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No image file received' });
    res.json({ imageUrl: `/uploads/${req.file.filename}` });
  });

  // --- Listing Routes ---
  app.get('/api/listings', (req, res) => {
    const listings = db.prepare('SELECT * FROM listings ORDER BY createdAt DESC').all();
    res.json(listings.map((l: any) => {
      let amenities = [];
      try {
        amenities = JSON.parse(l.amenities || '[]');
        if (!Array.isArray(amenities)) amenities = [];
      } catch (e) {
        amenities = [];
      }
      return { ...l, amenities };
    }));
  });

  app.post('/api/listings', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'agent' && req.user.role !== 'admin') return res.sendStatus(403);
    const { title, price, location, amenities, imageUrl } = req.body;
    const info = db.prepare('INSERT INTO listings (title, price, location, amenities, imageUrl, agentId) VALUES (?, ?, ?, ?, ?, ?)').run(
      title, price, location, JSON.stringify(amenities), imageUrl, req.user.id
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.put('/api/listings/:id', authenticateToken, (req: any, res) => {
    const { title, price, location, amenities, imageUrl, status } = req.body;
    db.prepare('UPDATE listings SET title = ?, price = ?, location = ?, amenities = ?, imageUrl = ?, status = ? WHERE id = ?').run(
      title, price, location, JSON.stringify(amenities), imageUrl, status, req.params.id
    );
    res.json({ success: true });
  });

  app.delete('/api/listings/:id', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM listings WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Inquiry Routes ---
  app.post('/api/inquiries', authenticateToken, (req: any, res) => {
    const { agentId, propertyId, message } = req.body;
    db.prepare('INSERT INTO inquiries (tenantId, agentId, propertyId, message) VALUES (?, ?, ?, ?)').run(
      req.user.id, agentId, propertyId, message
    );
    // Also create notification
    db.prepare('INSERT INTO notifications (recipient_id, sender_id, property_id, message) VALUES (?, ?, ?, ?)').run(
      agentId, req.user.id, propertyId, `New inquiry from ${req.user.displayName}`
    );
    res.json({ success: true });
  });

  app.get('/api/inquiries', authenticateToken, (req: any, res) => {
    let inquiries;
    if (req.user.role === 'admin') {
      inquiries = db.prepare(`
        SELECT i.*, u.displayName as tenantName, l.title as propertyTitle 
        FROM inquiries i 
        JOIN users u ON i.tenantId = u.id 
        JOIN listings l ON i.propertyId = l.id
      `).all();
    } else {
      inquiries = db.prepare(`
        SELECT i.*, u.displayName as tenantName, l.title as propertyTitle 
        FROM inquiries i 
        JOIN users u ON i.tenantId = u.id 
        JOIN listings l ON i.propertyId = l.id
        WHERE i.agentId = ? OR i.tenantId = ?
      `).all(req.user.id, req.user.id);
    }
    res.json(inquiries);
  });

  app.put('/api/inquiries/:id/status', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    const inquiry: any = db.prepare('SELECT * FROM inquiries WHERE id = ?').get(req.params.id);
    if (!inquiry) return res.sendStatus(404);
    if (req.user.id !== inquiry.agentId && req.user.role !== 'admin') return res.sendStatus(403);

    db.prepare('UPDATE inquiries SET status = ? WHERE id = ?').run(status, req.params.id);
    
    // Notify tenant
    db.prepare('INSERT INTO notifications (recipient_id, sender_id, property_id, message) VALUES (?, ?, ?, ?)').run(
      inquiry.tenantId, req.user.id, inquiry.propertyId, `Your inquiry status has been updated to ${status}`
    );

    res.json({ success: true });
  });

  // --- Message Routes ---
  app.get('/api/messages/:inquiryId', authenticateToken, (req: any, res) => {
    const messages = db.prepare(`
      SELECT m.*, u.displayName as senderName 
      FROM messages m 
      JOIN users u ON m.senderId = u.id 
      WHERE inquiryId = ? 
      ORDER BY timestamp ASC
    `).all(req.params.inquiryId);
    res.json(messages);
  });

  app.post('/api/messages', authenticateToken, (req: any, res) => {
    const { inquiryId, receiverId, content } = req.body;
    db.prepare('INSERT INTO messages (senderId, receiverId, inquiryId, content) VALUES (?, ?, ?, ?)').run(
      req.user.id, receiverId, inquiryId, content
    );
    res.json({ success: true });
  });

  // --- Notification Routes ---
  app.get('/api/notifications', authenticateToken, (req: any, res) => {
    const notifications = db.prepare('SELECT * FROM notifications WHERE recipient_id = ? ORDER BY timestamp DESC').all(req.user.id);
    res.json(notifications);
  });

  app.put('/api/notifications/:id/read', authenticateToken, (req: any, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  });

  // --- Admin Routes ---
  app.get('/api/admin/users', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    const users = db.prepare('SELECT id, email, displayName, role, createdAt FROM users').all();
    res.json(users);
  });

  app.put('/api/admin/users/:id/role', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.sendStatus(403);
    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(req.body.role, req.params.id);
    res.json({ success: true });
  });

  // Catches upload errors (oversized file, wrong file type, etc.) and
  // returns them as JSON instead of letting Express crash with an HTML error page.
  app.use((err: any, req: any, res: any, next: any) => {
    if (err) return res.status(400).json({ error: err.message || 'Upload failed' });
    next();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => res.sendFile(path.resolve('dist/index.html')));
  }

  app.listen(3000, '0.0.0.0', () => {
    console.log('Server running on http://localhost:3000');
  });
}

startServer();
