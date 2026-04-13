import Link from "next/link";
import { LOGO_SUBTITLE_INSET_PERCENT, PRODUCT_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";
import { AppLogo } from "./app-logo";

const linkClassName =
	"-mt-2 flex shrink-0 flex-col items-start justify-center gap-0 py-0 leading-none sm:-mt-2.5";

const defaultLogoClassName =
	"block h-11 w-auto max-w-[min(268px,calc(100vw-12rem))] object-left sm:h-12 sm:max-w-[min(300px,calc(100vw-12rem))]";

const subtitleClassName =
	"-mt-2.5 self-stretch text-left text-[10px] font-medium leading-none tracking-tight text-muted-foreground";

type AppBrandLinkProps = {
	className?: string;
	logoClassName?: string;
	/** Defaults to `/` (same as main nav) */
	href?: string;
	priority?: boolean;
};

/**
 * Wordmark + product subtitle, matching the main app header (`AppNav`).
 */
export function AppBrandLink({
	className,
	logoClassName,
	href = "/",
	priority = false,
}: AppBrandLinkProps) {
	return (
		<Link href={href} className={cn(linkClassName, className)}>
			<AppLogo
				className={cn(defaultLogoClassName, logoClassName)}
				priority={priority}
			/>
			<span
				className={subtitleClassName}
				style={{
					paddingLeft: `${LOGO_SUBTITLE_INSET_PERCENT}%`,
				}}
			>
				{PRODUCT_NAME}
			</span>
		</Link>
	);
}
