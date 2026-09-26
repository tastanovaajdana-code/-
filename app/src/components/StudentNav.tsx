"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

export function StudentNav({ fio }: { fio?: string }) {
  const pathname = usePathname();
  const router = useRouter();

  function logout() {
    sessionStorage.removeItem("ort_student_fio");
    sessionStorage.removeItem("ort_student_email");
    sessionStorage.removeItem("ort_student_group");
    router.push("/");
  }

  const links = [
    { href: "/tests", label: "Тесты" },
    { href: "/stats", label: "Статистика" },
  ];

  return (
    <div className="mx-auto mb-6 flex w-full max-w-2xl items-center justify-between rounded-xl bg-white/10 px-4 py-2.5 ring-1 ring-white/20 backdrop-blur">
      <div className="flex items-center gap-1">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              pathname?.startsWith(link.href)
                ? "bg-white font-medium text-emerald-700"
                : "text-emerald-50 hover:bg-white/10"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
      <div className="flex items-center gap-3">
        {fio && <span className="hidden text-sm text-emerald-50/80 sm:inline">{fio}</span>}
        <button
          onClick={logout}
          className="rounded-full px-3 py-1.5 text-sm text-emerald-50 transition hover:bg-white/10"
        >
          Выйти
        </button>
      </div>
    </div>
  );
}
