export const BRAND_GREEN = "#68b247";

export const GREEN_SHADES = {
	dark: "#3f7a2a",
	base: BRAND_GREEN,
	mid: "#8fc86f",
	light: "#b5dba0",
	soft: "#d4ebc8",
} as const;

export const CHART_COLORS = {
	success: GREEN_SHADES.dark,
	warning: GREEN_SHADES.base,
	danger: GREEN_SHADES.light,
	blue: GREEN_SHADES.mid,
	purple: GREEN_SHADES.soft,
	muted: GREEN_SHADES.soft,
} as const;

export const CHART_PALETTE = [
	GREEN_SHADES.dark,
	GREEN_SHADES.base,
	GREEN_SHADES.mid,
	GREEN_SHADES.light,
	GREEN_SHADES.soft,
] as const;
