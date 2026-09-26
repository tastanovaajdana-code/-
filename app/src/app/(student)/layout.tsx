"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoMark } from "@/components/BrandScene";

const links = [
  { href: "/day", label: "Мой день" },
  { href: "/ort", label: "Подготовка к ОРТ" },
  { href: "/manas", label: "Подготовка к Манасу" },
  { href: "/homework", label: "Домашние задания" },
  { href: "/tests", label: "Пробные экзамены" },
  { href: "/mistakes", label: "Работа над ошибками" },
  { href: "/goal", label: "Мои цели" },
  { href: "/stats", label: "Моя статистика" },
  { href: "/curator", label: "Куратор" },
];

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [fio, setFio] = useState("");

  useEffect(() => {
    const storedFio = sessionStorage.getItem("ort_student_fio");
    const email = sessionStorage.getItem("ort_student_email");
    if (!storedFio || !email) {
      router.replace("/");
      return;
    }
    setFio(storedFio);
  }, [router]);

  function logout() {
    sessionStorage.removeItem("ort_student_fio");
    sessionStorage.removeItem("ort_student_email");
    sessionStorage.removeItem("ort_student_group");
    router.push("/");
  }

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-b from-emerald-50 via-slate-50 to-slate-50 md:flex-row">
      <aside className="hidden w-60 flex-none border-r border-slate-200 bg-white/60 px-4 py-6 backdrop-blur md:flex md:flex-col">
        <div className="flex items-center gap-2 px-2">
          <LogoMark size={30} />
          <span className="font-semibold text-slate-900">ProManas</span>
        </div>
        <nav className="mt-8 flex flex-col gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`rounded-lg px-3 py-2 text-sm transition ${
                pathname?.startsWith(link.href)
                  ? "bg-emerald-100 font-medium text-emerald-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto flex flex-col gap-2 px-2 pt-6">
          {fio && <span className="truncate text-xs text-slate-400">{fio}</span>}
          <button
            onClick={logout}
            className="self-start text-sm text-slate-500 transition hover:text-emerald-700"
          >
            Выйти
          </button>
        </div>
      </aside>

      <div className="border-b border-slate-200 bg-white/60 px-4 py-2 backdrop-blur md:hidden">
        <div className="flex items-center gap-1 overflow-x-auto">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`flex-none rounded-full px-3 py-1.5 text-sm transition ${
                pathname?.startsWith(link.href)
                  ? "bg-emerald-100 font-medium text-emerald-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={logout}
            className="ml-auto flex-none rounded-full px-3 py-1.5 text-sm text-slate-500 hover:text-emerald-700"
          >
            Выйти
          </button>
        </div>
      </div>

      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-8 sm:px-8">{children}</main>
    </div>
  );
}
