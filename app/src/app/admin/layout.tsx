"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/BrandScene";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [role, setRole] = useState<"admin" | "curator" | null>(null);

  useEffect(() => {
    if (pathname === "/admin/login") return;
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((data) => setRole(data.role ?? null))
      .catch(() => {});
  }, [pathname]);

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const links = [
    { href: "/admin/dashboard", label: "Дашборд" },
    ...(role === "admin"
      ? [
          { href: "/admin/tests", label: "Тесты" },
          { href: "/admin/subjects", label: "Предметы" },
          { href: "/admin/universities", label: "Университеты" },
          { href: "/admin/groups", label: "Группы" },
          { href: "/admin/admins", label: "Пользователи" },
        ]
      : []),
  ];

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-50">
      <header className="sticky top-0 z-20 overflow-hidden border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="h-1 bg-gradient-to-r from-emerald-400 via-emerald-500 to-emerald-600" />
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <LogoMark size={30} />
              <span className="font-semibold text-slate-900">ProManas · Админ</span>
            </div>
            <nav className="flex gap-1 text-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-full px-3 py-1.5 transition ${
                    pathname?.startsWith(link.href)
                      ? "bg-emerald-50 font-medium text-emerald-700"
                      : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-slate-500 transition hover:bg-slate-50 hover:text-slate-800"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Выйти
          </button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
