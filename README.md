# Fastify Resource

A way of creating API routes in Fastify with Objection.js models.

[![npm version](https://badge.fury.io/js/@anephenix%2Ffastify-resource.svg)](https://badge.fury.io/js/@anephenix%2Ffastify-resource) [![Node.js CI](https://github.com/anephenix/fastify-resource/actions/workflows/node.js.yml/badge.svg)](https://github.com/anephenix/fastify-resource/actions/workflows/node.js.yml) [![Maintainability](https://api.codeclimate.com/v1/badges/20c424c1bf138e20f13d/maintainability)](https://codeclimate.com/github/anephenix/fastify-resource/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/20c424c1bf138e20f13d/test_coverage)](https://codeclimate.com/github/anephenix/fastify-resource/test_coverage) [![Socket Badge](https://socket.dev/api/badge/npm/package/@anephenix/fastify-resource)](https://socket.dev/npm/package/@anephenix/fastify-resource)

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

### Tests

```shell
npm t
```

### License and Credits

&copy;2025 Anephenix OÜ. All Rights Reserved.