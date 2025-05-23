## How does it work?

The `resource` function is passed the Objection.js model as the 1st argument,
and the name of the resource for generating the url routes from as the 2nd
argument.

This will do the following:

- Define a list of 5 API RESTful routes that cover CRUD functions:

```
GET       /people
POST      /people
GET       /people/:id
PATCH     /people/:id
DELETE    /people/:id
```

- It will create the controller actions that support those API routes
- It will also create a service module that serves the controller
- It then attached

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
  { method: 'get', url: '/people', handler: Function },
  { method: 'post', url: '/people', handler: Function },
  { method: 'get', url: '/people/:id', handler: Function },
  { method: 'patch', url: '/people/:id', handler: Function },
  { method: 'delete', url: '/people/:id', handler: Function },
];
```

#### Controller

The `handler` function is the controller action that will be called when
the API route is called. The controller is accessible from the `resource`
function call:

```javascript
const { routes, controller, service } = resource(Person, 'person');
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
