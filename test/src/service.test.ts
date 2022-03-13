import serviceGenerator from '../../src/service';
import { model } from '../helpers/model';

describe('service', () => {
  test('should return a service for a given model, with service actions available for a controller to use', () => {
    const service = serviceGenerator(model);
    expect(service.getAll).toBeDefined();
    expect(service.create).toBeDefined();
    expect(service.get).toBeDefined();
    expect(service.update).toBeDefined();
    expect(service.delete).toBeDefined();
  });

  describe('service.getAll', () => {
    describe('when successful', () => {
      test('should return a success value of true, and a list of items in the data', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.getAll({});
        expect(success).toBe(true);
        expect(data).toEqual([]);
        expect(error).toBeUndefined();
      });
    });

    describe('when not successful', () => {
      test('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.getAll({ bad: true });
        expect(success).toBe(false);
        expect(data).toEqual(undefined);
        expect(error).toStrictEqual(new Error('bad query'));
      });
    });
  });

  describe('service.create', () => {
    describe('when successful', () => {
      test('should return a success value of true, and the data record', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.create({ name: 'John' });
        expect(success).toBe(true);
        expect(data).toStrictEqual({ id: 1, name: 'John' });
        expect(error).toBeUndefined();
      });
    });

    describe('when not successful', () => {
      test('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.create({ bad: true });
        expect(success).toBe(false);
        expect(data).toEqual(undefined);
        expect(error).toStrictEqual(new Error('bad query'));
      });
    });
  });

  describe('service.get', () => {
    describe('when successful', () => {
      test('should return a success value of true, and the data record', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.get({ id: 1 });
        expect(success).toBe(true);
        expect(data).toStrictEqual({ id: 1, name: 'John' });
        expect(error).toBeUndefined();
      });
    });

    describe('when not successful', () => {
      test('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.get({ bad: true });
        expect(success).toBe(false);
        expect(data).toEqual(undefined);
        expect(error).toStrictEqual(new Error('bad query'));
      });
    });
  });

  describe('service.update', () => {
    describe('when successful', () => {
      test('should return a success value of true, and the data record', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.update({
          id: 1,
          name: 'Bob',
        });
        expect(success).toBe(true);
        expect(data).toStrictEqual({ id: 1, name: 'Bob' });
        expect(error).toBeUndefined();
      });
    });

    describe('when not successful', () => {
      test('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.update({ bad: true });
        expect(success).toBe(false);
        expect(data).toEqual(undefined);
        expect(error).toStrictEqual(new Error('bad query'));
      });
    });
  });

  describe('service.delete', () => {
    describe('when successful', () => {
      test('should return a success value of true, and the id of the deleted data record', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.delete({ id: 1 });
        expect(success).toBe(true);
        expect(data).toBe(1);
        expect(error).toBeUndefined();
      });
    });

    describe('when not successful', () => {
      test('should return a success value of false, and the error value should be an error object', async () => {
        const service = serviceGenerator(model);
        const { success, data, error } = await service.delete({ id: 'bad' });
        expect(success).toBe(false);
        expect(data).toEqual(undefined);
        expect(error).toStrictEqual(new Error('bad query'));
      });
    });
  });
});
