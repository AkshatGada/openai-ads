// Section beat: mono number + grotesk title on a hairline, with an optional lead line.
export default function SectionHeading({
  index,
  title,
  sub,
  lead,
}: {
  index: string;
  title: string;
  sub?: string;
  lead?: string;
}) {
  return (
    <div className="flex flex-col gap-2 border-t border-ink-200 pt-4">
      <div className="flex items-baseline gap-4">
        <span className="font-mono text-eyebrow uppercase text-ink-400">{index} /</span>
        <h2 className="font-display text-2xl font-semibold tracking-tight text-ink-950">{title}</h2>
        {sub && <span className="ml-auto font-mono text-xs text-ink-400">{sub}</span>}
      </div>
      {lead && <p className="max-w-2xl font-sans text-sm leading-relaxed text-ink-500">{lead}</p>}
    </div>
  );
}
