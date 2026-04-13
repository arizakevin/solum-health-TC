/** Stable key for one logical form field (section + name in extraction schema). */
export function extractionFieldGroupKey(section: string, fieldName: string) {
	return `${section}\0${fieldName}`;
}
