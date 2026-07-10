type PriorExperienceOptionProps = {
  selected: boolean;
  onSelect: () => void;
  name: string;
  value: string;
  title: string;
};

export function PriorExperienceOption({
  selected,
  onSelect,
  name,
  value,
  title
}: PriorExperienceOptionProps) {
  return (
    <label
      className={`relative flex items-center gap-2 px-4 py-3 rounded-xl border-2 cursor-pointer transition-all focus-within:ring-2 focus-within:ring-blue-200 ${
        selected
          ? 'border-blue-600 bg-blue-50'
          : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          selected ? 'border-blue-600' : 'border-slate-300'
        }`}
        aria-hidden
      >
        {selected && <span className="h-2 w-2 rounded-full bg-blue-600" />}
      </span>
      <span className="text-sm font-semibold text-slate-900">{title}</span>
    </label>
  );
}
