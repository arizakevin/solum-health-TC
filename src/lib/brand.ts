export const COMPANY_NAME = "Solum Health";
export const PRODUCT_NAME = "AuthScribe";
export const APP_NAME = `${PRODUCT_NAME} by ${COMPANY_NAME}`;
export const APP_SHORT_NAME = PRODUCT_NAME;

/** Dark-theme SVG asset; use with `dark:invert` (see `AppLogo`) on dark UI */
export const LOGO_MARK_SRC = "/logo-solumhealth-dark.svg";

/**
 * `logo-solumhealth-dark.svg` viewBox is `0 0 1080 400`. Approximate start of
 * the wordmark after the mark (tuned for nav subtitle; adjust if SVG changes).
 */
export const LOGO_SUBTITLE_INSET_PERCENT = (275 / 1080) * 100;
export const APP_DESCRIPTION =
	"AI-powered prior authorization scribe — extract clinical documents into completed service request forms";
export const APP_ASSISTANT_NAME = "Annie";
/** Public path; keep in sync with `public/annie-avatar.webp` */
export const APP_ASSISTANT_AVATAR_SRC = "/annie-avatar.webp";
export const APP_ASSISTANT_SUBTITLE =
	"AI Case Assistant · Powered by Gemini Flash";
