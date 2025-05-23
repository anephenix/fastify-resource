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

// Declare a route
app.get('/', (request, reply) => {
  request.log.info('Hello world');
  reply.send({ hello: 'world' });
});

// could handle listen and shutdown event elsewhere

export default app;
