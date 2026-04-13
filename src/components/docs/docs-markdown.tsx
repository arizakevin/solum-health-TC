"use client";

import Link from "next/link";
import {
	Children,
	type ComponentProps,
	isValidElement,
	type ReactNode,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { MermaidDiagram } from "@/components/docs/mermaid-diagram";
import { docRelPathToHref } from "@/lib/docs/doc-href";
import { posixDirname, posixJoin } from "@/lib/docs/posix-path";

type DocsMarkdownProps = {
	content: string;
	docRelFromDocs: string;
};

function mediaUrl(src: string, docRelFromDocs: string): string {
	if (/^https?:\/\//i.test(src)) {
		return src;
	}
	const rel = posixJoin(posixDirname(docRelFromDocs), src);
	return `/api/docs-media/${rel.split("/").map(encodeURIComponent).join("/")}`;
}

function splitPathAndHash(href: string): { pathPart: string; hash: string } {
	const i = href.indexOf("#");
	if (i === -1) {
		return { pathPart: href, hash: "" };
	}
	return { pathPart: href.slice(0, i), hash: href.slice(i) };
}

function internalDocHref(rawHref: string, docRelFromDocs: string): string {
	const { pathPart, hash } = splitPathAndHash(rawHref);
	if (pathPart === "") {
		return hash || "#";
	}
	if (pathPart.startsWith("/docs")) {
		return `${pathPart}${hash}`;
	}
	if (/^https?:\/\//i.test(pathPart)) {
		return rawHref;
	}
	const resolved = posixJoin(posixDirname(docRelFromDocs), pathPart);
	let asMd = resolved;
	if (!asMd.endsWith(".md")) {
		asMd = `${resolved}.md`;
	}
	return `${docRelPathToHref(asMd)}${hash}`;
}

function fencedCodeLanguage(className: string | undefined): string | undefined {
	const match = /language-(\w+)/.exec(className ?? "");
	return match?.[1];
}

const MERMAID_WRAP =
	"my-4 overflow-x-auto rounded-lg border border-border bg-muted/50 p-4";

const MD_CLASS =
	"docs-md max-w-none text-sm leading-relaxed [&_h1]:mb-4 [&_h1]:scroll-mt-20 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:tracking-tight [&_h2]:mb-3 [&_h2]:mt-8 [&_h2]:scroll-mt-20 [&_h2]:border-b [&_h2]:border-border [&_h2]:pb-2 [&_h2]:text-xl [&_h2]:font-semibold [&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:scroll-mt-20 [&_h3]:text-lg [&_h3]:font-semibold [&_h4]:mt-4 [&_h4]:font-semibold [&_p]:my-3 [&_p]:text-foreground/90 [&_a]:text-primary [&_a]:underline-offset-2 hover:[&_a]:underline [&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6 [&_li]:my-1 [&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-muted-foreground/40 [&_blockquote]:pl-4 [&_blockquote]:text-muted-foreground [&_code]:rounded-md [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[13px] [&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:border [&_pre]:bg-muted/50 [&_pre]:p-4 [&_pre]:font-mono [&_pre]:text-[13px] [&_table]:my-4 [&_table]:w-full [&_table]:border-collapse [&_table]:text-sm [&_th]:border [&_th]:bg-muted/60 [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_td]:border [&_td]:px-3 [&_td]:py-2 [&_img]:my-4 [&_img]:max-h-[min(70vh,720px)] [&_img]:max-w-full [&_img]:rounded-md [&_img]:border [&_hr]:my-8 [&_hr]:border-border";

export function DocsMarkdown({ content, docRelFromDocs }: DocsMarkdownProps) {
	return (
		<div className={MD_CLASS}>
			<ReactMarkdown
				remarkPlugins={[remarkGfm]}
				components={{
					pre({ children }: ComponentProps<"pre">): ReactNode {
						try {
							const only = Children.only(children);
							if (isValidElement(only) && only.type === MermaidDiagram) {
								return <div className={MERMAID_WRAP}>{only}</div>;
							}
						} catch {
							/* multiple children — normal <pre> */
						}
						return <pre>{children}</pre>;
					},
					code({ className, children }: ComponentProps<"code">): ReactNode {
						if (fencedCodeLanguage(className) === "mermaid") {
							const text = String(children).replace(/\n$/, "");
							return <MermaidDiagram source={text} />;
						}
						return <code className={className}>{children}</code>;
					},
					a({ href, children }): ReactNode {
						if (!href) {
							return <span>{children}</span>;
						}
						if (/^https?:\/\//i.test(href) || href.startsWith("mailto:")) {
							return (
								<a href={href} target="_blank" rel="noopener noreferrer">
									{children}
								</a>
							);
						}
						const internal = internalDocHref(href, docRelFromDocs);
						if (internal.startsWith("#") || internal === "#") {
							return <a href={internal}>{children}</a>;
						}
						return <Link href={internal}>{children}</Link>;
					},
					img({ src, alt }): ReactNode {
						if (typeof src !== "string" || !src) {
							return null;
						}
						return (
							// biome-ignore lint/performance/noImgElement: dynamic repo assets via /api/docs-media (auth-gated)
							<img
								src={mediaUrl(src, docRelFromDocs)}
								alt={alt ?? ""}
								loading="lazy"
							/>
						);
					},
				}}
			>
				{content}
			</ReactMarkdown>
		</div>
	);
}
