/*
    Deletes the database via a file removal as the database is a sqlite database
*/

// Dependencies
import { deleteDatabase } from '../teardownDatabase.ts';

deleteDatabase()
  .then(() => {
    console.log('Database deletion complete');
  })
  .catch((error) => {
    console.error('Error during database deletion:', error);
  });
