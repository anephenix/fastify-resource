import Person from '../models/Person';

console.log(Person.relationMappings);

/*
    Result is:

    {
        children: {
            relation: [class HasManyRelation extends Relation],
            modelClass: [class Person extends Model],
            join: { from: 'persons.id', to: 'persons.parentId' }
        },
        possessions: {
            relation: [class HasManyRelation extends Relation],
            modelClass: [class Possession extends Model],
            join: { from: 'persons.id', to: 'possessions.person_id' }
        }
    }
*/
