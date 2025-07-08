// Dependencies

import pluralize from "pluralize";
import type {
	Controller,
	ResourceOrResourcesList,
	ResourcesList,
	Route,
} from "./global";

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
): Array<Route> {
	const resourceList = Array.isArray(resourceOrResourceList)
		? resourceOrResourceList
		: [resourceOrResourceList];
	const collectionUrl = generateRoute(resourceList, "collection");
	const memberUrl = generateRoute(resourceList, "member");

	return [
		{ method: "get", url: collectionUrl, handler: controller.index },
		{ method: "post", url: collectionUrl, handler: controller.create },
		{ method: "get", url: memberUrl, handler: controller.get },
		{ method: "patch", url: memberUrl, handler: controller.update },
		{
			method: "delete",
			url: memberUrl,
			handler: controller.delete,
		},
	];
}

export { resourceRoutes, generateRoute, generateRoutePart };
