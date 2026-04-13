/**
 * Compare user-saved vs AI-extracted values for correction detection.
 * Case-insensitive so reverting to the same text in different casing clears the flag.
 */
function normalize(value: string): string {
	return value.trim().toLowerCase();
}

/**
 * For scalar fields: compare single values directly.
 */
export function scalarDiffers(userValue: string, autoValue: string): boolean {
	return normalize(userValue) !== normalize(autoValue);
}

/**
 * For array fields: compare as unordered multisets so row insertion order
 * (random UUIDs) cannot cause false positives.
 */
export function arrayDiffers(
	userValues: string[],
	autoValues: string[],
): boolean {
	if (userValues.length !== autoValues.length) return true;
	const sortedUser = userValues.map(normalize).sort();
	const sortedAuto = autoValues.map(normalize).sort();
	return sortedUser.some((v, i) => v !== sortedAuto[i]);
}
