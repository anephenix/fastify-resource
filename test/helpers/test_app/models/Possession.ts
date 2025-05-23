import { Model } from 'objection';
import { appDB } from '../../knexConnections';
import Person from './Person';

Model.knex(appDB);

// Possession model
class Possession extends Model {
  name: unknown;

  static get tableName() {
    return 'possessions';
  }

  static get relationMappings() {
    return {
      person: {
        relation: Model.BelongsToOneRelation,
        modelClass: Person,
        join: {
          from: 'possessions.person_id',
          to: 'persons.id',
        },
      },
    };
  }
}

export default Possession;
