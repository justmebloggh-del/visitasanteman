import Image from "next/image";

/**
 * The brand emblem at the far right of every banner: the owner's Sika Dwa artwork (public/Asante/sika dwa.jpeg), with its white
 * background removed (public/brand/sika-dwa-emblem.png, the original is untouched). It is the same artwork, in the same
 * proportions, in every banner; only its size changes with the screen. It is never drawn larger than the file's real size.
 * A slow golden glow and a sheen that stays inside its outline are its only movement, and both stop under reduced motion.
 *
 * Confirm with the custodians (the Manhyia Palace) that this depiction is approved for use. To change it, edit this one
 * component; every banner updates together. It is decorative, so it is hidden from screen readers.
 */
const SRC = "/brand/sika-dwa-emblem.png";
const W = 456, H = 357;

export function SikaDwaEmblem({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block ${className}`} style={{ aspectRatio: `${W} / ${H}`, ["--emblem" as string]: `url(${SRC})` }} aria-hidden>
      <span className="emblem-glow absolute -inset-3 rounded-full bg-[radial-gradient(closest-side,rgba(232,207,131,0.5),transparent)]" />
      <Image src={SRC} alt="" width={W} height={H} sizes="(min-width:1024px) 12rem, 8rem" className="relative size-full object-contain drop-shadow-[0_6px_14px_rgba(0,0,0,0.4)]" />
      <span className="emblem-sheen absolute inset-0" />
    </span>
  );
}
