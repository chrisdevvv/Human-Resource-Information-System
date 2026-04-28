require("../src/config/loadEnv");
const pool = require("../src/config/db").promise();

const POSITION_RENAMES = [
  ["Accounting Staff 1", "Accounting Staff I"],
  ["Accounting Staff 2", "Accounting Staff II"],
  ["Accounting Staff 3", "Accounting Staff III"],
  ["Accounting Staff 4", "Accounting Staff IV"],
  ["Accounting Staff 5", "Accounting Staff V"],
  ["Admin Support 1", "Administrative Support I"],
  ["Admin Support 2", "Administrative Support II"],
  ["Admin Support 3", "Administrative Support III"],
  ["Admin Support 4", "Administrative Support IV"],
  ["Admin Support 5", "Administrative Support V"],
  ["Admin Support 6", "Administrative Support VI"],
  ["Admin Support 7", "Administrative Support VII"],
  ["Admin Support 8", "Administrative Support VIII"],
  ["Admin Support 9", "Administrative Support IX"],
  ["Admin Support 10", "Administrative Support X"],
  ["Admin Support 11", "Administrative Support XI"],
  ["Admin Support 12", "Administrative Support XII"],
  ["Admin Support 13", "Administrative Support XIII"],
  ["Architect 2", "Architect II"],
  ["Architect 3", "Architect III"],
  ["Architect 4", "Architect IV"],
  ["Driver 1", "Driver I"],
  ["Driver 2", "Driver II"],
  ["Driver 3", "Driver III"],
  ["Engineer 1", "Engineer I"],
  ["Engineer 2", "Engineer II"],
  ["Technical Assistant 1", "Technical Assistant I"],
  ["Technical Assistant 2", "Technical Assistant II"],
  ["Technical Assistant 3", "Technical Assistant III"],
  ["Technical Assistant 4", "Technical Assistant IV"],
];

async function updatePositionNames() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    let positionsUpdated = 0;
    let duplicateRowsMerged = 0;
    let employeePositionIdsRemapped = 0;
    let employeePositionsUpdated = 0;

    for (const [fromName, toName] of POSITION_RENAMES) {
      const [fromRows] = await connection.query(
        "SELECT id FROM positions WHERE position_name = ?",
        [fromName],
      );

      if (!fromRows.length) {
        const [employeeResult] = await connection.query(
          "UPDATE employees SET position = ? WHERE position = ?",
          [toName, fromName],
        );
        employeePositionsUpdated += employeeResult.affectedRows || 0;
        continue;
      }

      const fromId = fromRows[0].id;
      const [toRows] = await connection.query(
        "SELECT id FROM positions WHERE position_name = ?",
        [toName],
      );

      if (toRows.length) {
        const toId = toRows[0].id;

        const [remapResult] = await connection.query(
          "UPDATE employees SET position_id = ? WHERE position_id = ?",
          [toId, fromId],
        );
        employeePositionIdsRemapped += remapResult.affectedRows || 0;

        if (fromId !== toId) {
          const [deleteResult] = await connection.query(
            "DELETE FROM positions WHERE id = ?",
            [fromId],
          );
          duplicateRowsMerged += deleteResult.affectedRows || 0;
        }
      } else {
        const [positionResult] = await connection.query(
          "UPDATE positions SET position_name = ? WHERE id = ?",
          [toName, fromId],
        );
        positionsUpdated += positionResult.affectedRows || 0;
      }

      const [employeeResult] = await connection.query(
        "UPDATE employees SET position = ? WHERE position = ?",
        [toName, fromName],
      );
      employeePositionsUpdated += employeeResult.affectedRows || 0;
    }

    await connection.commit();

    console.log("Position rename migration complete.");
    console.log(`positions rows renamed: ${positionsUpdated}`);
    console.log(`positions duplicate rows merged: ${duplicateRowsMerged}`);
    console.log(
      `employees.position_id remapped: ${employeePositionIdsRemapped}`,
    );
    console.log(`employees.position rows updated: ${employeePositionsUpdated}`);
  } catch (error) {
    await connection.rollback();
    console.error("Position rename migration failed:", error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

updatePositionNames();
