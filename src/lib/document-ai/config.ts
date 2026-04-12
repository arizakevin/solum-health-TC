import path from "node:path";

interface DocumentAiSettings {
	projectId: string;
	location: string;
	processorId: string;
	credentialsPath: string;
}

export function isDocumentAiConfigured(): boolean {
	return !!(
		process.env.GOOGLE_CLOUD_PROJECT_ID &&
		process.env.GOOGLE_CLOUD_LOCATION &&
		process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID &&
		process.env.GOOGLE_APPLICATION_CREDENTIALS
	);
}

export function getDocumentAiSettings(): DocumentAiSettings | null {
	const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
	const location = process.env.GOOGLE_CLOUD_LOCATION;
	const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;
	const credentialsRaw = process.env.GOOGLE_APPLICATION_CREDENTIALS;

	if (!projectId || !location || !processorId || !credentialsRaw) return null;

	const credentialsPath = path.isAbsolute(credentialsRaw)
		? credentialsRaw
		: path.join(process.cwd(), credentialsRaw);

	return { projectId, location, processorId, credentialsPath };
}
