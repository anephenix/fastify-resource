import knex from 'knex';

const appDB = knex({
  client: 'sqlite3',
  useNullAsDefault: true,
  connection: {
    filename: 'test/helpers/test_app/e2e_app.db',
  },
});

const unitTestDB = knex({
  client: 'sqlite3',
  connection: {
    filename: 'test/helpers/unit_tests/unit_tests.db',
  },
  useNullAsDefault: true,
});

export { appDB, unitTestDB };
