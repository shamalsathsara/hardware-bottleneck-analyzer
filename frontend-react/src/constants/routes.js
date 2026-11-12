export const ROUTES = {
  HOME: '/',
  BOTTLENECK_CALCULATOR: '/bottleneck-calculator',
  COMPARE: '/compare',
  GAMES: '/games',
  MY_RIGS: '/my-rigs',
  ABOUT: '/about',
  METHODOLOGY: '/methodology',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  CONTACT: '/contact',
  AUTH: '/auth',
  QUOTATION: '/quotation',
  NOT_FOUND: '/404',
};

export const ROUTE_TITLES = {
  [ROUTES.HOME]: 'Project Aura – PC Bottleneck & Gaming Performance Analyzer',
  [ROUTES.BOTTLENECK_CALCULATOR]: 'PC Bottleneck Calculator – Project Aura',
  [ROUTES.COMPARE]: 'Compare Gaming PC Builds – Project Aura',
  [ROUTES.GAMES]: 'PC Games System Requirements Catalog – Project Aura',
  [ROUTES.MY_RIGS]: 'My Saved Rigs – Project Aura',
  [ROUTES.ABOUT]: 'About Platform – Project Aura',
  [ROUTES.METHODOLOGY]: 'ML Methodology & Limitations – Project Aura',
  [ROUTES.PRIVACY]: 'Privacy Policy – Project Aura',
  [ROUTES.TERMS]: 'Terms of Use – Project Aura',
  [ROUTES.CONTACT]: 'Contact & Support – Project Aura',
  [ROUTES.AUTH]: 'Sign In / Register – Project Aura',
  [ROUTES.QUOTATION]: 'Hardware Pricing Quotation – Project Aura',
  [ROUTES.NOT_FOUND]: 'Page Not Found – Project Aura',
};

const GAME_DETAIL_RE = /^\/games\/([a-z0-9][a-z0-9-]*)$/;

/** Returns the game slug for a /games/:slug route, or null. */
export function getGameSlug(route) {
  const match = GAME_DETAIL_RE.exec(route);
  return match ? match[1] : null;
}

export function getRouteTitle(route) {
  if (getGameSlug(route)) return 'Game Performance & Requirements – Project Aura';
  return ROUTE_TITLES[route] || 'Project Aura – PC Bottleneck Analyzer';
}

// Accepted aliases for each canonical route.
const ALIASES = {
  '/bottleneck': ROUTES.BOTTLENECK_CALCULATOR,
  '/rigs': ROUTES.MY_RIGS,
  '/login': ROUTES.AUTH,
  '/register': ROUTES.AUTH,
  '/quote': ROUTES.QUOTATION,
};

export function getNormalizedRoute(pathname = window.location.pathname) {
  // Lowercase and strip trailing slashes ("/games/x/" -> "/games/x").
  const path = (pathname || '/').toLowerCase().replace(/\/+$/, '') || '/';

  if (Object.values(ROUTES).includes(path)) return path;
  if (ALIASES[path]) return ALIASES[path];
  if (getGameSlug(path)) return path;
  return ROUTES.NOT_FOUND;
}
