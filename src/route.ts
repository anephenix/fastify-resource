// Dependencies

import pluralize from "pluralize";
import type {
	Controller,
	CustomActionDefinition,
	ResourceOrResourcesList,
	ResourcesList,
	Route,
} from "./global.js";

function toSnakeCase(str: string): string {
	return str
		.replace(/([a-z])([A-Z])/g, "$1_$2") // Add an underscore between camelCase words
		.replace(/[\s-]+/g, "_") // Replace spaces and dashes with underscores
		.toLowerCase(); // Convert to lowercase
}

// types
type RouteType = "collection" | "member";

// Create the plural form of the resource name
function generateRoutePart(resource: string, type: RouteType, last = false) {
	if (type === "collection") return `/${pluralize(resource)}`;
	return `/${pluralize(resource)}/:${
		last ? "id" : `${toSnakeCase(resource)}_id`
	}`;
}

/*
	Returns the list of ":xxx_id" ancestor param names that a nested
	resource's member route carries - one per ancestor resource, in the same
	order they appear in the URL. A single (non-nested) resource has no
	ancestors, so this returns an empty array for it.

	Used to scope update/delete queries to the record's actual parent(s), so
	that e.g. PATCH /projects/1/items/:id can't be used to mutate an item
	that belongs to a different project.
*/
function getAncestorParamKeys(
	resourceOrResourceList: ResourceOrResourcesList,
): Array<string> {
	const resourceList = Array.isArray(resourceOrResourceList)
		? resourceOrResourceList
		: [resourceOrResourceList];
	return resourceList
		.slice(0, -1)
		.map((resource) => `${toSnakeCase(resource)}_id`);
}

/*
	Loops through the list of resources, and generates a route,
	depending on the type of route (collection or member)
*/
function generateRoute(resourceList: ResourcesList, finalType: RouteType) {
	return resourceList
		.map((resource, index) => {
			const isFinalItem = index === resourceList.length - 1;
			if (!isFinalItem) return generateRoutePart(resource, "member");
			return generateRoutePart(resource, finalType, isFinalItem);
		})
		.join("");
}

/*
    Generates a list of RESTful routes for a resource list and the controller 
    to link them to
*/
function resourceRoutes(
	resourceOrResourceList: ResourceOrResourcesList,
	controller: Controller,
	customActions?: Array<CustomActionDefinition>,
): Array<Route> {
	const resourceList = Array.isArray(resourceOrResourceList)
		? resourceOrResourceList
		: [resourceOrResourceList];
	const collectionUrl = generateRoute(resourceList, "collection");
	const memberUrl = generateRoute(resourceList, "member");

	const routes: Array<Route> = [
		{
			method: "get",
			url: collectionUrl,
			handler: controller.index,
			action: "index",
		},
		{
			method: "post",
			url: collectionUrl,
			handler: controller.create,
			action: "create",
		},
		{ method: "get", url: memberUrl, handler: controller.get, action: "get" },
		{
			method: "patch",
			url: memberUrl,
			handler: controller.update,
			action: "update",
		},
		{
			method: "delete",
			url: memberUrl,
			handler: controller.delete,
			action: "delete",
		},
	];

	if (customActions) {
		for (const { name, method, path, scope } of customActions) {
			const baseUrl = scope === "collection" ? collectionUrl : memberUrl;
			routes.push({
				method,
				url: `${baseUrl}/${path}`,
				handler: controller[name],
				action: name,
			});
		}
	}

	return routes;
}

export {
	generateRoute,
	generateRoutePart,
	getAncestorParamKeys,
	resourceRoutes,
};
