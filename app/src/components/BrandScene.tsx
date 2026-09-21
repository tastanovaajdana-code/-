import { Fragment, type ReactNode } from "react";

function OrnamentCurls() {
  const ys = [60, 190, 320, 450, 580, 710, 840, 960];
  return (
    <g opacity={0.16} stroke="white" strokeWidth={2} fill="none">
      {ys.map((y, i) => (
        <path
          key={y}
          transform={`translate(28 ${y}) scale(${i % 2 === 0 ? 1 : -1} 1)`}
          d="M20 2 C30 2 34 12 28 20 C24 26 14 26 12 18 C10 12 14 8 18 10"
        />
      ))}
    </g>
  );
}

function LeftPanel() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-y-0 left-0 -z-10 hidden h-full w-[36%] md:block"
      viewBox="0 0 400 1000"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id="promanas-panel" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#065f46" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
      </defs>
      <path
        d="M0,0 L220,0 C130,120 300,260 190,380 C90,480 320,560 210,680 C110,780 300,860 200,1000 L0,1000 Z"
        fill="url(#promanas-panel)"
      />
      <path
        d="M220,0 C130,120 300,260 190,380 C90,480 320,560 210,680 C110,780 300,860 200,1000"
        fill="none"
        stroke="#d4af6a"
        strokeWidth={3}
        opacity={0.55}
      />
      <OrnamentCurls />
    </svg>
  );
}

function Mountains() {
  return (
    <svg
      aria-hidden
      className="pointer-events-none absolute inset-x-0 bottom-0 -z-20 h-[38%] w-full"
      viewBox="0 0 1440 320"
      preserveAspectRatio="none"
    >
      <polygon points="0,320 0,190 220,90 420,210 640,70 860,200 1080,110 1300,230 1440,150 1440,320" fill="#94a3b8" opacity={0.3} />
      <polygon points="80,110 120,150 40,150" fill="white" opacity={0.5} />
      <polygon points="650,80 700,130 600,130" fill="white" opacity={0.5} />
      <polygon points="1090,120 1130,160 1050,160" fill="white" opacity={0.5} />
      <polygon points="0,320 0,230 260,150 520,250 780,130 1040,230 1300,160 1440,240 1440,320" fill="#5b7a6b" opacity={0.55} />
      <polygon points="0,320 0,270 300,220 600,280 900,210 1200,270 1440,230 1440,320" fill="#3f6152" opacity={0.85} />
    </svg>
  );
}

function Eagle({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 64 64" className={className} fill="currentColor">
      <path d="M32 30 C20 14 4 18 2 22 C10 22 16 26 20 32 C10 32 4 38 2 44 C10 40 18 40 24 36 C26 42 30 48 32 54 C34 48 38 42 40 36 C46 40 54 40 62 44 C60 38 54 32 44 32 C48 26 54 22 62 22 C60 18 44 14 32 30 Z" />
    </svg>
  );
}

function Yurt({ className }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 100 60" className={className} fill="currentColor">
      <path d="M50 2 L50 16" stroke="currentColor" strokeWidth={2} fill="none" opacity={0.5} />
      <path d="M8 58 Q8 26 50 16 Q92 26 92 58 Z" opacity={0.22} />
      <path d="M40 58 L40 38 Q50 32 60 38 L60 58 Z" opacity={0.35} />
    </svg>
  );
}

function SunOrnament({ className }: { className?: string }) {
  const lines = Array.from({ length: 8 }, (_, i) => (i * 360) / 8);
  return (
    <svg aria-hidden viewBox="0 0 100 100" className={className} fill="none" stroke="currentColor">
      <circle cx={50} cy={50} r={34} strokeWidth={1.5} />
      <circle cx={50} cy={50} r={20} strokeWidth={1.5} />
      {lines.map((deg) => (
        <line
          key={deg}
          x1={50}
          y1={50}
          x2={50 + 46 * Math.cos((deg * Math.PI) / 180)}
          y2={50 + 46 * Math.sin((deg * Math.PI) / 180)}
          strokeWidth={1.5}
        />
      ))}
    </svg>
  );
}

export function LogoMark({ size = 64 }: { size?: number }) {
  return (
    <div
      className="flex flex-none items-center justify-center gap-1 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 text-white shadow-lg shadow-emerald-900/20 ring-1 ring-black/5"
      style={{ width: size, height: size }}
    >
      <span className="font-extrabold leading-none" style={{ fontSize: size * 0.34 }}>
        P
      </span>
      <span
        className="bg-white/80"
        style={{ width: Math.max(2, size * 0.03), height: size * 0.5, transform: "rotate(20deg)" }}
      />
      <span className="font-extrabold leading-none" style={{ fontSize: size * 0.34 }}>
        M
      </span>
    </div>
  );
}

const FOOTER_ITEMS = [
  { title: "Билим", subtitle: "сени бийикке жеткирет" },
  { title: "Келечек", subtitle: "сенден башталат" },
  { title: "Манасчылар", subtitle: "ар дайым алдыда" },
];

export function BrandScene({
  children,
  eyebrow,
  showFooter = true,
}: {
  children: ReactNode;
  eyebrow?: string;
  showFooter?: boolean;
}) {
  return (
    <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10 sm:py-14">
      <div
        aria-hidden
        className="absolute inset-0 -z-30 bg-gradient-to-b from-sky-100 via-emerald-50 to-emerald-100"
      />
      <Mountains />
      <LeftPanel />
      <SunOrnament className="pointer-events-none absolute -right-8 -top-8 -z-10 h-40 w-40 text-emerald-900/10 sm:h-52 sm:w-52" />
      <SunOrnament className="pointer-events-none absolute -bottom-10 -right-10 -z-10 h-32 w-32 text-emerald-900/10" />
      <Yurt className="pointer-events-none absolute bottom-[6%] right-[6%] hidden h-16 w-28 text-amber-100/70 sm:block" />
      <Eagle className="pointer-events-none absolute right-[10%] top-[8%] hidden h-14 w-14 -rotate-6 text-slate-700/50 sm:block" />

      <p className="pointer-events-none absolute left-[27%] top-[8%] hidden max-w-[220px] -rotate-3 font-script text-2xl leading-tight text-emerald-900/80 lg:block">
        Улуу максаттар
        <br />
        сени күтүүдө...
      </p>

      <div className="relative z-10 flex flex-col items-center text-center">
        <LogoMark />
        <h1 className="mt-3 text-3xl font-bold tracking-tight text-emerald-950 sm:text-4xl">ProManas</h1>
        <p className="mt-1 text-[11px] font-semibold tracking-[0.3em] text-emerald-800/70">
          {eyebrow ?? "БИЛИМ · КЕЛЕЧЕККЕ ЖОЛ"}
        </p>
      </div>

      <div className="relative z-10 mt-7 w-full max-w-md">{children}</div>

      {showFooter && (
        <div className="relative z-10 mt-9 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-emerald-950/70">
          {FOOTER_ITEMS.map((item, i) => (
            <Fragment key={item.title}>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-900/10">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-700" />
                </span>
                <span>
                  <span className="font-semibold">{item.title}</span> {item.subtitle}
                </span>
              </div>
              {i < FOOTER_ITEMS.length - 1 && <span className="hidden text-emerald-900/20 sm:inline">|</span>}
            </Fragment>
          ))}
        </div>
      )}
    </main>
  );
}
