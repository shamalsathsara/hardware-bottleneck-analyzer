import { ROUTES } from '../constants/routes';

export default function NotFoundPage({ onNavigate }) {
  return (
    <div className="content-page" style={{ maxWidth: '720px', margin: '0 auto', padding: '5rem 1.5rem', textAlign: 'center' }}>
      <h1 style={{ color: 'var(--text-main, #f8fafc)', marginBottom: '0.75rem' }}>Page not found</h1>
      <p style={{ color: 'var(--text-sub, #94a3b8)', marginBottom: '2rem' }}>
        The page you are looking for doesn&apos;t exist or has moved.
      </p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <button type="button" className="btn-primary-action" onClick={() => onNavigate(ROUTES.BOTTLENECK_CALCULATOR)}>
          Open the Bottleneck Calculator
        </button>
        <button type="button" className="btn-secondary-action" onClick={() => onNavigate(ROUTES.HOME)}>
          Go to Home
        </button>
      </div>
    </div>
  );
}
