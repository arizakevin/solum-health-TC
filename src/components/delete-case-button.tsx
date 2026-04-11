"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { deleteCase } from "@/app/actions/cases";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type DeleteCaseButtonProps = {
	caseId: string;
	caseDisplayId: string;
	variant: "link" | "button";
	className?: string;
	redirectHome?: boolean;
};

export function DeleteCaseButton({
	caseId,
	caseDisplayId,
	variant,
	className,
	redirectHome = false,
}: DeleteCaseButtonProps) {
	const router = useRouter();
	const [open, setOpen] = useState(false);
	const [pending, setPending] = useState(false);

	async function handleConfirm() {
		setPending(true);
		try {
			await deleteCase(caseId);
			setOpen(false);
			if (redirectHome) {
				router.push("/");
			}
			router.refresh();
			toast.success("Case deleted");
		} catch (err) {
			const message =
				err instanceof Error ? err.message : "Could not delete this case";
			toast.error(message);
		} finally {
			setPending(false);
		}
	}

	return (
		<>
			{variant === "link" ? (
				<button
					type="button"
					onClick={() => setOpen(true)}
					className={cn(
						"text-sm font-medium text-destructive underline-offset-4 hover:underline",
						className,
					)}
				>
					Delete
				</button>
			) : (
				<Button
					type="button"
					variant="outline"
					className={cn(
						"border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive",
						className,
					)}
					onClick={() => setOpen(true)}
				>
					<Trash2 className="mr-2 h-4 w-4" />
					Delete case
				</Button>
			)}

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-md" showCloseButton>
					<DialogHeader>
						<DialogTitle>Delete this case?</DialogTitle>
						<DialogDescription className="space-y-2">
							<span className="block">
								This will permanently delete case{" "}
								<span className="font-medium text-foreground">
									{caseDisplayId}
								</span>
								, including all uploaded documents, extracted fields, and draft
								data. This cannot be undone.
							</span>
						</DialogDescription>
					</DialogHeader>
					<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
						<DialogClose render={<Button variant="outline" type="button" />}>
							Cancel
						</DialogClose>
						<Button
							type="button"
							variant="destructive"
							disabled={pending}
							onClick={handleConfirm}
						>
							{pending ? "Deleting..." : "Delete permanently"}
						</Button>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
