import { useMemo, useState } from 'react';
import { useStore } from '../store';
import {
  DESIGNER_STORYBOARDS,
  type DesignerStoryboard
} from '@/data/designerStoryboards';

type StoryboardDraft = { replace: boolean; url: string | null; title: string };

function buildInitialDrafts(
  overrides: Record<string, DesignerStoryboard>
): Record<string, StoryboardDraft> {
  return Object.fromEntries(
    DESIGNER_STORYBOARDS.map((storyboard) => {
      const override = overrides[storyboard.id];
      return [
        storyboard.id,
        override
          ? { replace: true, url: override.image, title: override.title }
          : { replace: false, url: null, title: storyboard.title }
      ];
    })
  );
}

export function AdminSetup() {
  const designTopic = useStore((s) => s.designTopic);
  const setDesignTopic = useStore((s) => s.setDesignTopic);
  const setAdminSetupOpen = useStore((s) => s.setAdminSetupOpen);
  const adminStoryboardOverrides = useStore((s) => s.adminStoryboardOverrides);
  const setAdminStoryboardOverride = useStore((s) => s.setAdminStoryboardOverride);
  const clearAdminStoryboardOverride = useStore((s) => s.clearAdminStoryboardOverride);
  const clearAllAdminStoryboardOverrides = useStore((s) => s.clearAllAdminStoryboardOverrides);

  const [topic, setTopic] = useState(designTopic ?? '');
  const [drafts, setDrafts] = useState<Record<string, StoryboardDraft>>(() =>
    buildInitialDrafts(adminStoryboardOverrides)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Effective (saved) storyboards for the "current" preview row.
  const effectiveById = useMemo(() => {
    const merged = DESIGNER_STORYBOARDS.map(
      (s) => adminStoryboardOverrides[s.id] ?? s
    );
    return Object.fromEntries(merged.map((s) => [s.id, s]));
  }, [adminStoryboardOverrides]);

  const updateDraft = (
    storyboardId: string,
    updater: (d: StoryboardDraft) => StoryboardDraft
  ) => {
    setSaved(false);
    setDrafts((prev) => ({ ...prev, [storyboardId]: updater(prev[storyboardId]) }));
  };

  const toggleReplace = (storyboardId: string, checked: boolean) => {
    updateDraft(storyboardId, (d) => ({
      ...d,
      replace: checked,
      title: checked ? (effectiveById[storyboardId]?.title ?? d.title) : d.title
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[storyboardId];
      return next;
    });
  };

  const handleFile = (storyboardId: string, file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateDraft(storyboardId, (d) => ({ ...d, url }));
  };

  const handleTitle = (storyboardId: string, title: string) => {
    updateDraft(storyboardId, (d) => ({ ...d, title }));
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};

    DESIGNER_STORYBOARDS.forEach((storyboard) => {
      const draft = drafts[storyboard.id];
      if (draft?.replace && !draft.url) {
        nextErrors[storyboard.id] = 'An image is required to replace this storyboard.';
      }
    });

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      setSaved(false);
      return;
    }
    setErrors({});

    // Persist topic.
    const trimmed = topic.trim();
    if (trimmed) setDesignTopic(trimmed);

    // Persist (or clear) each storyboard override.
    DESIGNER_STORYBOARDS.forEach((storyboard) => {
      const draft = drafts[storyboard.id];
      if (draft?.replace) {
        setAdminStoryboardOverride(storyboard.id, {
          id: storyboard.id,
          title: draft.title.trim() || storyboard.title,
          image: draft.url as string
        });
      } else {
        clearAdminStoryboardOverride(storyboard.id);
      }
    });

    setSaved(true);
    // Return to the home/start page shortly after confirming.
    setTimeout(() => setAdminSetupOpen(false), 1000);
  };

  const handleResetDefaults = () => {
    clearAllAdminStoryboardOverrides();
    setDrafts(buildInitialDrafts({}));
    setErrors({});
    setSaved(false);
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="min-h-full flex items-start justify-center p-4 py-10">
        <div className="w-full max-w-4xl bg-white rounded-3xl shadow-xl ring-1 ring-slate-200/60 p-6 sm:p-10">

          {/* Header */}
          <div>
            <span className="inline-block text-xs font-semibold tracking-[0.2em] uppercase text-blue-600">
              Designer
            </span>
            <h1 className="mt-2 text-3xl font-bold text-slate-900 tracking-tight">
              Admin Setup
            </h1>
            <p className="mt-2 text-base text-slate-600">
              Configure the storyboards participants will choose from.
            </p>
          </div>

          {/* Study topic */}
          <div className="mt-8">
            <label htmlFor="admin-topic" className="block text-base font-semibold text-slate-900">
              Study topic
            </label>
            <input
              id="admin-topic"
              type="text"
              value={topic}
              onChange={(e) => {
                setSaved(false);
                setTopic(e.target.value);
              }}
              placeholder="e.g. campus lunch decisions"
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none transition"
            />
          </div>

          {/* Storyboard source */}
          <div className="mt-10">
            <h2 className="text-lg font-semibold text-slate-900">Storyboard source</h2>

            <div className="mt-3 flex flex-col sm:flex-row sm:items-center gap-3 p-4 rounded-xl border border-slate-200 bg-slate-50/60">
              <button
                type="button"
                disabled
                className="px-4 py-2 rounded-lg bg-slate-200 text-slate-500 font-semibold text-sm cursor-not-allowed"
              >
                Generate with Story Ensemble
              </button>
              <span className="text-sm text-slate-500">Coming soon</span>
            </div>

            <h3 className="mt-8 text-base font-semibold text-slate-900">
              Upload storyboard images
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              Each storyboard is a single image containing all of its panels. Unchecked
              storyboards keep their default image.
            </p>
          </div>

          {/* Storyboards */}
          <div className="mt-6 space-y-6">
            {DESIGNER_STORYBOARDS.map((storyboard) => {
              const draft = drafts[storyboard.id];
              const effective = effectiveById[storyboard.id];
              const isOverridden = Boolean(adminStoryboardOverrides[storyboard.id]);
              const error = errors[storyboard.id];

              return (
                <div
                  key={storyboard.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{effective.title}</h4>
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                          isOverridden
                            ? 'bg-blue-50 text-blue-600'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {isOverridden ? 'Custom' : 'Default'}
                      </span>
                    </div>
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={draft?.replace ?? false}
                        onChange={(e) => toggleReplace(storyboard.id, e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
                      />
                      Replace this storyboard
                    </label>
                  </div>

                  {/* Current preview */}
                  <div className="mt-4">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                      Current
                    </p>
                    <PreviewImage src={effective.image} alt={effective.title} />
                  </div>

                  {/* Upload slot */}
                  {draft?.replace && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        New storyboard image
                        <span className="text-red-500"> *</span>
                      </p>
                      <PreviewImage src={draft.url ?? undefined} alt="New storyboard" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleFile(storyboard.id, e.target.files?.[0])}
                        className="mt-3 block w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => handleTitle(storyboard.id, e.target.value)}
                        placeholder={storyboard.title}
                        className="mt-2 w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
                      />
                    </div>
                  )}

                  {error && (
                    <p className="mt-3 text-sm font-medium text-red-600">{error}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Confirmation */}
          {saved && (
            <div className="mt-6 p-3 rounded-xl bg-green-50 border border-green-200 text-sm font-medium text-green-700">
              Setup saved. Returning to the start page…
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:justify-end">
            <button
              type="button"
              onClick={() => setAdminSetupOpen(false)}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleResetDefaults}
              className="px-5 py-3 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Reset to defaults
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold text-sm shadow-md hover:bg-blue-700 transition-colors"
            >
              Save setup
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

function PreviewImage({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div className="w-full aspect-[16/9] bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-xs text-slate-400 px-1 text-center">
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-auto object-contain rounded-lg border border-slate-200"
    />
  );
}
