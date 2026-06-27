import { useMemo, useState } from 'react';
import { useStore } from '../store';
import {
  DESIGNER_STORYBOARDS,
  getDefaultFrameCaption,
  type DesignerVariant,
  type DesignerFrame
} from '@/data/designerStoryboards';
import type { FrameOutline } from '@/types';

type FrameType = FrameOutline['frameType'];

const FRAME_ORDER: FrameType[] = ['Context', 'Problem', 'Action', 'Resolution'];

const FRAME_LABEL: Record<FrameType, string> = {
  Context: 'Context panel',
  Problem: 'Problem panel',
  Action: 'Action panel',
  Resolution: 'Resolution panel'
};

type PanelDraft = { url: string | null; caption: string };
type VariantDraft = { replace: boolean; panels: Record<FrameType, PanelDraft> };

function emptyPanels(): Record<FrameType, PanelDraft> {
  return {
    Context: { url: null, caption: '' },
    Problem: { url: null, caption: '' },
    Action: { url: null, caption: '' },
    Resolution: { url: null, caption: '' }
  };
}

function buildInitialDrafts(
  overrides: Record<string, DesignerVariant>
): Record<string, VariantDraft> {
  return Object.fromEntries(
    DESIGNER_STORYBOARDS.map((variant) => {
      const override = overrides[variant.id];
      if (!override) {
        return [variant.id, { replace: false, panels: emptyPanels() }];
      }
      const panels = emptyPanels();
      FRAME_ORDER.forEach((frameType) => {
        const frame = override.frames.find((f) => f.frameType === frameType);
        panels[frameType] = {
          url: frame?.image ?? null,
          caption: frame?.caption ?? ''
        };
      });
      return [variant.id, { replace: true, panels }];
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
  const [drafts, setDrafts] = useState<Record<string, VariantDraft>>(() =>
    buildInitialDrafts(adminStoryboardOverrides)
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);

  // Effective (saved) storyboards for the "current" preview row.
  const effectiveById = useMemo(() => {
    const merged = DESIGNER_STORYBOARDS.map(
      (v) => adminStoryboardOverrides[v.id] ?? v
    );
    return Object.fromEntries(merged.map((v) => [v.id, v]));
  }, [adminStoryboardOverrides]);

  const updateDraft = (variantId: string, updater: (d: VariantDraft) => VariantDraft) => {
    setSaved(false);
    setDrafts((prev) => ({ ...prev, [variantId]: updater(prev[variantId]) }));
  };

  const toggleReplace = (variantId: string, checked: boolean) => {
    updateDraft(variantId, (d) => {
      if (!checked) {
        return { ...d, replace: false };
      }
      const effective = effectiveById[variantId];
      const panels = emptyPanels();
      FRAME_ORDER.forEach((frameType) => {
        const frame = effective?.frames.find((f) => f.frameType === frameType);
        panels[frameType] = {
          url: null,
          caption: frame?.caption ?? getDefaultFrameCaption(variantId, frameType)
        };
      });
      return { ...d, replace: true, panels };
    });
    setErrors((prev) => {
      const next = { ...prev };
      delete next[variantId];
      return next;
    });
  };

  const handleFile = (variantId: string, frameType: FrameType, file: File | undefined) => {
    if (!file) return;
    const url = URL.createObjectURL(file);
    updateDraft(variantId, (d) => ({
      ...d,
      panels: {
        ...d.panels,
        [frameType]: { ...d.panels[frameType], url }
      }
    }));
  };

  const handleCaption = (variantId: string, frameType: FrameType, caption: string) => {
    updateDraft(variantId, (d) => ({
      ...d,
      panels: {
        ...d.panels,
        [frameType]: { ...d.panels[frameType], caption }
      }
    }));
  };

  const handleSave = () => {
    const nextErrors: Record<string, string> = {};

    DESIGNER_STORYBOARDS.forEach((variant) => {
      const draft = drafts[variant.id];
      if (draft?.replace) {
        const missing = FRAME_ORDER.filter((ft) => !draft.panels[ft].url);
        if (missing.length > 0) {
          nextErrors[variant.id] =
            'All 4 panels are required to replace this storyboard.';
        }
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
    DESIGNER_STORYBOARDS.forEach((variant) => {
      const draft = drafts[variant.id];
      if (draft?.replace) {
        const frames: DesignerFrame[] = FRAME_ORDER.map((frameType) => ({
          frameType,
          image: draft.panels[frameType].url as string,
          caption: draft.panels[frameType].caption.trim() ||
            getDefaultFrameCaption(variant.id, frameType)
        }));
        const overridden: DesignerVariant = {
          id: variant.id,
          title: variant.title,
          frames
        };
        setAdminStoryboardOverride(variant.id, overridden);
      } else {
        clearAdminStoryboardOverride(variant.id);
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
              Configure the storyboard variants participants will choose from.
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
              To replace a storyboard, upload all 4 panels. Unchecked storyboards keep their
              default images.
            </p>
          </div>

          {/* Variants */}
          <div className="mt-6 space-y-6">
            {DESIGNER_STORYBOARDS.map((variant) => {
              const draft = drafts[variant.id];
              const effective = effectiveById[variant.id];
              const isOverridden = Boolean(adminStoryboardOverrides[variant.id]);
              const error = errors[variant.id];

              return (
                <div
                  key={variant.id}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-slate-900">{variant.title}</h4>
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
                        onChange={(e) => toggleReplace(variant.id, e.target.checked)}
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
                    <div className="grid grid-cols-4 gap-3">
                      {FRAME_ORDER.map((frameType) => {
                        const frame = effective.frames.find((f) => f.frameType === frameType);
                        return (
                          <div key={frameType} className="flex flex-col">
                            <PreviewThumb src={frame?.image} alt={`${variant.title} — ${frameType}`} />
                            <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-blue-600">
                              {frameType}
                            </span>
                            <p className="mt-1 text-xs text-slate-700 leading-snug">
                              {frame?.caption ?? getDefaultFrameCaption(variant.id, frameType)}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Upload slots */}
                  {draft?.replace && (
                    <div className="mt-5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                        New panels (all 4 required)
                      </p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {FRAME_ORDER.map((frameType) => {
                          const panel = draft.panels[frameType];
                          return (
                            <div key={frameType} className="flex flex-col gap-2">
                              <PreviewThumb src={panel.url ?? undefined} alt={FRAME_LABEL[frameType]} />
                              <label className="text-xs font-semibold text-slate-700">
                                {FRAME_LABEL[frameType]}
                                <span className="text-red-500"> *</span>
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFile(variant.id, frameType, e.target.files?.[0])}
                                className="block w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                              />
                              <input
                                type="text"
                                value={panel.caption}
                                onChange={(e) => handleCaption(variant.id, frameType, e.target.value)}
                                placeholder={getDefaultFrameCaption(variant.id, frameType)}
                                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-100 outline-none"
                              />
                            </div>
                          );
                        })}
                      </div>
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

function PreviewThumb({ src, alt }: { src?: string; alt: string }) {
  if (!src) {
    return (
      <div className="w-full aspect-square bg-slate-100 border border-dashed border-slate-300 rounded-lg flex items-center justify-center text-[10px] text-slate-400 px-1 text-center">
        No image
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt}
      className="w-full aspect-square object-cover rounded-lg border border-slate-200"
    />
  );
}
