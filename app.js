// app.js
// CodeCraftHub - Simple REST API for managing courses stored in a JSON file (courses.json)
// Implemented requirements:
// 1) Express REST API with CRUD for courses
// 2) Data persisted in a JSON file named "courses.json"
// 3) Endpoints:
//    - POST /api/courses          -> create a new course
//    - GET  /api/courses          -> get all courses
//    - GET  /api/courses/:id      -> get a specific course
//    - PUT  /api/courses/:id      -> update a course (full replace)
//    - DELETE /api/courses/:id     -> delete a course
// 4) Course schema (underscore naming as requested):
//    - id (auto-increment starting from 1)
//    - name (required)
//    - description (required)
//    - target_date (required, format YYYY-MM-DD)
//    - status (required, one of "Not Started", "In Progress", "Completed")
//    - created_at (auto-generated timestamp)
// 5) Basic error handling for missing fields, not found, invalid status/date, and file I/O errors
// 6) Helpful comments for beginners
// 7) Automatically creates courses.json if it doesn't exist
// 8) Server runs on port 5000

import express from 'express';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Determine __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the data file (same folder as this script)
const DATA_FILE = path.join(__dirname, 'courses.json');

// Server port (as requested, 5000)
const PORT = 5000;

// Create the Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Allowed statuses for validation
const VALID_STATUSES = ['Not Started', 'In Progress', 'Completed'];

// Ensure the data file exists; if not, create with an empty array
async function ensureDataFile() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    // Create directory if needed and initialize with an empty array
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });
    await fs.writeFile(DATA_FILE, '[]', 'utf8');
    console.log(`Created data file at ${DATA_FILE}`);
  }
}

// Read all courses from the JSON file
async function readCourses() {
  // Make sure the data file exists before reading
  await ensureDataFile();

  const raw = await fs.readFile(DATA_FILE, 'utf8');
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data;
    // If not an array for some reason, treat as empty
    return [];
  } catch {
    // If JSON is corrupted, treat as empty to avoid crashing
    return [];
  }
}

// Write the entire courses array to the JSON file
async function writeCourses(courses) {
  await fs.writeFile(DATA_FILE, JSON.stringify(courses, null, 2), 'utf8');
}

function isValidDateYMD(dateStr) {
  if (typeof dateStr !== 'string') return false;
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return false;

  const year = Number(m[1]);
  const month = Number(m[2]);
  const day = Number(m[3]);

  if (month < 1 || month > 12) return false;
  if (day < 1) return false;

  // Days in each month (including leap year check for February)
  const daysInMonth = [
    31,
    (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0) ? 29 : 28,
    31, 30, 31, 30, 31, 31, 30, 31, 30, 31
  ];

  if (day > daysInMonth[month - 1]) return false;

  return true;
}

// Initialize data file on startup
ensureDataFile().catch((err) => {
  console.error('Failed to initialize data file:', err);
});

// Create a router for API endpoints under /api
const router = express.Router();

/*
  POST /api/courses
  - Create a new course
  - Required fields in body: name, description, target_date, status
  - id is auto-generated (starting from 1)
  - created_at is auto-generated (ISO timestamp)
*/
router.post('/courses', async (req, res) => {
  try {
    const { name, description, target_date, status } = req.body;

    // Validate required fields
    const missing = [];
    if (!name) missing.push('name');
    if (!description) missing.push('description');
    if (!target_date) missing.push('target_date');
    if (!status) missing.push('status');
        if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status value. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    // Validate target_date format and calendar validity
    if (!isValidDateYMD(target_date)) {
      return res.status(400).json({ error: 'target_date must be in YYYY-MM-DD format and represent a valid date' });
    }

    // Read existing courses to determine the next id (auto-increment)
    const courses = await readCourses();
    const nextId = courses.length > 0 ? Math.max(...courses.map((c) => c.id)) + 1 : 1;

    const newCourse = {
      id: nextId,
      name,
      description,
      target_date,
      status,
      created_at: new Date().toISOString()
    };

    // Persist and respond
    courses.push(newCourse);
    await writeCourses(courses);

    return res.status(201).json(newCourse);
  } catch (err) {
    console.error('Error creating course:', err);
    return res.status(500).json({ error: 'Internal server error while creating course' });
  }
});

