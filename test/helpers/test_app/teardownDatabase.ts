/*
    This will delete the example.db file
*/

import fs from 'node:fs';
import path from 'node:path';

const dbPath = path.join(__dirname, 'e2e_app.db');
console.log('Deleting database file at:', dbPath);

// Function to delete the database file
async function deleteDatabase() {
  // Check if the file exists
  if (!fs.existsSync(dbPath)) {
    console.log('Database file does not exist, nothing to delete.');
    return;
  }
  fs.unlinkSync(dbPath);
}

export { deleteDatabase };
