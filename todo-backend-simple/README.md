# To-Do List Backend (Single-File Version)

A RESTful task management API — same features as the full version, just packed into one `server.js`
so it's easy to push to GitHub.

**Stack:** Node.js, Express, Sequelize (SQLite), JWT auth, express-validator, Swagger.

## Files

```
todo-backend/
├── server.js        # entire app: models, auth, routes, validation, docs
├── package.json
├── .env.example
└── README.md
```

## Setup

```bash
npm install
cp .env.example .env
npm start
```

Server: `http://localhost:3000`
Interactive docs: `http://localhost:3000/api-docs`

## Endpoints

| Method | Endpoint                  | Auth | Description                          |
|--------|----------------------------|------|----------------------------------------|
| POST   | `/api/auth/register`        | No   | Create a user                           |
| POST   | `/api/auth/login`           | No   | Log in, get a JWT                        |
| GET    | `/api/auth/me`              | Yes  | Current user profile                     |
| POST   | `/api/tasks`                | Yes  | Create a task                            |
| GET    | `/api/tasks`                | Yes  | List/search/filter/paginate tasks         |
| GET    | `/api/tasks/:id`            | Yes  | Get one task                             |
| PUT    | `/api/tasks/:id`            | Yes  | Update a task                            |
| PATCH  | `/api/tasks/:id/status`     | Yes  | Mark pending/completed                    |
| DELETE | `/api/tasks/:id`            | Yes  | Delete a task                            |

**Query params on `GET /api/tasks`:** `status`, `priority`, `category`, `search`, `page`, `limit`, `sortBy`, `order`.

## Quick test

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"SecurePass123"}'

# Create a task (replace TOKEN with the one you got back)
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer TOKEN" -H "Content-Type: application/json" \
  -d '{"title":"Finish report","priority":"high","category":"work","dueDate":"2026-08-15"}'

# List + filter
curl "http://localhost:3000/api/tasks?status=pending&priority=high" \
  -H "Authorization: Bearer TOKEN"
```

## Notes

- Tasks are always scoped to `req.user.id` — one user can never see or modify another user's tasks.
- Passwords are bcrypt-hashed and never returned in responses.
- SQLite is file-based (`database.sqlite`, auto-created) — no separate DB server needed. To use Postgres/MySQL, just change the `dialect` in the `Sequelize()` config near the top of `server.js`.
