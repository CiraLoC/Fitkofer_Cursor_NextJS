"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "@supabase/auth-helpers-react";
import { useTransition } from "react";
import { signOut } from "@/lib/auth/actions";
import { clsx } from "clsx";

const links = [
  { href: "/", label: "LumaWell" },
  { href: "/today", label: "Today" },
  { href: "/planner", label: "Planner" },
  { href: "/meals", label: "Meals" },
  { href: "/reports", label: "Reports" }
];

export function MainNav() {
  const pathname = usePathname();
  const session = useSession();
  const [pending, startTransition] = useTransition();

  return (
    <nav className="main-nav">
      <div className="main-nav__links">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={clsx("main-nav__link", {
              active: pathname === link.href
            })}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="main-nav__cta">
        {session ? (
          <button
            className="button secondary"
            disabled={pending}
            onClick={() => startTransition(() => signOut())}
          >
            {pending ? "Signing out..." : "Sign out"}
          </button>
        ) : (
          <Link href="/signup" className="button">
            Join beta
          </Link>
        )}
      </div>
      <style jsx>{`
        .main-nav {
          position: sticky;
          top: 0;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 220px;
          padding: 2rem 1.5rem;
          border-right: 1px solid #e5e7eb;
          background: #ffffff;
          min-height: 100vh;
        }

        .main-nav__link {
          display: block;
          padding: 0.75rem 1rem;
          border-radius: 12px;
          font-weight: 600;
          color: #4c1d95;
          background: transparent;
        }

        .main-nav__link.active {
          background: #ede9fe;
          color: #4c1d95;
        }

        .main-nav__links {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .main-nav__cta {
          margin-top: auto;
        }

        @media (max-width: 900px) {
          .main-nav {
            position: static;
            width: 100%;
            min-height: auto;
            flex-direction: row;
            align-items: center;
            justify-content: space-between;
            border-right: none;
            border-bottom: 1px solid #e5e7eb;
          }

          .main-nav__links {
            flex-direction: row;
            flex-wrap: wrap;
          }

          .main-nav__link {
            padding: 0.6rem 0.9rem;
          }
        }
      `}</style>
    </nav>
  );
}
