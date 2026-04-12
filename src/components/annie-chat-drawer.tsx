"use client";

import { Send, Trash2, XIcon } from "lucide-react";
import Image from "next/image";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	Sheet,
	SheetClose,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { type ChatMessage, useAnnieChat } from "@/hooks/use-annie-chat";
import {
	APP_ASSISTANT_AVATAR_SRC,
	APP_ASSISTANT_NAME,
	APP_ASSISTANT_SUBTITLE,
} from "@/lib/brand";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/ui-store";

/** Avoids Base UI `AvatarImage`, which preloads with `new Image()` and can leave the root stuck on fallback while the same URL works in the real image. */
function AnnieAvatar({
	className,
	fallbackTextClassName = "text-sm",
}: {
	className?: string;
	fallbackTextClassName?: string;
}) {
	const [broken, setBroken] = useState(false);
	const initial = APP_ASSISTANT_NAME.charAt(0).toUpperCase();

	if (broken) {
		return (
			<span
				className={cn(
					"relative flex shrink-0 select-none items-center justify-center rounded-full bg-muted text-muted-foreground after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten",
					className,
				)}
			>
				<span className={cn("font-medium", fallbackTextClassName)}>
					{initial}
				</span>
			</span>
		);
	}

	return (
		<span
			className={cn(
				"relative flex shrink-0 select-none overflow-hidden rounded-full after:pointer-events-none after:absolute after:inset-0 after:rounded-full after:border after:border-border after:mix-blend-darken dark:after:mix-blend-lighten",
				className,
			)}
		>
			<Image
				src={APP_ASSISTANT_AVATAR_SRC}
				alt={APP_ASSISTANT_NAME}
				width={96}
				height={96}
				unoptimized
				className="aspect-square size-full object-cover"
				onError={() => setBroken(true)}
			/>
		</span>
	);
}

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	return (
		<div
			className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} mb-3`}
		>
			{!isUser && (
				<AnnieAvatar className="h-7 w-7" fallbackTextClassName="text-xs" />
			)}
			<div
				className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
					isUser
						? "bg-primary text-primary-foreground"
						: "bg-muted text-foreground"
				}`}
			>
				<p className="whitespace-pre-wrap">{message.content}</p>
				{message.isStreaming && (
					<span className="ml-1 inline-block h-2 w-2 animate-pulse rounded-full bg-current" />
				)}
			</div>
		</div>
	);
}

export function AnnieChatDrawer() {
	const { annieDrawerOpen, setAnnieDrawerOpen } = useUIStore();
	const params = useParams<{ id?: string }>();
	const caseId = params?.id;
	const { messages, isLoading, sendMessage, clearMessages } =
		useAnnieChat(caseId);
	const [input, setInput] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);

	// biome-ignore lint/correctness/useExhaustiveDependencies: scroll on message changes
	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages]);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		const trimmed = input.trim();
		if (!trimmed || isLoading) return;
		setInput("");
		sendMessage(trimmed);
	}

	return (
		<Sheet open={annieDrawerOpen} onOpenChange={setAnnieDrawerOpen}>
			<SheetTrigger className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105">
				<svg
					xmlns="http://www.w3.org/2000/svg"
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="currentColor"
					aria-hidden="true"
				>
					<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
				</svg>
			</SheetTrigger>

			<SheetContent
				side="right"
				showCloseButton={false}
				className="!w-full flex h-full max-h-dvh min-h-0 flex-col gap-0 overflow-hidden p-0 sm:!w-[400px] sm:!max-w-[calc(100vw-2rem)]"
			>
				<SheetHeader className="shrink-0 space-y-0 border-b p-0">
					<div className="flex items-start gap-3 px-4 py-3">
						<AnnieAvatar className="mt-0.5 h-9 w-9 shrink-0" />
						<div className="min-w-0 flex-1">
							<SheetTitle className="text-sm leading-tight">
								{APP_ASSISTANT_NAME}
							</SheetTitle>
							<SheetDescription className="text-xs leading-snug text-balance">
								{APP_ASSISTANT_SUBTITLE}
							</SheetDescription>
						</div>
						<div className="flex shrink-0 items-center gap-0.5 self-start">
							{messages.length > 0 && (
								<Button
									type="button"
									variant="ghost"
									size="icon-sm"
									onClick={clearMessages}
									title="Clear chat"
								>
									<Trash2 />
								</Button>
							)}
							<SheetClose
								render={
									<Button variant="ghost" size="icon-sm" title="Close panel" />
								}
							>
								<XIcon />
								<span className="sr-only">Close</span>
							</SheetClose>
						</div>
					</div>
				</SheetHeader>

				<div
					ref={scrollRef}
					className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden overscroll-contain p-4"
				>
					{messages.length === 0 ? (
						<div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
							<AnnieAvatar className="h-16 w-16 shrink-0" />
							<div className="max-w-sm space-y-1">
								<p className="text-sm font-medium">
									Hi! I&apos;m {APP_ASSISTANT_NAME}.
								</p>
								<p className="text-xs leading-relaxed">
									Ask me about service requests, medical coding, or prior
									authorization workflows.
								</p>
							</div>
							{caseId && (
								<p className="rounded-md bg-muted px-2 py-1 text-xs">
									Case #{caseId.slice(0, 8)} loaded as context
								</p>
							)}
						</div>
					) : (
						messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
					)}
				</div>

				<form onSubmit={handleSubmit} className="shrink-0 border-t px-4 py-3">
					<div className="flex items-center gap-2">
						<Input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Ask Annie..."
							disabled={isLoading}
							className="h-9 min-w-0 flex-1 text-sm"
						/>
						<Button
							type="submit"
							size="icon"
							className="h-9 w-9 shrink-0"
							disabled={isLoading || !input.trim()}
						>
							<Send className="h-4 w-4" />
						</Button>
					</div>
				</form>
			</SheetContent>
		</Sheet>
	);
}
