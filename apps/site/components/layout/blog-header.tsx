"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";

function avatarColor(seed: string): string {
  const colors = [
    "#e57373", "#f06292", "#ba68c8", "#9575cd",
    "#7986cb", "#64b5f6", "#4dd0e1", "#4db6ac",
    "#81c784", "#aed581", "#ffb74d", "#ff8a65",
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function UserAvatar({ user }: { user: { name?: string | null; email: string; image?: string | null } }) {
  const initials = (user.name ?? user.email).trim()[0]?.toUpperCase() ?? "?";
  const bg = avatarColor(user.email);

  if (user.image) {
    return (
      <Image
        src={user.image}
        alt={user.name ?? user.email}
        width={32}
        height={32}
        className="h-8 w-8 rounded-full object-cover"
      />
    );
  }

  return (
    <span
      className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold text-white select-none"
      style={{ backgroundColor: bg }}
    >
      {initials}
    </span>
  );
}

export function BlogHeader() {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const signInHref = pathname && pathname !== "/sign-in"
    ? `/sign-in?redirect=${encodeURIComponent(pathname)}`
    : "/sign-in";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setOpen(false);
    await authClient.signOut();
    router.refresh();
  }

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
        <nav className="flex items-center gap-4 md:gap-6">
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
          <a
            href="/notes"
            className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
          >
            Notes
          </a>
        </nav>

        <div className="flex items-center justify-end w-20">
          {isPending ? (
            <span className="h-8 w-8 rounded-full bg-neutral-100 animate-pulse" />
          ) : session?.user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                aria-haspopup="true"
                aria-expanded={open}
              >
                <UserAvatar user={session.user} />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white shadow-lg py-1 z-50">
                  <div className="px-4 py-2 border-b">
                    <p className="text-sm font-medium text-neutral-800 truncate">
                      {session.user.name ?? session.user.email}
                    </p>
                    {session.user.name && (
                      <p className="text-xs text-neutral-400 truncate">{session.user.email}</p>
                    )}
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Profile
                  </Link>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href={signInHref}
              className="inline-flex items-center rounded-md bg-neutral-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
