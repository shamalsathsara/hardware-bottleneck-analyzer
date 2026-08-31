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
};

export function getNormalizedRoute(pathname = window.location.pathname) {
  const path = pathname.toLowerCase();
  if (path === '' || path === '/') return ROUTES.HOME;
  if (path.startsWith('/bottleneck')) return ROUTES.BOTTLENECK_CALCULATOR;
  if (path.startsWith('/compare')) return ROUTES.COMPARE;
  if (path.startsWith('/games')) return path; // Returns exact path like '/games' or '/games/cyberpunk-2077'
  if (path.startsWith('/my-rigs') || path.startsWith('/rigs')) return ROUTES.MY_RIGS;
  if (path.startsWith('/about')) return ROUTES.ABOUT;
  if (path.startsWith('/method')) return ROUTES.METHODOLOGY;
  if (path.startsWith('/privacy')) return ROUTES.PRIVACY;
  if (path.startsWith('/terms')) return ROUTES.TERMS;
  if (path.startsWith('/contact')) return ROUTES.CONTACT;
  if (path.startsWith('/auth') || path.startsWith('/login') || path.startsWith('/register')) return ROUTES.AUTH;
  if (path.startsWith('/quotation') || path.startsWith('/quote')) return ROUTES.QUOTATION;
  return ROUTES.HOME;
}
