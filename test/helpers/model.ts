import { ModelType } from '../../src/global';

// A simple in-memory datastore
const records: Array<Record<string, unknown>> = [];

// A mock of how an Objection.js model works
export const model: ModelType = {
  query: () => {
    return {
      where: (params: Record<string, unknown>) => {
        if (params.bad) throw new Error('bad query');
        if (params.id) return records.find((r) => r.id === params.id);
        return records;
      },

      insert: (params: Record<string, unknown>) => {
        if (params.bad) throw new Error('bad query');
        const record = { id: records.length + 1, name: params.name };
        records.push(record);
        return record;
      },

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

      deleteById: (id: number | string) => {
        if (id === 'bad') throw new Error('bad query');
        return id;
      },
    };
  },
};
