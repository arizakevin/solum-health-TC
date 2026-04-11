import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type {
	ExtractedField,
	ServiceRequestExtraction,
} from "@/lib/types/service-request";

const styles = StyleSheet.create({
	page: {
		padding: 40,
		fontSize: 9,
		fontFamily: "Helvetica",
	},
	title: {
		fontSize: 16,
		fontWeight: "bold",
		marginBottom: 4,
		textAlign: "center",
	},
	subtitle: {
		fontSize: 8,
		color: "#666",
		marginBottom: 16,
		textAlign: "center",
	},
	sectionTitle: {
		fontSize: 11,
		fontWeight: "bold",
		backgroundColor: "#f0f0f0",
		padding: 4,
		marginTop: 10,
		marginBottom: 4,
	},
	row: {
		flexDirection: "row",
		borderBottom: "0.5pt solid #ddd",
		paddingVertical: 2,
	},
	label: {
		width: "35%",
		fontWeight: "bold",
		color: "#444",
		padding: 2,
	},
	value: {
		width: "65%",
		padding: 2,
	},
	footer: {
		position: "absolute",
		bottom: 20,
		left: 40,
		right: 40,
		fontSize: 7,
		color: "#999",
		textAlign: "center",
	},
});

function FieldRow({ label, field }: { label: string; field?: ExtractedField }) {
	return (
		<View style={styles.row}>
			<Text style={styles.label}>{label}</Text>
			<Text style={styles.value}>{field?.value || "—"}</Text>
		</View>
	);
}

function ArrayFieldRows({
	label,
	fields,
}: {
	label: string;
	fields?: ExtractedField[];
}) {
	if (!fields || fields.length === 0) {
		return (
			<View style={styles.row}>
				<Text style={styles.label}>{label}</Text>
				<Text style={styles.value}>—</Text>
			</View>
		);
	}
	return (
		<View style={styles.row}>
			<Text style={styles.label}>{label}</Text>
			<Text style={styles.value}>{fields.map((f) => f.value).join(", ")}</Text>
		</View>
	);
}

interface Props {
	data: ServiceRequestExtraction;
	caseId: string;
}

export function ServiceRequestPdf({ data, caseId }: Props) {
	return (
		<Document>
			<Page size="A4" style={styles.page}>
				<Text style={styles.title}>Service Request Form</Text>
				<Text style={styles.subtitle}>
					Case #{caseId.slice(0, 8)} · Generated{" "}
					{new Date().toLocaleDateString("en-US")}
				</Text>

				<View style={styles.sectionTitle}>
					<Text>Header</Text>
				</View>
				<FieldRow label="Payer" field={data.header?.payer} />
				<FieldRow label="Date of Request" field={data.header?.dateOfRequest} />
				<FieldRow label="Payer Fax" field={data.header?.payerFax} />
				<FieldRow label="Payer Phone" field={data.header?.payerPhone} />

				<View style={styles.sectionTitle}>
					<Text>A — Member Information</Text>
				</View>
				<FieldRow label="Name" field={data.sectionA?.name} />
				<FieldRow label="Date of Birth" field={data.sectionA?.dob} />
				<FieldRow label="Gender" field={data.sectionA?.gender} />
				<FieldRow label="Member ID" field={data.sectionA?.memberId} />
				<FieldRow label="Group Number" field={data.sectionA?.groupNumber} />
				<FieldRow label="Phone" field={data.sectionA?.phone} />
				<FieldRow label="Address" field={data.sectionA?.address} />

				<View style={styles.sectionTitle}>
					<Text>B — Requesting Provider</Text>
				</View>
				<FieldRow label="Name" field={data.sectionB?.name} />
				<FieldRow label="NPI" field={data.sectionB?.npi} />
				<FieldRow label="Facility" field={data.sectionB?.facility} />
				<FieldRow label="Tax ID" field={data.sectionB?.taxId} />
				<FieldRow label="Phone" field={data.sectionB?.phone} />
				<FieldRow label="Fax" field={data.sectionB?.fax} />
				<FieldRow label="Address" field={data.sectionB?.address} />

				<View style={styles.sectionTitle}>
					<Text>C — Referring Provider</Text>
				</View>
				<FieldRow label="Name" field={data.sectionC?.name} />
				<FieldRow label="NPI" field={data.sectionC?.npi} />
				<FieldRow label="Phone" field={data.sectionC?.phone} />

				<View style={styles.sectionTitle}>
					<Text>D — Service Information</Text>
				</View>
				<FieldRow label="Service Type" field={data.sectionD?.serviceType} />
				<FieldRow
					label="Service Setting"
					field={data.sectionD?.serviceSetting}
				/>
				<ArrayFieldRows label="CPT Codes" fields={data.sectionD?.cptCodes} />
				<ArrayFieldRows
					label="ICD-10 Codes"
					fields={data.sectionD?.icd10Codes}
				/>
				<ArrayFieldRows
					label="Diagnoses"
					fields={data.sectionD?.diagnosisDescriptions}
				/>
				<FieldRow label="Start Date" field={data.sectionD?.startDate} />
				<FieldRow label="End Date" field={data.sectionD?.endDate} />
				<FieldRow label="Sessions" field={data.sectionD?.sessions} />
				<FieldRow label="Frequency" field={data.sectionD?.frequency} />

				<View style={styles.sectionTitle}>
					<Text>E — Clinical Information</Text>
				</View>
				<FieldRow label="Symptoms" field={data.sectionE?.symptoms} />
				<FieldRow
					label="Clinical History"
					field={data.sectionE?.clinicalHistory}
				/>
				<ArrayFieldRows
					label="Medications"
					fields={data.sectionE?.medications}
				/>
				<ArrayFieldRows
					label="Assessment Scores"
					fields={data.sectionE?.assessmentScores}
				/>
				<FieldRow
					label="Treatment Goals"
					field={data.sectionE?.treatmentGoals}
				/>

				<View style={styles.sectionTitle}>
					<Text>F — Justification</Text>
				</View>
				<FieldRow
					label="Medical Necessity"
					field={data.sectionF?.medicalNecessity}
				/>
				<FieldRow label="Risk if Denied" field={data.sectionF?.riskIfDenied} />

				<View style={styles.sectionTitle}>
					<Text>G — Attestation</Text>
				</View>
				<FieldRow
					label="Provider Signature"
					field={data.sectionG?.providerSignature}
				/>
				<FieldRow label="Printed Name" field={data.sectionG?.printedName} />
				<FieldRow label="Date" field={data.sectionG?.date} />
				<FieldRow label="License Number" field={data.sectionG?.licenseNumber} />

				<Text style={styles.footer}>
					Generated by Solum Health · AI-Assisted Service Request Processing
				</Text>
			</Page>
		</Document>
	);
}
