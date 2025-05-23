import { Model } from 'objection';
import { unitTestDB } from '../../knexConnections';

Model.knex(unitTestDB);

// Person model
class Employee extends Model {
  name: unknown;

  static get tableName() {
    return 'employees';
  }
}

export default Employee;
