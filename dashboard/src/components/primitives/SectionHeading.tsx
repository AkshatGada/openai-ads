export default function SectionHeading({
  index,
  title,
  sub,
}: {
  index: string;
  title: string;
  sub?: string;
}) {
  return (
    <div className="flex items-baseline gap-4">
      <span className="font-mono text-xs text-accent">{index}</span>
      <h2 className="font-sans text-lg font-semibold tracking-tightish text-text">{title}</h2>
      {sub && <span className="font-mono text-xs text-text-faint">{sub}</span>}
    </div>
  );
}
