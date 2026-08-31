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

### Supporting params/body transformation

Sometimes the params a controller assembles from the URL, request body and
`headerParams` aren't quite what the service/model layer should receive - a
password needs hashing before it's stored, a field needs renaming, or a
value needs to be derived. The `paramsTransform` option lets you supply a
function that maps/transforms those params before they're sent to the
service:

```typescript
import bcrypt from 'bcrypt';

app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
  paramsTransform: async (params, action) => {
    if ((action === 'create' || action === 'update') && params.password) {
      return { ...params, password: await bcrypt.hash(params.password as string, 10) };
    }
    return params;
  },
});
```

`paramsTransform` runs for every generated action - the 5 built-in CRUD
actions and any `customActions` - receiving the fully assembled params (so
it sees `headerParams`-derived values too) and the action's name (`index`,
`create`, `get`, `update`, `delete`, or a custom action's `name`), so it can
branch on which action is running. It's awaited, so returning a `Promise`
(as above) is supported. Whatever it returns is what's sent to the service,
and from there to the model action or your `customModelAction`.

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

### Support for custom API routes and actions

The 5 generated CRUD routes won't cover every use case - sometimes you need
a route that triggers an action rather than reading/writing a single
resource, e.g. bulk-archiving a list of resources via
`POST /people/archive`, or a member action like `POST /people/:id/deactivate`.
The `customActions` option lets you declare extra routes like this, backed
by their own controller/service actions, alongside the standard CRUD ones.

Each entry in `customActions` needs:

- `name` - used as the key for the generated controller/service function,
  as the route's `action` (so it can also be targeted by `schema`, see
  above), and as the `action` argument passed to `customModelAction`.
- `method` - the HTTP method for the route (`get`, `post`, `patch` or
  `delete`).
- `path` - the path segment (no leading slash) appended after the
  resource's URL, e.g. `"archive"`.
- `scope` - `"collection"` appends `path` after the collection URL (e.g.
  `/people/archive`), `"member"` appends it after the member URL (e.g.
  `/people/:id/archive`). Using a scope rather than a hand-written URL means
  nested/self-referential resources - whose URLs already contain generated
  `:xxx_id` params - don't need to be accounted for manually.
- `successCode` (optional) - HTTP status code to set on success; defaults
  to `200`.
- `includeBody` (optional) - whether the request body should be merged into
  the params sent to the service, alongside `params`/`headerParams`;
  defaults to `true` for `post`/`patch`, `false` otherwise.

```typescript
import type { Model, ModelClass } from 'objection';
import fastifyResource, { modelAction } from '@anephenix/fastify-resource';
import Person from './models/Person';

/*
  A customModelAction can handle a mix of custom actions and the standard
  CRUD ones - anything it doesn't recognise can be delegated back to the
  library's own `modelAction`, which is exported for this purpose.
*/
const archivePeople = async (
  action: string,
  model: ModelClass<Model>,
  params: Params,
) => {
  if (action === 'archive') {
    const { ids } = params as { ids: number[] };
    await model.query().whereIn('id', ids).patch({ archived: true });
    return await model.query().whereIn('id', ids);
  }
  return await modelAction(action, model, params);
};

app.register(fastifyResource, {
  model: Person,
  resourceList: 'person',
  serviceOptions: {
    customModelAction: archivePeople,
  },
  customActions: [
    { name: 'archive', method: 'post', path: 'archive', scope: 'collection' },
  ],
});
```

This registers `POST /people/archive` in addition to the usual 5 routes.
A request like `POST /people/archive` with a body of `{ "ids": [1, 2, 3] }`
calls `archivePeople("archive", Person, { ids: [1, 2, 3] })`, and the
result is returned as the response body with a `200` status.

A member-scoped action works the same way, but the route also carries the
`:id` (and any ancestor `:xxx_id`) params through to `params`:

```typescript
customActions: [
  { name: 'deactivate', method: 'post', path: 'deactivate', scope: 'member' },
],
```

registers `POST /people/:id/deactivate`, calling the service (and from
there `customModelAction`) with `{ id, ...body }`.

`preHandler` and `headerParams` apply to custom action routes the same way
they do to the generated CRUD ones. `schema` also works the same way -
just key the schema entry by the custom action's `name` instead of one of
`index`/`create`/`get`/`update`/`delete`.

### Generating scaffold files with the CLI

If you want to fully own a resource's code instead of using the generated
plugin, the package ships a `generate` CLI that scaffolds plain
fastify + Objection.js files for it - a model, a service, a controller and a
routes file, wired together with the same try/catch + status-code pattern
shown at the top of this README. **These generated files have no dependency
on fastify-resource** - they're a starting point for the "custom strategy",
not an alternative way of registering the plugin.

```shell
npx @anephenix/fastify-resource generate application
```

This creates:

```
src/models/Application.ts
src/services/application.ts
src/controllers/application.ts
src/routes/application.ts
src/index.ts
```

The resource name is singularized and can be given in any casing
(`application`, `Applications`, `blog_post`, `blogPost` all work) - it's
used as-is for the model's class name, and pluralized for the route URLs
and the model's `tableName`.

Options:

- `--output <dir>` - directory to generate the files under (default: `src`)
- `--force` - overwrite an existing model/service/controller/routes file for
  that resource. `index.ts` is never overwritten (it may already register
  other resources) - if one already exists, the CLI prints the two lines
  needed to wire up the new resource's routes instead.

### Tests

```shell
npm t
```

### License and Credits

&copy;2026 Anephenix Ltd. All Rights Reserved.
