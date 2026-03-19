"use client";

import Image from "next/image";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useSession, authClient } from "@/lib/auth-client";
import { avatarColor } from "@/lib/avatar";
import { NAV_MENUS } from "@/components/layout/nav-menus";

function UserAvatar({ user }: { user: { id?: string | null; name?: string | null; email: string; image?: string | null } }) {
  const initials = (user.name ?? user.email).trim()[0]?.toUpperCase() ?? "?";
  const bg = avatarColor(user.id!);

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
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const profileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  const signInHref = pathname && pathname !== "/sign-in"
    ? `/sign-in?redirect=${encodeURIComponent(pathname)}`
    : "/sign-in";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target as Node)) {
        setMobileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    setProfileOpen(false);
    await authClient.signOut();
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-[766px] items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold">
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
        </Link>
        <nav className="hidden items-center gap-4 md:flex md:gap-6">
          {NAV_MENUS.map((menu) => (
            <Link
              key={menu.href}
              href={menu.href}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-neutral-900"
            >
              {menu.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center justify-end gap-2">
          {isPending ? (
            <span className="h-8 w-8 rounded-full bg-neutral-100 animate-pulse" />
          ) : session?.user ? (
            <div className="relative" ref={profileDropdownRef}>
              <button
                type="button"
                onClick={() => setProfileOpen((v) => !v)}
                className="flex items-center gap-2 rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
                aria-haspopup="true"
                aria-expanded={profileOpen}
              >
                <UserAvatar user={session.user} />
              </button>

              {profileOpen && (
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
                    onClick={() => setProfileOpen(false)}
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
              className="inline-flex items-center rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-neutral-700 md:px-4"
            >
              Login
            </Link>
          )}

          <div className="relative md:hidden" ref={mobileMenuRef}>
            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200 text-neutral-700 transition-colors hover:bg-neutral-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-haspopup="true"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {mobileMenuOpen && (
              <div className="absolute right-0 mt-2 w-44 rounded-xl border bg-white py-1 shadow-lg z-50">
                {NAV_MENUS.map((menu) => (
                  <Link
                    key={menu.href}
                    href={menu.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
                  >
                    {menu.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
