# Position Management System

## Overview
A standardized positions table has been implemented in the database to manage employee positions. Instead of storing positions as free-text strings, employees now reference a canonical list of 316+ DepEd position types.

## Database Schema

### Positions Table
```sql
CREATE TABLE positions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  position_name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Employees Table Updates
- Added `position_id` column (INT, nullable, FK → positions.id)
- Kept `position` column for backward compatibility
- Foreign key ensures referential integrity

## Position Categories

The system includes positions across all DepEd levels:

- **Teaching**: Teacher I-VII, Master Teacher I-V, Head Teacher I-VI, etc.
- **Administrative**: Administrative Officer I-V, Secretary, Director III-IV, etc.
- **Support Staff**: Clerk, Messenger, Security Guard, Utility Worker, etc.
- **Specialized**: Guidance Counselor, Librarian, Nurse, Medical Officer, etc.
- **Technical**: System Administrator, IT Officer, Computer Programmer, etc.

**Total positions in database: 316**

## API Usage

### Creating an Employee with Position

#### Option 1: Using position_id (Recommended)
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "employee_type": "teaching",
  "school_id": 5,
  "birthdate": "1990-05-15",
  "position_id": 42,
  "plantilla_no": "PS-001"
}
```

#### Option 2: Using position (Legacy, free-text)
```json
{
  "first_name": "Jane",
  "last_name": "Smith",
  "employee_type": "non-teaching",
  "school_id": 5,
  "birthdate": "1985-10-20",
  "position": "Administrative Officer I"
}
```

### Getting All Available Positions

**Endpoint**: `GET /api/positions` *(create this route if needed)*

```bash
curl http://localhost:3000/api/positions
```

**Response**:
```json
{
  "data": [
    {
      "id": 1,
      "position_name": "Accountant I",
      "created_at": "2026-04-08T10:30:00Z"
    },
    {
      "id": 2,
      "position_name": "Accountant II",
      "created_at": "2026-04-08T10:30:00Z"
    }
  ]
}
```

### Updating an Employee Position

```bash
curl -X PUT http://localhost:3000/api/employees/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "position_id": 42,
    "first_name": "John",
    "last_name": "Doe",
    "employee_type": "teaching",
    "school_id": 5,
    "birthdate": "1990-05-15"
  }'
```

## Backend Implementation

### Model: `positionModel.js`
Located at: `src/modules/position/positionModel.js`

Methods:
- `getAll()` - Get all positions
- `getById(id)` - Get position by ID
- `getByName(name)` - Get position by name
- `create(name)` - Add new position
- `bulkCreate(names)` - Add multiple positions
- `delete(id)` - Remove position

### Employee Model Updates
- `create()` and `update()` now accept `position_id`
- Can use both `position` (string) and `position_id` (numeric) simultaneously
- Validation schema updated in `schemas.js`

### Validation Schema
Both create and update schemas accept:
```javascript
position: Joi.string().trim().max(255).allow(null, ""),
position_id: Joi.number().integer().positive().allow(null, "")
```

## Seeding

### Initial Seed
The positions were seeded with 316 DepEd position types using:
```bash
node scripts/seed-positions.js
```

### Adding New Positions
Use the Position model:
```javascript
const Position = require('./positionModel');
await Position.create('New Position Name');
```

Or bulk add:
```javascript
const positions = ['Position A', 'Position B', 'Position C'];
await Position.bulkCreate(positions);
```

## Migration Path

### For Existing Employees
1. Employees with existing `position` text values remain unchanged
2. Gradually migrate to `position_id` as employee records are updated
3. Create a background job (optional) to auto-match existing positions:
   ```javascript
   const [ posMatch] = await db.query(
     `SELECT id FROM positions WHERE position_name = ?`,
     [existingEmployee.position]
   );
   if (posMatch) {
     await db.query(
       `UPDATE employees SET position_id = ? WHERE id = ?`,
       [posMatch.id, existingEmployee.id]
     );
   }
   ```

## Future Enhancements

1. **Create position routes**:
   - `GET /api/positions` - List all
   - `POST /api/positions` - Create new (admin only)
   - `DELETE /api/positions/:id` - Remove (admin only)

2. **Position analytics**:
   - Count employees per position
   - Position vs. salary grades mapping
   - Vacancy tracking

3. **Bulk migration**:
   - Auto-link existing text positions to IDs
   - Reconciliation reports

## Files Modified/Created

- ✅ `src/modules/position/positionModel.js` - New
- ✅ `src/app.js` - Added positions table bootstrap
- ✅ `src/validation/schemas.js` - Added position_id validation
- ✅ `src/modules/employee/employeeModel.js` - Updated create/update
- ✅ `scripts/seed-positions.js` - New seed script

## Notes

- `INSERT IGNORE` used in bulk seed to skip duplicates safely
- Foreign key uses `ON DELETE SET NULL` (position can be deleted, employee remains)
- Both `position` (text) and `position_id` (numeric) fields are maintained for backward compatibility
- Index on `positions.position_name` for fast lookups
