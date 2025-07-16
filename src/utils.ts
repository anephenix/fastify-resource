export const objectWithoutKey = (
	object: Record<string, unknown>,
	key: string,
) => {
	const { [key]: _, ...otherKeys } = object;
	return otherKeys;
};
