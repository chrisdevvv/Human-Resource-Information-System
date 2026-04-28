# Salary Increment Editable + Automation Summary

This note summarizes the update where salary increment is now editable while still supporting automatic calculation.

## What Changed

- Increment can now be either:
  - AUTO (system-calculated)
  - MANUAL (user-edited)
- The backend keeps both behaviors through a new mode field.

## Database Change

- Table: salary_information
- New column:
  - increment_mode ENUM('AUTO', 'MANUAL') NOT NULL DEFAULT 'AUTO'
- Existing rows are normalized so null mode becomes AUTO.

## Increment Logic

- AUTO mode:
  - Increment is computed from salary change against the previous salary record for the same employee.
  - Formula concept: current salary minus previous salary, clamped to non-negative value.
- MANUAL mode:
  - Increment value is preserved as the user entered it.
  - Automatic recompute does not overwrite manual rows.

## API Behavior

### Create salary entry
- If increment is provided with a numeric value:
  - increment_mode = MANUAL
- If increment is omitted:
  - increment_mode = AUTO

### Update salary entry
- If increment is provided with a numeric value:
  - row switches/keeps MANUAL
- If increment is provided as null or empty:
  - row switches to AUTO
- If increment is not included:
  - current mode is preserved

### Delete salary entry
- Remaining entries for that employee are re-evaluated for AUTO-mode increment consistency.

## Three-Year Auto Generation Compatibility

- Auto-generated 3-year salary-date entries are created in AUTO mode.
- Their increments are aligned during recomputation and remain system-managed unless manually overridden later.

## Files Updated

- src/app.js
- src/modules/employee/salaryInformationModel.js
