import Person from './models/Person';
import { appDB } from '../knexConnections';

/*
  Creates the database schema if it doesn't exist.
*/
async function createSchema() {
  if (await appDB.schema.hasTable('persons')) {
    return;
  }

  await appDB.schema.createTable('persons', (table) => {
    table.increments('id').primary();
    table.integer('parentId').references('persons.id');
    table.string('firstName');
  });

  if (await appDB.schema.hasTable('possessions')) {
    return;
  }

  await appDB.schema.createTable('possessions', (table) => {
    table.increments('id').primary();
    table.integer('person_id').references('persons.id');
    table.string('name');
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function insertSampleData(data: any) {
  await Person.query().insertGraph(data);
}

export { createSchema, insertSampleData };
