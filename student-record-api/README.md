# Student Record Management API

A REST API for managing students, courses, and enrollments, built with
Node.js, Express, and Sequelize (SQLite by default — no external database
server required to run it).

## Features

- Full CRUD for **Students**, **Courses**, and **Enrollments**
- Relational data model: Student ⇄ Course many-to-many via Enrollment
- Input validation on every write endpoint (`express-validator`)
- Search, filtering, sorting, and pagination on all list endpoints
- Business rules: no duplicate enrollment, course capacity enforcement
- Consistent JSON responses and HTTP status codes
- Centralized error handling (validation, DB, 404, 500)
- Modular structure: routes → controllers → models, with shared utils

## Project Structure

```
student-record-api/
├── server.js              # Entry point: connects DB, starts server
├── app.js                 # Express app: middleware + route mounting
├── config/
│   └── database.js        # Sequelize connection config
├── models/
│   ├── Student.js
│   ├── Course.js
│   ├── Enrollment.js
│   └── index.js            # Associations
├── controllers/            # Business logic per resource
├── routes/                 # Route definitions per resource
├── validators/              # express-validator rule sets
├── middleware/
│   ├── validate.js         # Runs validation, returns 422 on failure
│   ├── errorHandler.js     # Central error handler
│   └── notFound.js         # 404 handler
├── utils/
│   ├── ApiError.js         # Custom error class with statusCode
│   ├── catchAsync.js       # Wraps async route handlers
│   ├── queryFeatures.js    # Search/filter/sort/pagination builder
│   └── seed.js             # Sample data seeder
└── data/                   # SQLite database file lives here
```

## Setup

Requires Node.js 18+.

```bash
cd student-record-api
npm install
cp .env.example .env
npm run seed     # optional: populate sample data
npm run dev       # or `npm start` for production mode
```

The API will be available at `http://localhost:3000`.
Health check: `GET /health`

## Data Model

**Student**: firstName, lastName, email (unique), dateOfBirth, gender,
phone, enrollmentYear, status (`active|inactive|graduated|suspended`)

**Course**: code (unique), title, description, credits, department,
capacity, status (`active|archived`)

**Enrollment**: studentId, courseId, enrollmentDate, status
(`enrolled|completed|dropped|failed`), grade — unique on (studentId, courseId)

## API Reference

All responses are JSON with a top-level `success` boolean. Errors include
a `message` and, for validation failures, an `errors` array of
`{ field, message }`.

### Students

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/students` | List students (search/filter/sort/paginate) |
| GET | `/api/students/:id` | Get one student (with enrolled courses) |
| POST | `/api/students` | Create a student |
| PATCH | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student (cascades enrollments) |
| GET | `/api/students/:id/enrollments` | List a student's enrollments |

Query params for `GET /api/students`:
- `search` — matches firstName, lastName, or email
- `status`, `enrollmentYear`, `gender` — exact filters
- `sort` — e.g. `sort=lastName` or `sort=-enrollmentYear` (comma-separated for multiple)
- `page`, `limit` — pagination (default page=1, limit=10, max limit=100)

Create example:
```bash
curl -X POST http://localhost:3000/api/students \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "Ada",
    "lastName": "Lovelace",
    "email": "ada@example.com",
    "enrollmentYear": 2024
  }'
```

### Courses

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/courses` | List courses (search/filter/sort/paginate) |
| GET | `/api/courses/:id` | Get one course (with enrolled students) |
| POST | `/api/courses` | Create a course |
| PATCH | `/api/courses/:id` | Update a course |
| DELETE | `/api/courses/:id` | Delete a course (cascades enrollments) |
| GET | `/api/courses/:id/enrollments` | List a course's enrollments |

Query params for `GET /api/courses`: `search` (title/code/department),
`department`, `status`, `credits`, `sort`, `page`, `limit`.

Create example:
```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CS101",
    "title": "Introduction to Computer Science",
    "credits": 4,
    "department": "Computer Science",
    "capacity": 30
  }'
```

### Enrollments

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/enrollments` | List enrollments (filter/sort/paginate) |
| GET | `/api/enrollments/:id` | Get one enrollment |
| POST | `/api/enrollments` | Enroll a student in a course |
| PATCH | `/api/enrollments/:id` | Update status or grade |
| DELETE | `/api/enrollments/:id` | Remove an enrollment |

Query params for `GET /api/enrollments`: `studentId`, `courseId`,
`status`, `sort`, `page`, `limit`.

Create example:
```bash
curl -X POST http://localhost:3000/api/enrollments \
  -H "Content-Type: application/json" \
  -d '{ "studentId": 1, "courseId": 1 }'
```

Enrollment creation enforces:
- Student and course must exist (`404` otherwise)
- No duplicate enrollment of the same student in the same course (`409`)
- Course capacity is not exceeded by active (`enrolled`) enrollments (`409`)

### Range filters

Numeric/date filterable fields also support suffix operators, e.g.:
`GET /api/students?enrollmentYear_gte=2022&enrollmentYear_lte=2024`

## HTTP Status Codes Used

| Code | Meaning |
|---|---|
| 200 | Successful GET/PATCH |
| 201 | Resource created |
| 204 | Resource deleted (no content) |
| 400 | Malformed request / bad reference |
| 404 | Resource not found |
| 409 | Conflict (duplicate email/code, duplicate enrollment, capacity full) |
| 422 | Validation failed |
| 500 | Unexpected server error |

## Notes

- Uses SQLite for zero-config local development. To use PostgreSQL/MySQL
  in production, only `config/database.js` needs to change (swap
  `dialect`, add `host`/`user`/`password`) — models and controllers are
  unaffected.
- `sequelize.sync()` auto-creates tables for convenience; for a real
  production deployment, replace with Sequelize migrations.
