import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-main)]">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-indigo-600">404</h1>
        <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Page not found</h2>
        <p className="text-[var(--text-secondary)] text-sm">The page you're looking for doesn't exist.</p>
        <Link
          href="/dashboard"
          className="inline-block px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
