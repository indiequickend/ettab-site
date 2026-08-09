import Image from "next/image";

export function SiteHeader() {
  return (
    <header className="flex items-center gap-3 border-b px-4 py-3 sm:px-6">
      <Image
        src="/logo.jpeg"
        alt="ETTAB logo"
        width={40}
        height={40}
        className="rounded-full"
        priority
      />
      <span className="text-base font-semibold tracking-tight sm:text-lg">
        ETTAB Members Area
      </span>
    </header>
  );
}
