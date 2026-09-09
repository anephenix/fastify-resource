export const objectWithoutKey = (
	object: Record<string, unknown>,
	key: string,
) => {
	const { [key]: _, ...otherKeys } = object;
	return otherKeys;
};

export const pickKeys = (
	object: Record<string, unknown>,
	keys: Array<string>,
): Record<string, unknown> => {
	const picked: Record<string, unknown> = {};
	for (const key of keys) {
		if (key in object) picked[key] = object[key];
	}
	return picked;
};
