export type TooltipPosition = "top" | "bottom" | "center";

export type TourAdvance = "manual" | "wait";

export interface TourStep {
	targetId: string;
	title: string;
	content: string;
	position: TooltipPosition;
	advance: TourAdvance;
	/** Centered card with no DOM anchor (finale only). */
	centered?: boolean;
	/** Centered intro card; not the finale (keeps Skip / no Done+Restart footer). */
	introCentered?: boolean;
}

/** Stable indices — keep in sync with `TUTORIAL_STEPS` order below. */
export const STEP_DASHBOARD = 0;
export const STEP_NEW_CASE = 1;
export const STEP_UPLOADS_INTRO = 2;
export const STEP_TRY_UPLOAD = 3;
export const STEP_EXTRACTION_SETTINGS = 4;
export const STEP_RUN_EXTRACT = 5;
export const STEP_FORM = 6;
export const STEP_CASE_REVIEW = 7;
export const STEP_APPROVE = 8;
export const STEP_GENERATED_PDF = 9;
export const STEP_FINALE = 10;

export const TUTORIAL_STEPS: TourStep[] = [
	{
		targetId: "",
		title: "Case dashboard",
		content:
			"Each row is a case with uploaded documents and extraction status. Press Next to continue.",
		position: "center",
		advance: "manual",
		introCentered: true,
	},
	{
		targetId: "btn-new-case",
		title: "New case",
		content: "Create a case and open it from here.",
		position: "bottom",
		advance: "wait",
	},
	{
		targetId: "",
		title: "This case view",
		content:
			"This screen has two main areas: Source Documents (uploads and extraction controls) and, below it, the request form where extracted values land. Next you will add a file, then review extraction options, then run extraction — press Next when you are ready.",
		position: "center",
		advance: "manual",
		introCentered: true,
	},
	{
		targetId: "tour-source-documents-body",
		title: "Try an upload",
		content:
			"Add at least one document here first. After it appears in the list, the tour covers optional extraction settings, then Run extraction.",
		position: "bottom",
		advance: "wait",
	},
	{
		targetId: "tour-tutorial-extraction-settings",
		title: "Extraction settings",
		content:
			"Open the gear when you want to tune how files are read and whether extraction runs automatically after uploads. Adjust toggles if you like, then press Next when you are ready for the Run extraction step.",
		position: "top",
		advance: "manual",
	},
	{
		targetId: "btn-case-extract",
		title: "Run extraction",
		content:
			"Start processing for the files in this case. You will see Extracting… while the job runs; when it finishes, values populate the request form, and the tour continues on its own.",
		position: "bottom",
		advance: "wait",
	},
	{
		targetId: "tour-tutorial-form-sections",
		title: "Request form (sections A–G)",
		content:
			"Sections A through G group the service request; open any section to review or edit fields after extraction.",
		position: "top",
		advance: "manual",
	},
	{
		targetId: "tour-case-review-first-source-doc",
		title: "Case review",
		content:
			"Click the highlighted row (your first source file) to open a preview beside the form. Other files behave the same way.",
		position: "bottom",
		advance: "wait",
	},
	{
		targetId: "tour-tutorial-approve-action",
		title: "Approve & generate PDF",
		content:
			"When the form looks right, click this button to generate the completed PDF.",
		position: "top",
		advance: "wait",
	},
	{
		targetId: "",
		title: "Generated output",
		content:
			"This screen shows your completed PDF in the viewer. Use Download or Print in the toolbar when you need a file or paper copy; Back to Case returns you to review, and Regenerate rebuilds the PDF if you changed the form. Press Next when you are ready to finish the tour.",
		position: "center",
		advance: "manual",
		introCentered: true,
	},
	{
		targetId: "",
		title: "Tour complete",
		content: "",
		position: "center",
		advance: "manual",
		centered: true,
	},
];

export const TUTORIAL_STEP_COUNT = TUTORIAL_STEPS.length;
