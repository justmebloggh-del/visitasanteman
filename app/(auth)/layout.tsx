import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-mist px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="mb-6 block" aria-label="VisitAsanteman, home"><Wordmark className="justify-center text-3xl" /></Link>
        {children}
      </div>
    </div>
  );
}
