import Image from "next/image";

/**
 * The brand emblem at the far right of every banner: the painted artwork of gold stool regalia in public/Asante/sika dwa.jpg,
 * cropped to a circle with a gold ring and a slow golden glow. It is the same image, at the same proportions, in every banner.
 *
 * It is the owner's artwork and is not an official depiction of the Golden Stool (Sika Dwa), which is sacred: confirm its
 * accuracy and the right to use it with the custodians (the Manhyia Palace) before launch. To change it, edit this one
 * component; every banner updates together. It is decorative, so it is hidden from screen readers.
 */
const SRC = encodeURI("/Asante/sika dwa.jpg");

export function SikaDwaEmblem({ className = "" }: { className?: string }) {
  return (
    <span className={`relative inline-block aspect-square rounded-full ${className}`} aria-hidden>
      <span className="emblem-glow absolute -inset-2 rounded-full bg-[radial-gradient(circle,rgba(232,207,131,0.55),transparent_70%)]" />
      <span className="relative block size-full overflow-hidden rounded-full border-[3px] border-gold bg-[#1b1206] shadow-[0_0_22px_rgba(213,166,66,0.45)]">
        <Image src={SRC} alt="" width={770} height={783} quality={90} sizes="10rem" className="size-full scale-[1.08] object-cover" />
      </span>
    </span>
  );
}
