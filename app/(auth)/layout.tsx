import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-[70vh] place-items-center bg-mist px-4 py-12">
      <div className="w-full max-w-md rounded-2xl border border-line bg-white p-7 shadow-sm sm:p-9">
        <Link href="/" className="mb-6 block"><Image src="/brand/logo.png" alt="Visit Lake Bosomtwe" width={120} height={60} className="mx-auto h-14 w-auto" /></Link>
        {children}
      </div>
    </div>
  );
}
