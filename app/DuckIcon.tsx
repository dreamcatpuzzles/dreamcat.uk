export default function DuckIcon({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/duck_icon.svg" alt="" aria-hidden="true" className={className} />
  );
}
