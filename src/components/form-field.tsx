"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import {
	type Confidence,
	confidenceDotColor,
} from "@/lib/types/service-request";

interface FormFieldProps {
	label: string;
	value: string;
	confidence: Confidence;
	source?: string;
	onChange: (newValue: string) => void;
}

export function FormField({
	label,
	value,
	confidence,
	source,
	onChange,
}: FormFieldProps) {
	const [isEditing, setIsEditing] = useState(false);
	const isEmpty = !value || value.trim() === "";

	return (
		<div className="group space-y-1">
			<div className="flex items-center gap-2">
				<Label className="text-xs font-medium text-muted-foreground">
					{label}
				</Label>
				<Tooltip>
					<TooltipTrigger>
						<span
							className={`inline-block h-2 w-2 rounded-full ${confidenceDotColor(confidence)}`}
						/>
					</TooltipTrigger>
					<TooltipContent side="top">
						<p className="capitalize">{confidence} confidence</p>
						{source && (
							<p className="text-xs text-muted-foreground">{source}</p>
						)}
					</TooltipContent>
				</Tooltip>
				{isEmpty && (
					<span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-700">
						Missing
					</span>
				)}
			</div>

			{isEditing ? (
				<Input
					value={value}
					onChange={(e) => onChange(e.target.value)}
					onBlur={() => setIsEditing(false)}
					autoFocus
					className="h-8 text-sm"
				/>
			) : (
				<button
					type="button"
					onClick={() => setIsEditing(true)}
					className="w-full cursor-text rounded-md border border-transparent px-2 py-1 text-left text-sm transition-colors hover:border-border hover:bg-muted/50"
				>
					{isEmpty ? (
						<span className="italic text-muted-foreground">Click to add</span>
					) : (
						value
					)}
				</button>
			)}
		</div>
	);
}
