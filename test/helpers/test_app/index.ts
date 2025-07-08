import fastify from 'fastify';
import fastifyResource from '../../../src/index';
import Person from './models/Person';
import Possession from './models/Possession';

const app = fastify({ logger: false });

app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
});

app.register(fastifyResource, {
  model: Possession,
  resourceList: 'possession',
});

app.register(fastifyResource, {
  model: Possession,
  resourceList: ['person', 'possession'],
});

// Let's figure out what is needed for creating a resource based on the relation mapping rather than another model
const enableNestedSelfReferentialExample = true;
if (enableNestedSelfReferentialExample) {
  app.register(fastifyResource, {
    model: Person,
    // Maybe a resourceToModel map is needed here - { person: {model Person}, children: {model: Person, from: '', to: ''} } - which helps to demystify it
    // How does the resourceList work with relations rather than assuming an existing model exists?
    /*
      Hang on, if the next nested resource is not the singular name of the 
      next resource, then we can determine that the resource could be a 
      relation instead, and look at that. 

      - Task list
      - Check if the resource name is a plural version of the model name
      - If it is, then it is good
      - If not, then check if the resource name is a match for the relation mappings
      - If it is one of the relation mapping options, then extract the fields to match on
      - Q - What fields to match ?
      - 1st model would be persons.person_id, but in this case it is persons.parentId (the 'to' field)
      - We would need to write some unit tests to verify this behaviour
      - We would also need to look at how to handle cases where the model/resource name match, and the relation mapping matches are not found - thus requiring details configuration settings  
      - This could be for database schemas that have different kinds of table naming conventions
      
    */
    resourceList: ['person', 'children'],
  });
}

// Declare a route
app.get('/', (request, reply) => {
  request.log.info('Hello world');
  reply.send({ hello: 'world' });
});

// could handle listen and shutdown event elsewhere

export default app;
