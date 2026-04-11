import Image from "next/image";
import { APP_NAME, LOGO_MARK_SRC } from "@/lib/brand";
import { cn } from "@/lib/utils";

/** Intrinsic size from `logo-solumhealth-dark.svg` viewBox */
const LOGO_WIDTH = 1080;
const LOGO_HEIGHT = 400;

type AppLogoProps = {
	className?: string;
	/** Set on above-the-fold instances (e.g. sign-in) for LCP */
	priority?: boolean;
};

/** Matches getsolum.com navbar: 248×64 display box, `object-contain` preserves SVG aspect */
const LOGO_DISPLAY_CLASS =
	"h-16 w-[248px] max-w-[min(248px,calc(100vw-10rem))] object-contain dark:invert";

/**
 * Brand wordmark (dark-colored SVG). In dark mode, CSS `invert()` flips colors
 * so the mark stays visible on dark surfaces.
 */
export function AppLogo({ className, priority = false }: AppLogoProps) {
	return (
		<Image
			src={LOGO_MARK_SRC}
			alt={APP_NAME}
			width={LOGO_WIDTH}
			height={LOGO_HEIGHT}
			className={cn(LOGO_DISPLAY_CLASS, className)}
			unoptimized
			priority={priority}
		/>
	);
}
