import Image from "next/image";

export function BlogHeader() {
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-[766px] items-center justify-between px-4">
        <a href="/" className="text-lg font-bold">
          <div className="flex items-center gap-1">
            <Image
              src="/icons/logo-mark.svg"
              alt="BLOGIT"
              width={32}
              height={32}
              className="h-8 w-8"
              priority
            />
            <span className="bg-black text-lg text-white font-anta">BLOGIT</span>
          </div>
        </a>
        <nav>
          <a
            href="https://github.com/Hexi1997/Blogit"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  );
}
