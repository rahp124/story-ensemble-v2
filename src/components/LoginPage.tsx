import { useState, type FormEvent } from 'react';
import { LOGIN_COPY } from '../content/onboardingCopy';
import { AccessSessionError, login } from '@/lib/accessSession';

export type LoginPageProps = {
  onSuccess: (accessId: string) => void;
};

export function LoginPage({ onSuccess }: LoginPageProps) {
  const copy = LOGIN_COPY;
  const [accessId, setAccessId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const canSubmit = accessId.trim().length > 0 && !isSubmitting;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const session = await login(accessId.trim());
      onSuccess(session.accessId);
    } catch (err) {
      if (err instanceof AccessSessionError) {
        if (err.status === 429) {
          setError(copy.errors.rateLimited);
        } else if (err.status === 403) {
          setError(copy.errors.invalid);
        } else {
          setError(err.message || copy.errors.generic);
        }
      } else {
        setError(copy.errors.network);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4 py-10 sm:py-14">
        <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10 md:p-12">
          <div className="text-center">
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              {copy.header.eyebrow}
            </span>
            <h1 className="mt-3 text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">
              {copy.header.title}
            </h1>
            <p className="mt-4 text-base text-slate-600 leading-relaxed max-w-md mx-auto">
              {copy.header.subtitle}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-10">
            <label
              htmlFor="access-id"
              className="block text-sm font-semibold text-slate-800 mb-2"
            >
              {copy.accessId.label}
            </label>
            <input
              id="access-id"
              type="text"
              autoComplete="username"
              value={accessId}
              onChange={(e) => setAccessId(e.target.value)}
              placeholder={copy.accessId.placeholder}
              disabled={isSubmitting}
              className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:border-blue-300 disabled:opacity-60"
            />

            {error && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className="mt-8 w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 disabled:bg-slate-200 disabled:text-slate-500 disabled:shadow-none disabled:cursor-not-allowed transition-all"
            >
              {isSubmitting ? 'Checking…' : copy.submitButton}{' '}
              {!isSubmitting && <span aria-hidden>→</span>}
            </button>
            {!canSubmit && !isSubmitting && (
              <p className="mt-3 text-center text-xs text-slate-500">
                {copy.submitDisabledHint}
              </p>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
