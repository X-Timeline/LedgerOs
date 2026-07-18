import { useState, useEffect } from "react";
import {
  Wallet, Package, ShoppingCart, TrendingUp, ArrowRight, PlayCircle,
  Sparkles, ShieldCheck, Smartphone, LineChart
} from "lucide-react";

const C = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  success: "#22C55E",
  warning: "#F59E0B",
  bg: "#F8FAFC",
  textSub: "#64748B",
  border: "#E2E8F0",
};

const GraphPaper = ({ className = "" }) => (
  <svg className={className} width="100%" height="100%" preserveAspectRatio="none">
    <defs>
      <pattern id="grid" width="28" height="28" patternUnits="userSpaceOnUse">
        <path d="M 28 0 L 0 0 0 28" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#grid)" />
  </svg>
);

function FlowCard({ icon: Icon, label, value, sub, accent, i, floatDelay }) {
  return (
    <div
      className="rounded-2xl bg-white px-4 py-3.5 shadow-xl w-40 opacity-0"
      style={{
        animation: `fadeUp 500ms ease-out ${i * 150}ms forwards, float 4s ease-in-out ${floatDelay}s infinite`,
      }}
    >
      <div className="flex items-center gap-2 mb-1.5">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${accent}16` }}>
          <Icon size={14} style={{ color: accent }} />
        </span>
        <span className="text-[11px] font-medium text-slate-500">{label}</span>
      </div>
      <p className="text-sm font-semibold text-slate-900 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
}

export default function Landing() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const steps = [
    { icon: Wallet, label: "Capital In", value: "₦1,000,000", sub: "Opening balance", accent: C.primary },
    { icon: Package, label: "Stock Bought", value: "5 cartons", sub: "Golden Morn · ₦15,000", accent: C.warning },
    { icon: ShoppingCart, label: "Sale Made", value: "₦8,000", sub: "1 carton sold", accent: C.primary },
    { icon: TrendingUp, label: "Profit", value: "+₦3,400", sub: "Calculated for you", accent: C.success },
  ];

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
      `}</style>

      {/* ---------- Hero ---------- */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(155deg, ${C.primaryDark}, ${C.primary} 55%, #3B82F6)` }}>
        <GraphPaper className="absolute inset-0 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)" }} />

        <div className="relative max-w-6xl mx-auto px-5 lg:px-8 pt-8 pb-16 lg:pt-10 lg:pb-24">
          <div className="flex items-center gap-2 mb-14">
            <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
              <span className="text-blue-600 text-xs font-bold">L</span>
            </div>
            <span className="text-white font-semibold text-[15px]">LedgerOS</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-100 bg-white/10 border border-white/15 rounded-full px-3 py-1 mb-5">
                <Sparkles size={12} /> Built for African SMEs
              </span>
              <h1 className="text-3xl lg:text-[2.75rem] font-semibold text-white leading-[1.1] tracking-tight">
                Run your business from anywhere.
              </h1>
              <p className="mt-4 text-blue-100 text-[15px] leading-relaxed max-w-md">
                Log a purchase, make a sale — LedgerOS handles the calculations, tracks your stock,
                and keeps your books, so you never lose an account book again.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <button className="flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm rounded-xl px-5 py-3.5 hover:bg-blue-50">
                  Get Started <ArrowRight size={16} />
                </button>
                <button className="flex items-center gap-2 border border-white/40 text-white font-semibold text-sm rounded-xl px-5 py-3.5 hover:bg-white/10">
                  <PlayCircle size={17} /> Try the Tutorial
                </button>
              </div>
              <p className="mt-4 text-[12px] text-blue-200">No card required · Tutorial uses sample data only</p>
            </div>

            {/* Illustrated flow: Capital -> Stock -> Sale -> Profit */}
            <div className="relative h-[360px] hidden sm:block">
              <div className="absolute inset-0" style={{
                backgroundImage: "repeating-linear-gradient(90deg, rgba(255,255,255,0.25) 0 8px, transparent 8px 16px)",
                height: 2, top: "50%",
              }} />
              {mounted && (
                <>
                  <div className="absolute top-6 left-2"><FlowCard {...steps[0]} i={0} floatDelay={0} /></div>
                  <div className="absolute top-32 left-40"><FlowCard {...steps[1]} i={1} floatDelay={0.6} /></div>
                  <div className="absolute top-4 right-8"><FlowCard {...steps[2]} i={2} floatDelay={1.1} /></div>
                  <div className="absolute bottom-4 right-24"><FlowCard {...steps[3]} i={3} floatDelay={1.6} /></div>
                </>
              )}
              <ArrowRight size={20} className="absolute top-[46%] left-[36%] text-white/50 rotate-12" />
              <ArrowRight size={20} className="absolute top-[30%] left-[68%] text-white/50 -rotate-12" />
              <ArrowRight size={20} className="absolute top-[62%] left-[80%] text-white/50 rotate-45" />
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Why LedgerOS ---------- */}
      <div className="max-w-6xl mx-auto px-5 lg:px-8 py-14 lg:py-20">
        <h2 className="text-xl font-semibold text-slate-900 text-center mb-2">No more notebooks, no more guesswork</h2>
        <p className="text-sm text-slate-500 text-center max-w-lg mx-auto mb-10">
          Every sale, purchase, and cedi in or out is recorded automatically — so your accounts
          are always current, and never lost.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: LineChart, title: "Profit, calculated for you", body: "Cost tracked per batch, profit worked out on every sale — no manual math." },
            { icon: ShieldCheck, title: "Cash & bank, never confused", body: "A two-column cash book keeps cash-in-hand and bank balance always accurate." },
            { icon: Smartphone, title: "Install it like an app", body: "Works as a PWA on any phone — no app store, no heavy download." },
          ].map((f) => (
            <div key={f.title} className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${C.primary}12` }}>
                <f.icon size={17} style={{ color: C.primary }} />
              </span>
              <h3 className="text-[13.5px] font-semibold text-slate-900 mb-1">{f.title}</h3>
              <p className="text-[13px] text-slate-500 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <button className="flex items-center gap-2 text-white font-semibold text-sm rounded-xl px-5 py-3" style={{ backgroundColor: C.primary }}>
            Create your business <ArrowRight size={16} />
          </button>
          <button className="flex items-center gap-2 text-slate-600 font-medium text-sm rounded-xl px-5 py-3 border" style={{ borderColor: C.border }}>
            <PlayCircle size={16} /> Explore the tutorial first
          </button>
        </div>
      </div>
    </div>
  );
}
