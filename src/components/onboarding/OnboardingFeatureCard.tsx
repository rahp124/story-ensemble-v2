type OnboardingFeatureCardProps = {
  icon: string;
  title: string;
  description: string;
};

export function OnboardingFeatureCard({
  icon,
  title,
  description
}: OnboardingFeatureCardProps) {
  return (
    <div className="rounded-2xl bg-slate-50/70 ring-1 ring-slate-100 p-4">
      <div
        className="flex h-10 w-10 items-center justify-center rounded-xl bg-white ring-1 ring-slate-200 text-xl"
        aria-hidden
      >
        {icon}
      </div>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-xs text-slate-600 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
