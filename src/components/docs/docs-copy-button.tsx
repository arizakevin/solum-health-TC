"use client";

import { Check, Copy } from "lucide-react";
import * as React from "react";
import { Button } from "@/components/ui/button";

interface DocsCopyButtonProps {
	content: string;
}

export function DocsCopyButton({ content }: DocsCopyButtonProps) {
	const [hasCopied, setHasCopied] = React.useState(false);

	const copyToClipboard = React.useCallback(() => {
		navigator.clipboard.writeText(content).then(() => {
			setHasCopied(true);
			setTimeout(() => setHasCopied(false), 2000);
		});
	}, [content]);

	return (
		<Button
			variant="outline"
			size="sm"
			onClick={copyToClipboard}
			className="h-7 gap-1.5 px-2.5 text-[11px]"
		>
			{hasCopied ? (
				<Check className="size-3" aria-hidden="true" />
			) : (
				<Copy className="size-3" aria-hidden="true" />
			)}
			{hasCopied ? "Copied" : "Copy Content"}
		</Button>
	);
}
