"use client";

import { MessageCircle, Send, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { type ChatMessage, useAnnieChat } from "@/hooks/use-annie-chat";
import { APP_ASSISTANT_NAME, APP_ASSISTANT_SUBTITLE } from "@/lib/brand";
import { useUIStore } from "@/stores/ui-store";

function MessageBubble({ message }: { message: ChatMessage }) {
	const isUser = message.role === "user";
	return (
		<div
			className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"} mb-3`}
		>
			{!isUser && (
				<Avatar className="h-7 w-7 shrink-0">
					<AvatarImage src="/annie-avatar.webp" alt={APP_ASSISTANT_NAME} />
					<AvatarFallback className="text-xs">A</AvatarFallback>
				</Avatar>
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
				<MessageCircle className="h-5 w-5" />
			</SheetTrigger>

			<SheetContent
				side="right"
				className="flex w-[400px] flex-col p-0 sm:w-[440px]"
			>
				<SheetHeader className="border-b px-4 py-3">
					<div className="flex items-center gap-3">
						<Avatar className="h-9 w-9">
							<AvatarImage src="/annie-avatar.webp" alt={APP_ASSISTANT_NAME} />
							<AvatarFallback>A</AvatarFallback>
						</Avatar>
						<div>
							<SheetTitle className="text-sm">{APP_ASSISTANT_NAME}</SheetTitle>
							<SheetDescription className="text-xs">
								{APP_ASSISTANT_SUBTITLE}
							</SheetDescription>
						</div>
						{messages.length > 0 && (
							<Button
								variant="ghost"
								size="icon-xs"
								className="ml-auto"
								onClick={clearMessages}
							>
								<Trash2 className="h-3.5 w-3.5" />
							</Button>
						)}
					</div>
				</SheetHeader>

				<ScrollArea className="flex-1 p-4" ref={scrollRef}>
					{messages.length === 0 ? (
						<div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
							<Avatar className="mb-3 h-16 w-16">
								<AvatarImage
									src="/annie-avatar.webp"
									alt={APP_ASSISTANT_NAME}
								/>
								<AvatarFallback>A</AvatarFallback>
							</Avatar>
							<p className="text-sm font-medium">
								Hi! I&apos;m {APP_ASSISTANT_NAME}.
							</p>
							<p className="mt-1 text-xs">
								Ask me about service requests, medical coding, or prior
								authorization workflows.
							</p>
							{caseId && (
								<p className="mt-2 rounded-md bg-muted px-2 py-1 text-xs">
									Case #{caseId.slice(0, 8)} loaded as context
								</p>
							)}
						</div>
					) : (
						messages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
					)}
				</ScrollArea>

				<form onSubmit={handleSubmit} className="border-t px-4 py-3">
					<div className="flex gap-2">
						<Input
							value={input}
							onChange={(e) => setInput(e.target.value)}
							placeholder="Ask Annie..."
							disabled={isLoading}
							className="h-9 text-sm"
						/>
						<Button
							type="submit"
							size="icon"
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
