import { cn } from "@/lib/utils";

/** Pulse strip used by `loading.tsx` route skeletons under `app/(app)/`. */
export function PulseBlock({ className }: { className?: string }) {
	return (
		<div
			className={cn("animate-pulse rounded-md bg-muted", className)}
			aria-hidden
		/>
	);
}
