import { AnnieChatDrawer } from "@/components/annie-chat-drawer";
import { AppNav } from "@/components/app-nav";
import { TutorialManager } from "@/components/tutorial/tutorial-manager";

export default function AppLayout({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-screen flex-col">
			<AppNav />
			<main className="flex-1">
				<div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</div>
			</main>
			<AnnieChatDrawer />
			<TutorialManager />
		</div>
	);
}
