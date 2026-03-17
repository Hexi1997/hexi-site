"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession, authClient } from "@/lib/auth-client";

export function BlogHeader() {
  const { data: session, isPending } = useSession();

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
          {isPending ? (
            <span className="text-sm text-neutral-400 w-14"></span>
          ) : session?.user ? (
            <span className="flex items-center gap-2">
              <span className="text-sm text-neutral-600">
                {session.user.name ?? session.user.email}
              </span>
              <button
                type="button"
                onClick={() => authClient.signOut()}
                className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                Logout
              </button>
            </span>
          ) : (
            <Link
              href="/sign-in"
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              Login
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
