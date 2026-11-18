/** A round badge with the person's initials: no photo is stored, so nothing private is shown. */
export function Avatar({ text, className = "size-14 text-xl" }: { text: string; className?: string }) {
  return <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-forest font-serif font-semibold text-soft-gold ring-2 ring-gold ${className}`}>{text}</span>;
}
