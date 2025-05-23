/*
    Automatically sets up the database from running it as a script
*/

// Dependencies
import seedData from '../seedData.ts';
import { appDB } from '../../knexConnections.ts';

import { createSchema, insertSampleData } from '../setupDatabase.ts';

createSchema()
  .then(() => insertSampleData(seedData))
  .then(() => {
    console.log('Database setup complete');
    return appDB.destroy();
  })
  .catch((err) => {
    console.error(err);
    return appDB.destroy();
  });
