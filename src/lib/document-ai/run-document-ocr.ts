import { getDocumentAiSettings } from "./config";

let _client: InstanceType<
	typeof import("@google-cloud/documentai").v1.DocumentProcessorServiceClient
> | null = null;

async function getClient() {
	if (!_client) {
		const { v1 } = await import("@google-cloud/documentai");
		const settings = getDocumentAiSettings();
		if (!settings) throw new Error("Document AI not configured");

		_client = new v1.DocumentProcessorServiceClient({
			keyFilename: settings.credentialsPath,
		});
	}
	return _client;
}

/**
 * Sends a document buffer to Google Cloud Document AI OCR and returns the
 * extracted plain text. Returns `null` on any failure so the caller can
 * fall back to Gemini-only extraction without blocking.
 */
export async function runDocumentOcr(
	buffer: Buffer,
	mimeType: string,
): Promise<string | null> {
	try {
		const settings = getDocumentAiSettings();
		if (!settings) return null;

		const client = await getClient();
		const name = client.processorPath(
			settings.projectId,
			settings.location,
			settings.processorId,
		);

		const [result] = await client.processDocument({
			name,
			rawDocument: {
				content: buffer.toString("base64"),
				mimeType,
			},
		});

		const text = result.document?.text;
		if (!text || text.trim().length === 0) return null;

		return text;
	} catch (error) {
		console.error(
			"[Document AI OCR] Processing failed (continuing without OCR):",
			error instanceof Error ? error.message : error,
		);
		return null;
	}
}
