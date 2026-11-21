interface SectionHeaderProps {
  step: string;
  title: string;
  description: string;
}

export function SectionHeader({ step, title, description }: SectionHeaderProps) {
  return (
    <div className="mb-6 flex items-start gap-4 sm:mb-8">
      <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-400/30 bg-gold-400/10 text-xs font-bold tracking-wider text-gold-300">
        {step}
      </div>
      <div>
        <h2 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm leading-relaxed text-slate-400">{description}</p>
      </div>
    </div>
  );
}
