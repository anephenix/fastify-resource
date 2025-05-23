# Fastify Resource

A way of creating RESTful CRUD resources for Fastify and Objection.js.

[![npm version](https://badge.fury.io/js/@anephenix%2Ffastify-resource.svg)](https://badge.fury.io/js/@anephenix%2Ffastify-resource) [![Node.js CI](https://github.com/anephenix/fastify-resource/actions/workflows/node.js.yml/badge.svg)](https://github.com/anephenix/fastify-resource/actions/workflows/node.js.yml) [![Maintainability](https://api.codeclimate.com/v1/badges/20c424c1bf138e20f13d/maintainability)](https://codeclimate.com/github/anephenix/fastify-resource/maintainability) [![Test Coverage](https://api.codeclimate.com/v1/badges/20c424c1bf138e20f13d/test_coverage)](https://codeclimate.com/github/anephenix/fastify-resource/test_coverage) [![Socket Badge](https://socket.dev/api/badge/npm/package/@anephenix/fastify-resource)](https://socket.dev/npm/package/@anephenix/fastify-resource)

## Dependencies

- Node.js
- Fastify
- Objection.js for models

## Install

```shell
npm i @anephenix/fastify-resource
```

## Usage

### Registering as a Fastify plugin (recommended)

You can now use `fastify-resource` as a Fastify plugin. This is the recommended way to add RESTful resources to your Fastify app:

```javascript
const fastify = require('fastify')({ logger: false });
const Asset = require('./models/Asset');
const fastifyResource = require('@anephenix/fastify-resource').default;

fastify.register(fastifyResource, {
  model: Asset,
  resourceList: 'asset', // or ['asset'] for nested resources
});
```

This will automatically generate and register the following RESTful routes:

```
GET       /assets
POST      /assets
GET       /assets/:id
PATCH     /assets/:id
DELETE    /assets/:id
```

You can also use an array for `resourceList` to generate nested routes.

---

When writing code for an API, you may find yourself generating RESTful routes
for Objection.js models that support CRUD operations (Create/Read/Update/
Delete).

This library provides a way to generate code that will provide that with a few
lines of code.

For example, in Fastify you will usually define routes and handler functions
for CRUD like this:

```javascript
const fastify = require('fastify')({ logger: false });
const Asset = require('./models/Asset');

// GET /assets
fastify.get('/assets', async (req, rep) => {
  try {
    const data = await Asset.query();
    return data;
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});

// POST /assets
fastify.post('/assets', async (req, rep) => {
  try {
    const assets = await Asset.query().insert(req.body);
    rep.statusCode(201);
    return assets;
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});

// GET /assets/:id
fastify.get('/assets/:id', async (req, rep) => {
  try {
    const asset = await Asset.query().findById(req.params.id);
    if (asset) return asset;
    if (!asset) {
      res.statusCode(404);
      return 'Not found';
    }
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});

// PATCH /assets/:id
fastify.patch('/assets/:id', async (req, rep) => {
  try {
    const asset = await Asset.query().patchAndFetchById(
      req.params.id,
      req.body
    );
    if (asset) return asset;
    if (!asset) {
      res.statusCode(404);
      return 'Not found';
    }
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});

// DELETE /assets/:id
fastify.delete('/assets/:id', async (req, rep) => {
  try {
    await Asset.query().deleteById(req.params.id);
    return req.params.id;
  } catch (error) {
    rep.statusCode(400);
    return error.message;
  }
});
```

There's about 60 lines of code there for the routes. Now if you have a lot of
resources that you want to generate a bunch of RESTful routes and CRUD actions
for, then this file will become hundreds of lines of code at the very least.
Also, you may find that you are repeating the same code but with different
Objection.js models and routes in place.

With fastify resource, you can write this code and it will do the same thing:

```javascript
const fastify = require('fastify')({ logger: false });
const Asset = require('./models/Asset');
const { resource } = require('@anephenix/fastify-resource');

const { routes } = resource(Asset, 'asset');
// Instead of:
// attach({ fastify, routes });
```

The `resource` function is passed the Objection.js model as the 1st argument,
and the name of the resource for generating the url routes from as the 2nd
argument.

This will do the following:

- Define a list of 5 API RESTful routes that cover CRUD functions:

```
GET       /assets
POST      /assets
GET       /assets/:id
PATCH     /assets/:id
DELETE    /assets/:id
```

- It will create the controller actions that support those API routes
- It will also create a service module that serves the controller

To then attach those routes to the fastify app, we call the `attach` function
and pass the fastify instance and routes to combine them.

This helps you to quickly assemble a REST API for your Objection.js models,
using a few lines of code.

### Route-Controller-Service pattern

The way that the library works is that it generates a set of objects that
provide functions that can be called:

    Route -> Controller -> Service -> Model

#### Route

The first is the set of `routes`, which when generated for a resource look
something like this:

```typescript
[
  { method: 'get', url: '/assets', handler: Function },
  { method: 'post', url: '/assets', handler: Function },
  { method: 'get', url: '/assets/:id', handler: Function },
  { method: 'patch', url: '/assets/:id', handler: Function },
  { method: 'delete', url: '/assets/:id', handler: Function },
];
```

#### Controller

The `handler` function is the controller action that will be called when
the API route is called. The controller is accessible from the `resource`
function call:

```javascript
const { routes, controller, service } = resource(Asset, 'asset');
```

The generated controller code looks like this:

```typescript
{
		index: async (req:Request, rep:Reply) => {
			const { success, data, error } = await service.getAll(req.params);
			return handleResponse({success,data,error, rep});
		},
		create: async (req:Request, rep:Reply) => {
			const params = Object.assign({}, req.params, req.body);
			const { success, data, error } = await service.create(params);
			return handleResponse({success,data,error, rep, successCode: 201});
		},
		get: async (req:Request, rep:Reply) => {
			const { success, data, error } = await service.get(req.params);
			return handleResponse({success,data,error, rep});
		},
		update: async (req:Request, rep:Reply) => {
			const params = Object.assign({}, req.params, req.body);
			const { success, data, error } = await service.update(params);
			return handleResponse({success,data,error, rep});
		},
		delete: async (req:Request, rep:Reply) => {
			const { success, data, error } = await service.delete(req.params);
			return handleResponse({success,data,error, rep});
		},
	};
```

The `controller` actions try to extract the relevant data from the HTTP
request and pass it to the relevant service action. It then handles the
response from the service, and returns the HTTP response suitable for it.

This makes the controller action essentially an interface to the service, and
the service is where the business logic for the action is defined.

#### Service

The service is the core part of the application's business logic, and is the
primary part of the code that interfaces with the Objection.js model. The
generated code for the service looks like this:

```typescript
{
    getAll: async (params:Params) => {
        try {
            const data = await model.query().where(params);
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    },
    create: async (params:Params) => {
        try {
            const data = await model.query().insert(params);
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    },
    get: async (params:Params) => {
        try {
            const data = await model.query().where(params);
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    },
    update: async (params:Params) => {
        try {
            const updateParams = objectWithoutKey(params, 'id');
            const data = await model
                .query()
                .patchAndFetchById(params.id, updateParams);
            return { success: true, data };
        } catch (error) {
            return { success: false, error };
        }
    },
    delete: async (params:Params) => {
        try {
            await model.query().deleteById(params.id);
            return { success: true, data: params.id };
        } catch (error) {
            return { success: false, error };
        }
    },
};
```

Usually controller actions would be the primary code that interfaces with the
Objection.js model (like in the MVC pattern), but by abstracting out that part
into a service layer, you then have the opportunity to re-use those service
actions with other interfaces, such as:

- A WebSocket API
- An interactive REPL
- A CLI tool

We essentially treat the controller actions as supporting a HTTP REST API
interface to the service actions, alongside the other options.

### Creating nested routes

Any REST API tends to implement a hierarchy of resources. Let's say for example
there are 2 models - Post and Comment. A post has many comments, and we want to
create an API that fits that relationship. We might want our comments API
routes to be nested under the posts API routes.

The library can do that. In the `resource` function, you can pass an array of
resources to assemble the API routes that fit that. Below is an example of
how to do that:

```javascript
const fastify = require('fastify')({ logger: false });
const Post = require('./models/Post');
const Comment = require('./models/Comment');
const { resource } = require('@anephenix/fastify-resource');

const postResource = resource(Post, 'post');
const commentResource = resource(Comment, ['post', 'comment']);
// Instead of:
// attach({ fastify, routes: postResource.routes });
// attach({ fastify, routes: commentResource.routes });
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

### Advanced usage

There might be cases where you need to do custom adjustments to the controller,
or where you may want to access the service generated for the resource to attach
other interfaces to.

#### Generating routes, controllers and services separately

The library allows you to generate the services, controllers and routes
separately, so that you can structure your code in whatever pattern suits you.

The library has these functions available:

```javascript
const {
  serviceGenerator,
  controllerGenerator,
  resourceRoutes,
  resource,
} = require('@anephenix/fastify-resource');
```

##### serviceGenerator

The `serviceGenerator` function will generate a service for an Objection.js
model.

##### controllerGenerator

The `controllerGenerator` function will generate a controller for a service.

##### resourceRoutes

The `resourceRoutes` function will generate the routes for a controller and
the list of resources to turn into urls.

Using these will allow you to generate parts of the RCS pattern as well as
make custom parts of that code if needed.

### Tests

```shell
npm t
```

### License and Credits

&copy;2025 Anephenix OÜ. All Rights Reserved.
