# Config Folder

This folder contains backend configuration setup.

## Files

- `db.js`: Creates and exports a MySQL connection pool using environment variables.

## Environment Variables Used

- `DB_HOST` (default: `127.0.0.1`)
- `DB_USER` (default: `root`)
- `DB_PASSWORD` (default: empty)
- `DB_NAME` (default: `human_resource_information_system`)
- `DB_PORT` (default: `3306`)

## Notes

- The pool is configured for queued connections and reused across all models.
- Use `pool.promise()` in controllers/models for async/await database calls.
