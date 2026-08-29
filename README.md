# Fastify Resource

A way of creating API routes in Fastify with Objection.js models.

[![npm version](https://badge.fury.io/js/@anephenix%2Ffastify-resource.svg)](https://badge.fury.io/js/@anephenix%2Ffastify-resource) [![Node.js CI](https://github.com/anephenix/fastify-resource/actions/workflows/node.js.yml/badge.svg)](https://github.com/anephenix/fastify-resource/actions/workflows/node.js.yml) [![Socket Badge](https://socket.dev/api/badge/npm/package/@anephenix/fastify-resource)](https://socket.dev/npm/package/@anephenix/fastify-resource)

## Dependencies

- Node.js
- Fastify
- Objection.js for models

## Install

```shell
npm i @anephenix/fastify-resource
```

## Why use fastify-resource?

When writing code for an API, you may find yourself generating RESTful routes
for Objection.js models that support CRUD operations (Create/Read/Update/
Delete), and it could end up looking like this:

```typescript
import fastify from 'fastify';
import Person from './models/Person';

const app = fastify({ logger: false });

// GET /people
app.get('/people', async (req, rep) => {
  try {
    const data = await Person.query();
    return data;
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});

// POST /people
app.post('/people', async (req, rep) => {
  try {
    const people = await Person.query().insert(req.body);
    rep.statusCode(201);
    return people;
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});

// GET /people/:id
app.get('/people/:id', async (req, rep) => {
  try {
    const person = await Person.query().findById(req.params.id);
    if (person) return person;
    if (!person) {
      res.statusCode(404);
      return 'Not found';
    }
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});

// PATCH /people/:id
app.patch('/people/:id', async (req, rep) => {
  try {
    const person = await Person.query().patchAndFetchById(
      req.params.id,
      req.body
    );
    if (person) return person;
    if (!person) {
      res.statusCode(404);
      return 'Not found';
    }
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});

// DELETE /people/:id
app.delete('/people/:id', async (req, rep) => {
  try {
    await Person.query().deleteById(req.params.id);
    return req.params.id;
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});
```

To save you from having to write all that code, this library works as a 
fastify plugin to enable you to do the same thing, but with just these 
lines of code:

```typescript
import fastify from 'fastify'
import Person from './models/Person';
import fastifyResource from '@anephenix/fastify-resource';

const app = fastify({ logger: false });
app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
});
```

This will automatically generate and register the following RESTful routes:

```
GET       /people
POST      /people
GET       /people/:id
PATCH     /people/:id
DELETE    /people/:id
```

It will also:

- Automatically generate code functions for each of those endpoints in memory
- Those code function then call the Objection.model to perform database operations.

The result being that in a few lines of code you have implemented CRUD for 
your resource.

### Adding a preHandler

If you want to run Fastify pre-handlers before each generated route (for example to apply auth or add headers), pass a `preHandler` function or array in the plugin options:

```typescript
/*
  A simple example to demonstrate a preHandler function that
  could run before the route's handler function is called
*/
const ensureAuth = async (request, reply) => {
  if (!request.headers.authorization) {
    reply.code(401);
    throw new Error("Unauthorized");
  }
};

app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
  preHandler: ensureAuth,
});
```

You can also supply an array of pre-handlers:

```typescript
app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
  preHandler: [ensureAuth, otherHook],
});
```

### Supporting request headers

Request headers often carry two different kinds of information: something to
authenticate/authorize against (like a Bearer token), and something to scope
a query by (like a tenant id, or a user id resolved from that token). These
are handled in two different ways.

**Rejecting unauthorized requests** is done with `preHandler`, as shown
above - check the header and throw/reply before the route handler runs:

```typescript
const ensureAuth = async (request, reply) => {
  if (!request.headers.authorization) {
    reply.code(401);
    throw new Error("Unauthorized");
  }
};

app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
  preHandler: ensureAuth,
});
```

**Getting header values into the service/model layer** (so a query can be
scoped by them) is done with the `headerParams` option. It's a mapping of
request header name to the key that value should be assigned under in the
`params` object passed to the service, and from there to the model action or
your `customModelAction`:

```typescript
app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
  preHandler: ensureAuth,
  headerParams: {
    'x-tenant-id': 'tenantId',
  },
});
```

With this in place, a request like `GET /people` with an `x-tenant-id: acme`
header results in the service being called with `{ tenantId: 'acme' }`
merged into its params, which a `customModelAction` (see below) can use to
scope the query.

Only headers you explicitly name are extracted - request headers are never
passed through wholesale. Header-derived values are also merged in last, so
a client can't override one (e.g. `tenantId`) by supplying a same-named
field in the request body or URL.

### Supporting schema validation

Fastify validates requests (and can serialize responses) using a JSON
[schema](https://fastify.dev/docs/latest/Reference/Validation-and-Serialization/)
attached to a route. `fastify-resource` lets you supply one of these schemas
per generated action - `index`, `create`, `get`, `update` and `delete` - via
the `schema` option:

```typescript
app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
  schema: {
    create: {
      body: {
        type: 'object',
        required: ['firstName'],
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
        },
      },
    },
    update: {
      body: {
        type: 'object',
        properties: { firstName: { type: 'string' } },
      },
    },
    index: {
      querystring: {
        type: 'object',
        properties: { limit: { type: 'integer' } },
      },
    },
    get: {
      response: {
        200: {
          type: 'object',
          properties: { id: { type: 'number' }, firstName: { type: 'string' } },
        },
      },
    },
  },
});
```

Each action's schema can use any of Fastify's route-level schema keys -
`body`, `querystring`, `params`, `headers` and `response` - since `index` maps
to `GET /people`, `create` to `POST /people`, and `get`/`update`/`delete` to
the `/people/:id` member route. A `schema` entry is merged into the same
route options object as `preHandler`, so the two can be used together.

Request validation happens inside Fastify before your resource's generated
handler runs, so a failing request gets Fastify's own `400` response and
never reaches the model/service layer. A `response` schema is used for
serialization - properties not listed are dropped from the output, which is
useful for hiding columns (e.g. foreign keys) that the model action returns.

For **nested resources** (see below), the member route URL contains one
`:xxx_id` parameter per ancestor resource plus a final `:id` - a `params`
schema should account for all of them, not just `id`.

Instance-wide validation concerns - swapping out Ajv via
`setValidatorCompiler`, customizing error output via
`setSchemaErrorFormatter`/`setErrorHandler`, or sharing schemas with
`addSchema`/`$ref` - are configured on the Fastify instance itself (`app`),
the same way you would for any other Fastify route, since `fastify-resource`
is a standard Fastify plugin.

### Creating nested routes

Any REST API tends to implement a hierarchy of resources. Let's say for example
there are 2 models - Post and Comment. A post has many comments, and we want to
create an API that models that relationship (fetch comments for a post). 

We might want our comments API routes to be nested under the posts API routes.

The library can do that:

```typescript
import fastify from 'fastify'
import Post from './models/Post';
import fastifyResource from '@anephenix/fastify-resource';

const app = fastify({ logger: false });
app.register(fastifyResource, {
  model: Post,
  resourceList: ['post', 'comment'],
});
```

This will make the following API routes available on the fastify instance:

```
GET     /posts
POST    /posts
GET     /posts/:id
PATCH   /posts/:id
DELETE  /posts/:id

GET     /posts/:post_id/comments
POST    /posts/:post_id/comments
GET     /posts/:post_id/comments/:id
PATCH   /posts/:post_id/comments/:id
DELETE  /posts/:post_id/comments/:id
```

You can have many levels of nested resources in your code, it is not limited
to any number (we just showed 2 resources in order to demonstrate the example).

### Support for self-referential resources

There might be a case where you use the same database table for a type of Model 
that contains nested resources that are the same thing, such as:

- A Category model that has many sub-categories
- A Person model that has many children
- A Group that has many sub-groups

It is possible to setup the self-referential resource to perform queries using 
the `relationMappings` part of the ORM model:

Lete's say that you have a model `Person` with a `relationMappings` for 
children that looks like this:

```typescript
import { Model } from "objection";
import { appDB } from "../../knexConnections";
import Possession from "./Possession";

Model.knex(appDB);

// Person model
class Person extends Model {
	firstName: unknown;

	static get tableName() {
		return "persons";
	}

	static get relationMappings() {
		return {
			children: {
				relation: Model.HasManyRelation,
				modelClass: Person,
				join: {
					from: "persons.id",
					to: "persons.parentId",
				},
			}
		};
	}
}

export default Person;
```

And say you want to setup a REST API route set for these routes:

```
GET     /people/:person_id/children
POST    /people/:person_id/children
GET     /people/:person_id/children/:id
PATCH   /people/:person_id/children/:id
DELETE  /people/:person_id/children/:id
```

Then you can achieve that by passing these properties in the `serviceOptions` 
section:

```typescript
	app.register(fastifyResource, {
		model: Person,
		resourceList: ["person", "child"],
		serviceOptions: {
			type: "relatedQuery", // Pass this value to tell Fastify Resource to look for the related query
			relatedQuery: "children", // The property in the `relationMappings` definition for the nested resource
			primaryKey: "person_id", // The parameter passed by the controller to the service for scoping the model
		},
	});
```

### Support for custom model actions

If you find that the ORM queries that the service generator uses do not match 
your needs, and that you need to write custom model queries, then there is a 
way to override it and to provide your own custom model action function to 
the service generator.

You can generate a custom model action like this:

```typescript
/*
  Define a custom model action that will handle the queries for:

  - getAll
  - get
  - create
  - update
  - delete
*/
import type { Model } from 'objection';

const customModelAction = async (action: string, model: Model, params: Params) => {
  const relatedQuery = 'children';
  const primaryKey = 'person_id';
  const primaryId = params[primaryKey];
  const paramsToInsert = objectWithoutKey(params, primaryKey);
  const paramsToUpdate = objectWithoutKey(
    objectWithoutKey(paramsToInsert, "id"),
    primaryKey,
  );

  switch (action) {
    case "getAll":
      return await model.relatedQuery(relatedQuery).for(primaryId);
    case "get":
      return await model
        .relatedQuery(relatedQuery)
        .for(primaryId)
        .where("id", params.id)
        .first();
    case "create":
      return await model
        .relatedQuery(relatedQuery)
        .for(primaryId)
        .insert(paramsToInsert);
    case "update":
      return await model
        .relatedQuery(relatedQuery)
        .for(primaryId)
        .patchAndFetchById(params.id, paramsToUpdate);
    case "delete": {
      const deletedCount = await model
        .relatedQuery(relatedQuery)
        .for(primaryId)
        .delete()
        .where("id", params.id);
      if (deletedCount === 0) {
        throw new Error(`Record with id ${params.id} not found`);
      }
      return params.id;
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }
};

// And then pass that custom model action in the serviceOptions section:
app.register(fastifyResource, {
  model: Person,
  resourceList: ["person", "child"],
  serviceOptions: {
    customModelAction
  },
});
```

The service will then use the `customModelAction` function when it comes to 
performing the queries for the service.

### Tests

```shell
npm t
```

### License and Credits

&copy;2026 Anephenix Ltd. All Rights Reserved.
