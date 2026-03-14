import Image from "next/image";

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-[766px] items-center justify-between px-4">
        <a href="/" className="text-lg font-bold">
          <div className="flex items-center gap-1">
            <Image
              src="/icons/logo-mark.svg"
              alt="Hexi Space"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="bg-black text-lg text-white font-anta">HEXI SPACE</span>
          </div>
        </a>
        <nav className="flex items-center gap-4">
          <a
            href="/agent"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Agent
          </a>
          <a
            href="/blog"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Blog
          </a>
        </nav>
      </div>
    </header>
  );
}
