/*
  This mocks an Objection.js model for the purpose of the unit tests that
  test out the serviceGenerator function.

  For the E2E tests, we will use a real Objection.js model and a real database
  to ensure that things work as expected.
*/

// Dependencies
import { ModelType } from '../../src/global';

// A simple in-memory datastore
const records: Array<Record<string, unknown>> = [];

// A mock of how an Objection.js model works
export const model: ModelType = {
  // Equivalent to doing a query on an Objection.js model
  query: () => {
    return {
      // Equivalent to Model.query().where(params)
      where: (params: Record<string, unknown>) => {
        if (params.bad) throw new Error('bad query');
        if (params.id) return records.find((r) => r.id === params.id);
        return records;
      },

      // Equivalent to Model.query().insert(params)
      insert: (params: Record<string, unknown>) => {
        if (params.bad) throw new Error('bad query');
        const record = { id: records.length + 1, name: params.name };
        records.push(record);
        return record;
      },

      // Equivalent to Model.query().patchAndFetchById(id, params)
      patchAndFetchById: (id: number, params: Record<string, unknown>) => {
        if (params.bad) throw new Error('bad query');
        const record = records.find((r) => r.id === id);
        if (record) {
          const index = records.indexOf(record);
          records[index] = { ...record, ...params };
          return records[index];
        } else {
          throw new Error('not found');
        }
      },

      // Equivalent to Model.query().deleteById(id)
      deleteById: (id: number | string) => {
        if (id === 'bad') throw new Error('bad query');
        return id;
      },
    };
  },
};
