import {
  Service,
  ServiceKey,
  ActionServiceMapping,
  Request,
  Reply,
  StatusCode,
  Controller,
  HandleResponseParams,
  ActionServiceMappingKey,
} from './global';

/*
	TODO - use the error object to return the correct HTTP status code

	- 400 for bad request
	- 404 for not found
	- 422 for unprocessable entity
	- 500 for internal server error
*/

const getCodeForError = (error: Error): StatusCode => {
  switch (error.message) {
    case 'Not found':
      return 404;
    default:
      return 400;
  }
};

const handleResponse = ({
  success,
  data,
  error,
  successCode,
  rep,
}: HandleResponseParams) => {
  if (success) {
    if (successCode) rep.code(successCode);
    return data;
  } else {
    rep.code(getCodeForError(error));
    return error.message;
  }
};

const actionServiceMapping: ActionServiceMapping = {
  index: 'getAll',
  create: 'create',
  get: 'get',
  update: 'update',
  delete: 'delete',
};

/*
  This looks like the part of the codebase that needs a kind of data-mapping
  configuration option.

  In most cases, the assumption is that the data being passed via params,
  but in the case of create/update actions it can also be passed via body.

  Also, when using a token-based authentication system, there is also the 
  aspect of receiving a bearer token via request headers.

  Therefore, there is a need to handle these requirements.

  Another aspect is that service always seems to inherit a resource's 
  properties as the params, which isn't necessarily a bad thing, but it makes
  it difficult to handle other metadata like authentication tokens as an 
  example.

  I therefore wonder if I need to restructure the code in such a way so that 
  it will support it (pass metadata alongside resource data).

  My gut feeling is that the resource name needs to be passed as an object, so
  for example say you create a blog post resource with a title and content,
  then the fields would be passed like this:

      { blogpost: { title: 'My blog post', content: 'Some content' } }

  Rather than the current setup:

      { title: 'My blog post', content: 'Some content' }

  This would then allow you to pass other data to the service action for 
  creating a blog post, such as an authentication token:

      {
        blogpost: { title: 'My blog post', content: 'Some content' },
        authtoken: '20fj23890dj012ej091j092j0'
      }

  The authtoken value can then be processed by the service action with a clean
  isolation from the data being passed for the blogpost object.

  We can then implement a middleware function that handles the authentication
  for the controller action (check token is valid, and check token owner has 
  the correct permission to perform the expected action on the resource).

  Ok, so plan of action

  - [ ] Restructure service actions so that they require data to be passed in
        a namespaced object in the params, so that other metadata can be passed
        cleanly in isolation.
  - [ ] Find a way to extract the expected resource name in singular/plural 
        contexts for the service action to use (e.g. creating a comment, then 
        the service action needs to use the comment namespace for the object).
  - [ ] Find a way to perform data structuring in the controller actions so 
        that it passes the data for a resource in a namespaced structure, but 
        also that auth tokens passed in the request header can also be mapped 
        to its own namespace in the data passed to the service action. 

  Question - if the namespace principle is applied to the data structure of the
  params passed to the request, should it also be applied to the response as 
  well?

  For example, if I make a request to create a blog post, should the response be
  structured in the same way?

  e.g.

  Request: 

  {
    blogpost: { title: 'My blog post', content: 'Some content' }
    authtoken: '20fj23890dj012ej091j092j0'
  }

  Response: 
  
  {
    success: true,
    data: {
      blogpost: {
        id: 'd923d0j20jd02j',
        title: 'My blog post',
        content: 'Some content'
      }
    }
  }

  I am thinking that it should, because then there is no ambiguity about what 
  data is belonging to which resource/metadata.

*/
const getParams = (action: ActionServiceMappingKey, req: Request) => {
  const actionsWithBody = ['create', 'update'];
  if (actionsWithBody.includes(action)) {
    return Object.assign({}, req.params, req.body);
  }
  return req.params;
};

const getResponseData = (
  action: ActionServiceMappingKey,
  { success, data, error, rep }: HandleResponseParams
): HandleResponseParams => {
  if (action === 'create') {
    return { success, data, error, rep, successCode: 201 };
  }
  return { success, data, error, rep };
};

const generateAction = (action: ActionServiceMappingKey, service: Service) => {
  return async (req: Request, rep: Reply) => {
    const params = getParams(action, req);
    const method: ServiceKey = actionServiceMapping[action];
    const { success, data, error } = await service[method](params);
    const responseData = getResponseData(action, { success, data, error, rep });
    return handleResponse(responseData);
  };
};

const controllerGenerator = (service: Service) => {
  const actions = Object.keys(
    actionServiceMapping
  ) as ActionServiceMappingKey[];
  const actionSetup = (action: ActionServiceMappingKey) => {
    return [action, generateAction(action, service)];
  };
  const array = actions.map(actionSetup);
  const controller: Controller = Object.fromEntries(array);
  return controller;
};

export default controllerGenerator;
