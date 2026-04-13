import { toJSONSchema } from "zod";
import { serviceRequestSchema } from "@/lib/types/service-request";

let cached: Record<string, unknown> | null = null;

/**
 * JSON Schema for the service request extraction object (OpenAI structured outputs).
 * Recursively sets `additionalProperties: false` on object schemas where supported.
 */
export function getServiceRequestExtractionJsonSchema(): Record<
	string,
	unknown
> {
	if (cached) return cached;
	const payload = toJSONSchema(serviceRequestSchema, {
		target: "draft-07",
		io: "output",
	}) as unknown;
	const p = payload as Record<string, unknown> | null;
	const raw =
		p && typeof p === "object" && "jsonSchema" in p && p.jsonSchema != null
			? p.jsonSchema
			: payload;
	const base = { ...(raw as Record<string, unknown>) };
	delete base.$schema;
	cached = withAdditionalPropertiesFalse(base) as Record<string, unknown>;
	return cached;
}

function withAdditionalPropertiesFalse(node: unknown): unknown {
	if (node === null || typeof node !== "object") return node;
	if (Array.isArray(node)) return node.map(withAdditionalPropertiesFalse);

	const o = node as Record<string, unknown>;
	const out: Record<string, unknown> = { ...o };

	if (o.type === "object" && o.properties && typeof o.properties === "object") {
		out.additionalProperties = false;
		out.properties = Object.fromEntries(
			Object.entries(o.properties as Record<string, unknown>).map(([k, v]) => [
				k,
				withAdditionalPropertiesFalse(v),
			]),
		);
	}
	if (o.type === "array" && o.items !== undefined) {
		out.items = withAdditionalPropertiesFalse(o.items);
	}
	if (Array.isArray(o.anyOf)) {
		out.anyOf = o.anyOf.map(withAdditionalPropertiesFalse);
	}
	if (Array.isArray(o.oneOf)) {
		out.oneOf = o.oneOf.map(withAdditionalPropertiesFalse);
	}
	if (o.allOf && Array.isArray(o.allOf)) {
		out.allOf = o.allOf.map(withAdditionalPropertiesFalse);
	}
	return out;
}
