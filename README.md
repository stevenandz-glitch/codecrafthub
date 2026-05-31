
CodeCraftHub - Personal learning goal tracker API
A lightweight REST API built with Node.js and Express to track courses developers want to learn. Data is persisted in a simple JSON file (courses.json) with no database required. Includes basic validation and error handling suitable for beginners.

Project overview
Lightweight REST API for managing courses
Data stored in a JSON file: courses.json
No authentication or user management
Endpoints cover Create, Read, Update, and Delete (CRUD)
Auto-increments course IDs starting from 1
Automatically creates courses.json if it doesn't exist
Runs on port 5000
Features
Create a new course
Retrieve all courses
Retrieve a single course by ID
Update a course (full replacement)
Delete a course
Validation for required fields and allowed status values
Validates target_date in the format YYYY-MM-DD
Catches and reports file read/write errors
Installation
Prerequisites

Node.js installed (LTS version recommended)
Setup

Clone the project repository (or create a new directory and add files)
Install dependencies
npm install
The project uses a simple JSON file named courses.json for storage. If it doesn’t exist, the app will create it automatically.
How to run the application
Start the server ( port 5000 ):

npm start
Or run directly: node app.js
The API base URL is http://localhost:5000/api

API Reference
Endpoint base: /api/courses

Create a new course
POST /api/courses
Request body (JSON): { "name": "Learn Express", "description": "Understand building APIs with Express", "target_date": "2026-08-01", "status": "Not Started" // one of: "Not Started", "In Progress", "Completed" }
Response (201 Created): { "id": 1, "name": "Learn Express", "description": "Understand building APIs with Express", "target_date": "2026-08-01", "status": "Not Started", "created_at": "2024-XX-XXTXX:XX:XX.XXXZ" }
Common errors:
400 Bad Request: Missing required fields (e.g., name, description, target_date, status)
400 Bad Request: Invalid status value (must be one of Not Started, In Progress, Completed)
400 Bad Request: target_date must be in YYYY-MM-DD format and represent a valid date
500 Internal Server Error: File I/O error
Get all courses
GET /api/courses
Response (200 OK): [ { "id": 1, "name": "...", "description": "...", "target_date": "YYYY-MM-DD", "status": "...", "created_at": "..." }, ... ]
Get a specific course by ID
GET /api/courses/:id
Response (200 OK): { "id": 1, "name": "...", "description": "...", "target_date": "YYYY-MM-DD", "status": "...", "created_at": "..." }
Common errors:
400 Bad Request: Invalid course id
404 Not Found: Course not found
Update a course (full replacement)
PUT /api/courses/:id
Request body (JSON) needs all required fields: { "name": "Updated Name", "description": "Updated description", "target_date": "YYYY-MM-DD", "status": "In Progress" }
Response (200 OK): { "id": 1, "name": "Updated Name", "description": "Updated description", "target_date": "YYYY-MM-DD", "status": "In Progress", "created_at": "original-creation-timestamp" }
Common errors:
400 Bad Request: Missing required fields or invalid values
404 Not Found: Course not found
Delete a course
DELETE /api/courses/:id
Response (204 No Content) on success
Common errors:
400 Bad Request: Invalid course id
404 Not Found: Course not found
Notes on data model

id: auto-generated, starting from 1
name: required
description: required
target_date: required, format YYYY-MM-DD
status: required, one of "Not Started", "In Progress", "Completed"
created_at: auto-generated timestamp when the course is created
Error handling (brief)

Missing required fields: 400 with a descriptive error
Course not found: 404 with a descriptive error
Invalid status values: 400 with a descriptive error
File read/write errors: 500 with a descriptive error and log to console
Troubleshooting

Server not starting or port in use
Check if another process is using port 5000
Change port in code if needed or stop the conflicting process
Data file issues
If courses.json is corrupted, the app will attempt to recover by treating data as an empty array
Ensure the app has write permissions to the directory
Dependency issues
Run npm install to install express (and other dependencies if added)
Validation errors
Ensure target_date is in YYYY-MM-DD and represents a valid date (e.g., 2026-02-28)
Status must be exactly one of the allowed values
Example requests (quick reference)

Create example curl -X POST http://localhost:5000/api/courses
-H "Content-Type: application/json"
-d '{"name":"Express 101","description":"Intro to Express routes","target_date":"2026-07-01","status":"Not Started"}'

Get all curl http://localhost:5000/api/courses

Get one curl http://localhost:5000/api/courses/1

Update curl -X PUT http://localhost:5000/api/courses/1
-H "Content-Type: application/json"
-d '{"name":"Express 101 - Updated","description":"Updated desc","target_date":"2026-07-15","status":"In Progress"}'

Delete curl -X DELETE http://localhost:5000/api/courses/1

File structure (example)

package.json
app.js (the server implementation)
courses.json (created automatically on first run)
README.md (this file)
