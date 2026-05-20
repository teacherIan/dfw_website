/**
 * Site-level SEO defaults. Override at build time via VITE_SITE_URL.
 */

export const SITE_URL: string = (
  (import.meta.env.VITE_SITE_URL as string | undefined) ??
  'https://dougsfoundwood.com'
).replace(/\/+$/, '');

export const SITE_NAME = "Doug's Found Wood";

export const SITE_DESCRIPTION =
  'Handcrafted furniture from Athens, Maine. Adirondack chairs, tables, and custom woodworking by Doug Malloy, built to last from cedar and hardwoods.';

export const BUSINESS_LOCALITY = 'Athens';
export const BUSINESS_REGION = 'ME';
export const BUSINESS_COUNTRY = 'US';
export const BUSINESS_PHONE = '+1-207-654-2692';
export const BUSINESS_EMAIL = 'matfoundwood@gmail.com';
export const BUSINESS_FACEBOOK = 'https://www.facebook.com/DougsFoundWood/';

export const LOGO_IMAGE = `${SITE_URL}/assets/dfw_logo_3d.png`;
// TODO: replace with a 1200x630 JPG at public/og/default.jpg for optimal
// social-share rendering. Current fallback uses the logo PNG.
export const DEFAULT_OG_IMAGE = LOGO_IMAGE;

export const canonicalUrl = (path: string): string => {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
};
