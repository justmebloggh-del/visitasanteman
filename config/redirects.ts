/**
 * Permanent (308) redirects, old path -> new path. One list, easy to review.
 *
 * Rules: map each old page to its closest new page, never everything to the homepage;
 * destinations are paths on this site, so no domain is hard-coded here.
 *
 * The site has not launched on a previous address, so there is no legacy URL list yet.
 * The entries below are friendly aliases for the menu names people may type.
 * When the real domain and any old URLs are known, add them here (see docs/DEPLOYMENT_GUIDE.md).
 * Domain-level redirects (old domain -> new domain) are set in the hosting dashboard, not here.
 */
export interface RedirectRule { source: string; destination: string }

export const redirectRules: RedirectRule[] = [
  { source: "/explore-ashanti", destination: "/explore" },
  { source: "/culture-and-heritage", destination: "/culture" },
  { source: "/where-to-stay", destination: "/accommodation" },
  { source: "/food-and-dining", destination: "/restaurants" },
  { source: "/plan-your-visit", destination: "/travel-planner" },
  { source: "/about-us", destination: "/about" },
  { source: "/our-mission", destination: "/about/our-mission" },
  { source: "/list-your-business", destination: "/partner" },
];
