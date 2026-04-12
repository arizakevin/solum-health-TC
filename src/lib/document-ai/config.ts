interface DocumentAiSettings {
	projectId: string;
	location: string;
	processorId: string;
	credentials: { client_email: string; private_key: string };
}

export function isDocumentAiConfigured(): boolean {
	return !!(
		process.env.GOOGLE_CLOUD_PROJECT_ID &&
		process.env.GOOGLE_CLOUD_LOCATION &&
		process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID &&
		process.env.GCP_CLIENT_EMAIL &&
		process.env.GCP_PRIVATE_KEY
	);
}

export function getDocumentAiSettings(): DocumentAiSettings | null {
	const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
	const location = process.env.GOOGLE_CLOUD_LOCATION;
	const processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID;
	const clientEmail = process.env.GCP_CLIENT_EMAIL;
	const privateKey = process.env.GCP_PRIVATE_KEY;

	if (!projectId || !location || !processorId || !clientEmail || !privateKey)
		return null;

	return {
		projectId,
		location,
		processorId,
		credentials: {
			client_email: clientEmail,
			private_key: privateKey.replace(/\\n/g, "\n"),
		},
	};
}
