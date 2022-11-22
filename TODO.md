# TODO List

## Done

- [x] Add a way to create a whole resource
- [x] Add unit tests
- [x] Add documentation
- [x] husky hooks for precommit
- [x] GitHub action to run tests
- [x] Github Actions CI badge
- [x] Dependabot
- [x] CodeClimate quality badge
- [x] CodeClimate coverage badge
- [x] Version number badge

## Next

- [ ] Workout strategy for supporting request headers (e.g. bearer-token for authentication/authorization)
- [ ] Workout strategy for supporting preHandlers in fastify
- [ ] Workout strategy for supporting schema validation in fastify
- [ ] Workout strategy for custom API routes and controller/service actions to support that
- [ ] Workout strategy for implementing referential integrity on HTTP requests to nested resources
- [ ] Workout strategy for being able to map/transform params/body passed from controller action to service
- [ ] Workout strategy for abstracting Objection.js so that a Mongoose model for MongoDB could be used for example

## Nice to haves

- [ ] A CLI to generate the code in folders and files for you:

        models/
            Application.js
        controllers/
            application.js
        services/
            application.js
        routes/
            application.js
        index.js file

So that you don't have to write lines of code in those places, if you wish to support the custom strategy.
