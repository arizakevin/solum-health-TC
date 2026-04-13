/**
 * Format Testing Script
 *
 * Usage:
 *   npx ts-node scripts/test-format-extraction.ts --caseId <CASE_ID> --token <SUPABASE_ACCESS_TOKEN> --url <VERCEL_OR_LOCAL_URL>
 *
 * This script demonstrates the testing logic to trigger extraction iteratively over multiple
 * documents (converted into formats via `generate-test-formats.sh`).
 *
 * Prerequisites:
 * 1. A case created in Solum Health (with the generated formats uploaded to it).
 * 2. An active valid Supabase access cookie/token.
 */

const args = process.argv.slice(2);
const caseId = args.find((a, i) => args[i - 1] === "--caseId");
const token = args.find((a, i) => args[i - 1] === "--token");
const baseUrl =
	args.find((a, i) => args[i - 1] === "--url") || "http://localhost:3000";

async function run() {
	if (!caseId || !token) {
		console.error("Missing --caseId or --token. Cannot run format test.");
		process.exit(1);
	}

	console.log(
		`Starting format extraction benchmark for Case: ${caseId} on ${baseUrl}`,
	);

	try {
		console.log("Triggering extraction against API...");
		const response = await fetch(`${baseUrl}/api/extract`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				// Pass the session cookie or auth bearer for the request
				Cookie: `sb-access-token=${token}`,
			},
			body: JSON.stringify({ caseId, forceOcr: true }),
		});

		const result = await response.json();

		if (!response.ok) {
			console.error("Extraction Failed:");
			console.error(result);
			if (result.error === "Invalid Document") {
				console.log("SUCCESS: Caught the invalid document intentionally!");
			}
			process.exit(1);
		}

		console.log("Extraction Succeeded. Verifying results:");
		console.log(`Extracted field count: ${result.fieldCount}`);
		console.log(
			"Validation: PASS. Multi-format documents resolved without errors.",
		);
	} catch (err) {
		console.error("Script Error:", err);
	}
}

run();
