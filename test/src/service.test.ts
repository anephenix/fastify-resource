import serviceGenerator from '../../src/service';
import { model } from '../helpers/model';
import assert from 'assert';

describe('service', () => {
  it('should return a service for a given model, with service actions available for a controller to use', () => {
    const service = serviceGenerator(model);
    assert(service.getAll);
    assert(service.create);
    assert(service.get);
    assert(service.update);
    assert(service.delete);
  });

  describe('service.getAll', () => {
    describe('when successful', () => {
      it('should return a success value of true, and a list of items in the data', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.getAll({});
        assert.strictEqual(success, true);
        assert.deepStrictEqual(data, []);
        assert.strictEqual(error, undefined);
      });
    });

    describe('when not successful', () => {
      it('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.getAll({ bad: true });
        assert.strictEqual(success, false);
        assert.strictEqual(data, undefined);
        assert.deepStrictEqual(error, new Error('bad query'));
      });
    });
  });

  describe('service.create', () => {
    describe('when successful', () => {
      it('should return a success value of true, and the data record', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.create({ name: 'John' });
        assert.strictEqual(success, true);
        assert.deepStrictEqual(data, { id: 1, name: 'John' });
        assert.strictEqual(error, undefined);
      });
    });

    describe('when not successful', () => {
      it('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.create({ bad: true });
        assert.strictEqual(success, false);
        assert.strictEqual(data, undefined);
        assert.deepStrictEqual(error, new Error('bad query'));
      });
    });
  });

  describe('service.get', () => {
    describe('when successful', () => {
      it('should return a success value of true, and the data record', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.get({ id: 1 });
        assert.strictEqual(success, true);
        assert.deepStrictEqual(data, { id: 1, name: 'John' });
        assert.strictEqual(error, undefined);
      });
    });

    describe('when not successful', () => {
      it('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.get({ bad: true });
        assert.strictEqual(success, false);
        assert.strictEqual(data, undefined);
        assert.deepStrictEqual(error, new Error('bad query'));
      });
    });
  });

  describe('service.update', () => {
    describe('when successful', () => {
      it('should return a success value of true, and the data record', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.update({
          id: 1,
          name: 'Bob',
        });
        assert.strictEqual(success, true);
        assert.deepStrictEqual(data, { id: 1, name: 'Bob' });
        assert.strictEqual(error, undefined);
      });
    });

    describe('when not successful', () => {
      it('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.update({ bad: true });
        assert.strictEqual(success, false);
        assert.strictEqual(data, undefined);
        assert.deepStrictEqual(error, new Error('bad query'));
      });
    });
  });

  describe('service.delete', () => {
    describe('when successful', () => {
      it('should return a success value of true, and the id of the deleted data record', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.delete({ id: 1 });
        assert.strictEqual(success, true);
        assert.strictEqual(data, 1);
        assert.strictEqual(error, undefined);
      });
    });

    describe('when not successful', () => {
      it('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.delete({ id: 'bad' });
        assert.strictEqual(success, false);
        assert.strictEqual(data, undefined);
        assert.deepStrictEqual(error, new Error('bad query'));
      });
    });
  });
});