/*
  GET /api/courses
  - Get all courses
*/
router.get('/courses', async (req, res) => {
  try {
    const courses = await readCourses();
    return res.json(courses);
  } catch (err) {
    console.error('Error reading courses:', err);
    return res.status(500).json({ error: 'Failed to read courses' });
  }
});

/*
  GET /api/courses/:id
  - Get a specific course by id
*/
router.get('/courses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course id' });
    }

    const courses = await readCourses();
    const course = courses.find((c) => c.id === id);
    if (!course) {
      return res.status(404).json({ error: 'Course not found' });
    }
        return res.json(course);
  } catch (err) {
    console.error('Error fetching course:', err);
    return res.status(500).json({ error: 'Failed to fetch course' });
  }
});

/*
  GET /api/courses/stats
  - Returns statistics about courses:
  - total number of courses
  - number of courses by status: "Not Started", "In Progress", "Completed"
*/
router.get('/courses/stats', async (req, res) => {
  try {
    const courses = await readCourses(); // read all courses from courses.json
    const total = courses.length;

    // Initialize counters for each known status
    const byStatus = {
      'Not Started': 0,
      'In Progress': 0,
      'Completed': 0
    };

    // Tally the counts by status
    for (const c of courses) {
      if (byStatus.hasOwnProperty(c.status)) {
        byStatus[c.status] += 1;
      }
      // If a course has an unexpected status, it is ignored in this stats report.
    }

    // Build a friendly response including total and each status count
    const response = {
      total,
      'Not Started': byStatus['Not Started'],
      'In Progress': byStatus['In Progress'],
      'Completed': byStatus['Completed']
    };

    res.json(response);
  } catch (err) {
    console.error('Error computing stats:', err);
    res.status(500).json({ error: 'Failed to compute stats' });
  }
});

/*
  PUT /api/courses/:id
  - Update a course (full replacement)
  - Required fields in body: name, description, target_date, status
  - id and created_at are preserved (created_at remains the original)
*/
router.put('/courses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course id' });
    }
    const { name, description, target_date, status } = req.body;

    // Validate required fields
    const missing = [];
    if (!name) missing.push('name');
    if (!description) missing.push('description');
    if (!target_date) missing.push('target_date');
    if (!status) missing.push('status');
    if (missing.length > 0) return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });

    // Validate status and date
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status value. Must be one of: ${VALID_STATUSES.join(', ')}`
      });
    }

    if (!isValidDateYMD(target_date)) {
      return res.status(400).json({ error: 'target_date must be in YYYY-MM-DD format and represent a valid date' });
    }

    // Load existing data to locate course
    const courses = await readCourses();
    const idx = courses.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    // Build updated course (preserve created_at)
    const updated = {
      id,
      name,
      description,
      target_date,
      status,
      created_at: courses[idx].created_at
    };

    courses[idx] = updated;
    await writeCourses(courses);

    return res.json(updated);
  } catch (err) {
    console.error('Error updating course:', err);
    return res.status(500).json({ error: 'Failed to update course' });
  }
});

/*
  DELETE /api/courses/:id
  - Delete a course
*/
router.delete('/courses/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: 'Invalid course id' });
    }

    const courses = await readCourses();
    const idx = courses.findIndex((c) => c.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Course not found' });
    }

    courses.splice(idx, 1);
    await writeCourses(courses);

    // 204 No Content on successful deletion
    return res.status(204).send();
  } catch (err) {
    console.error('Error deleting course:', err);
    return res.status(500).json({ error: 'Failed to delete course' });
  }
});

// Mount API router under /api
app.use('/api', router);

// Basic 404 for unknown routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Global error handler (for any uncaught errors in middleware/routes)
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start the server after ensuring the data file exists
ensureDataFile()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`CodeCraftHub API listening on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize data file:', err);
    process.exit(1);
  });
