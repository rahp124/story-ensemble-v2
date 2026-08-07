import { navigate } from '../lib/route';

const BUTTON_CLASS =
  'w-full inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-blue-600 text-white font-semibold text-base shadow-md hover:bg-blue-700 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-200 transition-all';

export function HomePage() {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight text-center">
            Choose a study
          </h1>
          <div className="mt-8 space-y-3">
            <button
              type="button"
              onClick={() => navigate('user')}
              className={BUTTON_CLASS}
            >
              Create your own storyboard
            </button>
            <button
              type="button"
              onClick={() => navigate('designer')}
              className={BUTTON_CLASS}
            >
              Review a designer storyboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
