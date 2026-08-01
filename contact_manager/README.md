# Contact Management System

A Flask REST API for securely managing personal and professional contacts.

## Project Structure

```
contact_manager/
├── app/
│   ├── __init__.py          # App factory
│   ├── extensions.py        # Shared extension instances (SQLAlchemy)
│   ├── models/
│   │   ├── __init__.py
│   │   └── contact.py       # Contact DB model
│   ├── schemas/
│   │   └── contact_schema.py  # Marshmallow validation schemas
│   ├── routes/
│   │   ├── __init__.py
│   │   └── contact_routes.py  # Contact API endpoints (blueprint)
│   └── utils/
│       ├── exceptions.py      # Custom API exceptions
│       ├── error_handlers.py  # Global error handler registration
│       └── pagination.py      # Pagination helpers
├── config.py                 # Environment-based configuration
├── run.py                    # App entrypoint
├── requirements.txt
└── README.md
```

## Setup

```bash
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python run.py
```

The API runs at `http://localhost:5000`. SQLite database is created automatically
at `instance/contacts.db` on first run.

## Data Model

| Field         | Type   | Rules                                   |
|---------------|--------|------------------------------------------|
| name          | string | required, 1-120 chars                    |
| email         | string | required, valid email, unique            |
| phone_number  | string | required, 7-20 chars, unique             |
| address       | string | optional, max 255 chars                  |
| company       | string | optional, max 120 chars                  |

## API Endpoints

### Create a contact
`POST /api/contacts`
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "phone_number": "+1-202-555-0143",
  "address": "123 Main St",
  "company": "Acme Corp"
}
```
Returns `201` with the created contact, `422` on validation errors, `409` if the
email or phone number is already in use.

### List contacts (paginated + sortable)
`GET /api/contacts?page=1&page_size=10&sort_by=name&sort_dir=asc`

- `sort_by`: one of `name`, `email`, `phone_number`, `company`, `created_at`, `updated_at`
- `sort_dir`: `asc` or `desc`

### Search contacts
`GET /api/contacts/search?q=jane&page=1&page_size=10`

Matches partial, case-insensitive text against `name`, `email`, or `phone_number`.

### Get a single contact
`GET /api/contacts/<id>`

### Update a contact (partial updates supported)
`PUT /api/contacts/<id>` or `PATCH /api/contacts/<id>`
```json
{ "company": "New Company Inc." }
```

### Delete a contact
`DELETE /api/contacts/<id>`

### Health check
`GET /health`

## Error Responses

All errors return JSON in a consistent shape:
```json
{ "error": "Validation failed", "details": { "email": ["Invalid email address"] } }
```

| Status | Meaning                                   |
|--------|--------------------------------------------|
| 400    | Malformed request                          |
| 404    | Resource not found                         |
| 405    | Method not allowed                         |
| 409    | Duplicate contact (email or phone in use)  |
| 422    | Input failed validation                    |
| 500    | Unexpected server error                    |

## Notes on Security & Validation

- Email format validated via Marshmallow's `Email` field.
- Phone numbers validated via regex (digits, spaces, `-`, `()`, optional leading `+`).
- Uniqueness enforced at both the database level (unique constraints) and the
  application level (explicit duplicate check before insert/update) so
  duplicate contacts are rejected with a clear `409` response.
- All unhandled exceptions are caught centrally and never leak stack traces
  to API clients.
