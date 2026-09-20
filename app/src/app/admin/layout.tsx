"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  const links = [
    { href: "/admin/dashboard", label: "Дашборд" },
    { href: "/admin/tests", label: "Тесты" },
    { href: "/admin/groups", label: "Группы" },
  ];

  return (
    <div className="flex flex-1 flex-col">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <span className="font-semibold text-slate-900">ОРТ · Админ</span>
            <nav className="flex gap-4 text-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`${
                    pathname?.startsWith(link.href)
                      ? "font-medium text-indigo-600"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
          <button onClick={logout} className="text-sm text-slate-500 hover:text-slate-800">
            Выйти
          </button>
        </div>
      </header>
      <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
