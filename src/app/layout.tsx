import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
	variable: "--font-sans",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: APP_NAME,
	description: APP_DESCRIPTION,
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html
			lang="en"
			className={`${inter.variable} h-full antialiased`}
			suppressHydrationWarning
		>
			<body
				className="min-h-full bg-background font-sans text-foreground"
				suppressHydrationWarning
			>
				<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
					<TooltipProvider>
						{children}
						<Toaster />
					</TooltipProvider>
				</ThemeProvider>
			</body>
		</html>
	);
}
