import type { Metadata } from "next";

const LOOM_EMBED_SRC =
	"https://www.loom.com/embed/9911c3e8e8674c79804dad7e5ad30bb2";

export const metadata: Metadata = {
	title: "Demo",
	description: "Recorded walkthrough of the application.",
};

export default function DemoPage() {
	return (
		<div className="mx-auto max-w-4xl">
			<h1 className="mb-2 text-2xl font-bold tracking-tight">Live demo</h1>
			<p className="mb-8 text-sm text-muted-foreground">
				Recorded walkthrough of the application.
			</p>
			<div
				className="relative w-full overflow-hidden rounded-lg border bg-muted/30"
				style={{ paddingBottom: "64.55089820359281%" }}
			>
				<iframe
					title="Application walkthrough"
					src={LOOM_EMBED_SRC}
					className="absolute inset-0 h-full w-full border-0"
					allowFullScreen
				/>
			</div>
		</div>
	);
}
