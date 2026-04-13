"use client";

import { useCallback, useRef, useState } from "react";

export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
	isStreaming?: boolean;
}

export function useAnnieChat(caseId?: string) {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const abortRef = useRef<AbortController | null>(null);
	const messagesRef = useRef<ChatMessage[]>([]);

	messagesRef.current = messages;

	const sendMessage = useCallback(
		async (content: string) => {
			const userMsg: ChatMessage = {
				id: `user-${Date.now()}`,
				role: "user",
				content,
			};

			const assistantMsg: ChatMessage = {
				id: `assistant-${Date.now()}`,
				role: "assistant",
				content: "",
				isStreaming: true,
			};

			setMessages((prev) => [...prev, userMsg, assistantMsg]);
			setIsLoading(true);

			abortRef.current = new AbortController();

			try {
				const allMessages = [
					...messagesRef.current.map((m) => ({
						role: m.role,
						content: m.content,
					})),
					{ role: "user" as const, content },
				];

				const response = await fetch("/api/assistant", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ messages: allMessages, caseId }),
					signal: abortRef.current.signal,
				});

				if (!response.ok) {
					throw new Error("Assistant request failed");
				}

				const reader = response.body?.getReader();
				if (!reader) throw new Error("No response body");

				const decoder = new TextDecoder();
				let accumulated = "";

				while (true) {
					const { done, value } = await reader.read();
					if (done) break;

					const chunk = decoder.decode(value, { stream: true });
					const lines = chunk.split("\n");

					for (const line of lines) {
						if (line.startsWith("data: ")) {
							const data = line.slice(6);
							if (data === "[DONE]") break;
							try {
								const parsed = JSON.parse(data) as {
									text?: string;
									error?: string;
								};
								if (parsed.error) {
									accumulated = parsed.error;
									setMessages((prev) =>
										prev.map((m) =>
											m.id === assistantMsg.id
												? { ...m, content: accumulated }
												: m,
										),
									);
									break;
								}
								if (parsed.text) {
									accumulated += parsed.text;
									setMessages((prev) =>
										prev.map((m) =>
											m.id === assistantMsg.id
												? { ...m, content: accumulated }
												: m,
										),
									);
								}
							} catch {
								// skip unparseable chunks
							}
						}
					}
				}

				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantMsg.id ? { ...m, isStreaming: false } : m,
					),
				);
			} catch (err) {
				if ((err as Error).name === "AbortError") return;

				setMessages((prev) =>
					prev.map((m) =>
						m.id === assistantMsg.id
							? {
									...m,
									content:
										m.content ||
										"Sorry, I encountered an error. Please try again.",
									isStreaming: false,
								}
							: m,
					),
				);
			} finally {
				setIsLoading(false);
				abortRef.current = null;
			}
		},
		[caseId],
	);

	const clearMessages = useCallback(() => {
		abortRef.current?.abort();
		setMessages([]);
	}, []);

	return { messages, isLoading, sendMessage, clearMessages };
}
