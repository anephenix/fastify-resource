// Dependencies
import pluralize from "pluralize";

export type ResourceNames = {
	className: string;
	fileBase: string;
	urlPath: string;
	tableName: string;
};

function splitIntoWords(input: string): Array<string> {
	const withSpaces = input
		.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
		.replace(/[_\-\s]+/g, " ")
		.trim();
	return withSpaces
		.split(" ")
		.filter(Boolean)
		.map((word) => word.toLowerCase());
}

function capitalize(word: string): string {
	return word.charAt(0).toUpperCase() + word.slice(1);
}

function lowerFirst(word: string): string {
	return word.charAt(0).toLowerCase() + word.slice(1);
}

/*
  Derives the names needed by the scaffold templates from a raw resource
  name given on the command line, e.g. "application", "Applications" and
  "blog_post" all resolve to a consistent set of names. The input is
  singularized (on its last word, for compound names) so that a plural
  argument like "applications" behaves the same as the singular form.
*/
export function deriveResourceNames(input: string): ResourceNames {
	const words = splitIntoWords(input);
	if (words.length === 0) {
		throw new Error("A resource name is required");
	}
	const lastIndex = words.length - 1;
	words[lastIndex] = pluralize.singular(words[lastIndex]);

	const className = words.map(capitalize).join("");
	const fileBase = lowerFirst(className);
	const urlPath = pluralize(fileBase);
	const tableName = urlPath;

	return { className, fileBase, urlPath, tableName };
}
