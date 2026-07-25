import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight, PlayCircle, Package, ShoppingCart, Wallet, BarChart3,
  Users, CheckCircle2
} from "lucide-react";

// Design direction: same materials as the rest of the app (Inter, light
// background, rounded-2xl white cards, blue primary, the graph-paper
// texture already used on Dashboard's hero) — but the content stays
// product-specific rather than generic: a real worked ledger example
// instead of marketing copy, and the actual five modules instead of
// abstract "features."

const C = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  bg: "#F8FAFC",
  border: "#E2E8F0",
  dark: "#0F172A",
  textSub: "#64748B",
};

const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

const ledgerRows = [
  { date: "03 Jul", particulars: "Capital brought in", debit: null, credit: 1000000, balance: 1000000 },
  { date: "04 Jul", particulars: "Bought Golden Morn — 5 cartons", debit: 75000, credit: null, balance: 925000 },
  { date: "06 Jul", particulars: "Sold 2 cartons, cash", debit: null, credit: 40000, balance: 965000 },
  { date: "06 Jul", particulars: "Sold 1 carton, on credit — Mrs Adeyemi", debit: null, credit: 20000, balance: 985000, note: true },
];

const modules = [
  { key: "stock", icon: Package, label: "Purchases & Stock", body: "Every batch keeps its own cost. FIFO, LIFO, or weighted average — set per product, applied automatically on every sale." },
  { key: "sales", icon: ShoppingCart, label: "Sales (POS)", body: "Ring up a sale in seconds. Cash, transfer, or credit — profit is worked out the moment the sale is completed, never guessed." },
  { key: "cash", icon: Wallet, label: "Cash Book", body: "Cash and bank are kept apart and reconciled continuously, down to the last transfer between them." },
  { key: "debtors", icon: Users, label: "Debtors & Suppliers", body: "Know exactly who owes you, and who you owe, at any moment — not just at month end." },
  { key: "reports", icon: BarChart3, label: "Reports", body: "Trading account, profit & loss, balance sheet — read live from your books, never a stale export." },
];

// The exact texture used on Dashboard's hero band — reused here so the
// two screens are visibly the same product, not two different ones.
const GraphPaper = ({ className = "" }) => (
  <svg className={className} width="100%" height="100%" preserveAspectRatio="none">
    <defs>
      <pattern id="ledgerGridLanding" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#ledgerGridLanding)" />
  </svg>
);

export default function Landing() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(0);

  return (
    <div style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }} className="min-h-screen w-full">
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      {/* =============== HERO =============== */}
      <div className="relative overflow-hidden" style={{ background: `linear-gradient(155deg, ${C.primaryDark}, ${C.primary} 60%, #3B82F6)` }}>
        <GraphPaper className="absolute inset-0 pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full" style={{ background: "radial-gradient(circle, rgba(255,255,255,0.14), transparent 70%)" }} />

        <div className="relative max-w-5xl mx-auto px-4 lg:px-8">
          <div className="flex items-center justify-between pt-6 pb-5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
                <span className="text-blue-600 text-xs font-bold">L</span>
              </div>
              <span className="text-white font-semibold text-[15px]">LedgerOS</span>
            </div>
            <button onClick={() => navigate("/login")} className="text-[13px] font-medium text-blue-100 hover:text-white">
              Sign in
            </button>
          </div>

          <div className="pt-6 pb-14 lg:pt-10 lg:pb-20 max-w-xl">
            <h1 className="text-3xl lg:text-[2.6rem] font-semibold text-white leading-[1.1] tracking-tight">
              The book that balances itself.
            </h1>
            <p className="mt-4 text-blue-100 text-[15px] leading-relaxed max-w-md">
              Log what you bought, log what you sold. LedgerOS keeps the cost, the cash,
              and the profit — correct, every time, without a calculator in sight.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <button onClick={() => navigate("/signup")} className="flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm rounded-xl px-5 py-3 hover:bg-blue-50">
                Open an account <ArrowRight size={16} />
              </button>
              <button onClick={() => navigate("/tutorial")} className="flex items-center gap-2 border border-white/40 text-white font-semibold text-sm rounded-xl px-5 py-3 hover:bg-white/10">
                <PlayCircle size={17} /> See a filled ledger
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* =============== WORKED EXAMPLE — real content, standard card =============== */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 -mt-8 lg:-mt-10 relative z-10">
        <div className="rounded-2xl bg-white border p-5 lg:p-7" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.08)" }}>
          <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-4">Ledger No. 1 — Specimen Entry</p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[480px]">
              <thead>
                <tr className="text-left border-b" style={{ borderColor: C.border }}>
                  <th className="text-[11px] uppercase tracking-wide font-medium text-slate-400 pb-2 pr-2">Date</th>
                  <th className="text-[11px] uppercase tracking-wide font-medium text-slate-400 pb-2">Particulars</th>
                  <th className="text-[11px] uppercase tracking-wide font-medium text-slate-400 pb-2 text-right pl-2">Debit</th>
                  <th className="text-[11px] uppercase tracking-wide font-medium text-slate-400 pb-2 text-right pl-2">Credit</th>
                  <th className="text-[11px] uppercase tracking-wide font-medium text-slate-400 pb-2 text-right pl-2">Balance</th>
                </tr>
              </thead>
              <tbody>
                {ledgerRows.map((r, i) => (
                  <tr key={i} className="border-b last:border-b-0" style={{ borderColor: "#F1F5F9" }}>
                    <td className="text-[12px] py-2.5 pr-2 align-top text-slate-400 whitespace-nowrap">{r.date}</td>
                    <td className="text-[13px] py-2.5 align-top text-slate-700">
                      {r.particulars}
                      {r.note && <span className="text-slate-400"> *</span>}
                    </td>
                    <td className="text-[12.5px] py-2.5 pl-2 align-top text-right tabular-nums" style={{ color: C.danger }}>{r.debit ? naira(r.debit) : ""}</td>
                    <td className="text-[12.5px] py-2.5 pl-2 align-top text-right tabular-nums" style={{ color: C.success }}>{r.credit ? naira(r.credit) : ""}</td>
                    <td className="text-[12.5px] py-2.5 pl-2 align-top text-right tabular-nums font-medium text-slate-900">{naira(r.balance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: C.border }}>
            <span className="text-[11.5px] text-slate-400 italic">* owed by customer, not yet received</span>
            <span className="text-[13px] font-semibold text-slate-900">Gross profit&nbsp; {naira(15000)}</span>
          </div>
        </div>
      </div>

      {/* =============== MODULE INDEX — same tab pattern used across the app =============== */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 py-14 lg:py-20">
        <p className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide mb-2">Index</p>
        <h2 className="text-xl lg:text-2xl font-semibold text-slate-900 mb-6">Five sections. One set of books.</h2>

        <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {modules.map((m, i) => (
            <button
              key={m.key}
              onClick={() => setActiveModule(i)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg ${
                activeModule === i ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <m.icon size={13} /> {m.label}
            </button>
          ))}
        </div>

        <div className="rounded-2xl bg-white border p-6 lg:p-8" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
          <div className="flex items-start gap-4">
            <span className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.primary}12` }}>
              {(() => { const Icon = modules[activeModule].icon; return <Icon size={20} style={{ color: C.primary }} />; })()}
            </span>
            <div>
              <h3 className="text-base font-semibold text-slate-900 mb-1.5">{modules[activeModule].label}</h3>
              <p className="text-[14px] text-slate-500 leading-relaxed max-w-md">{modules[activeModule].body}</p>
            </div>
          </div>
        </div>
      </div>

      {/* =============== CLOSING =============== */}
      <div className="max-w-5xl mx-auto px-4 lg:px-8 pb-16 lg:pb-24">
        <div className="rounded-3xl px-6 py-12 lg:py-16 flex flex-col items-center text-center relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }}>
          <GraphPaper className="absolute inset-0 pointer-events-none" />
          <div className="relative">
            <p className="flex items-center justify-center gap-1.5 text-[11px] font-medium text-blue-100 uppercase tracking-wide mb-3">
              <CheckCircle2 size={13} /> Brought forward · Carried forward · Never lost
            </p>
            <h2 className="text-xl lg:text-2xl font-semibold text-white max-w-lg leading-snug mb-7">
              Start the ledger your business already deserves.
            </h2>
            <button onClick={() => navigate("/signup")} className="flex items-center gap-2 bg-white text-blue-600 font-semibold text-sm rounded-xl px-5 py-3 mx-auto hover:bg-blue-50">
              Open an account <ArrowRight size={16} />
            </button>
            <p className="text-[12px] text-blue-100 mt-5">No card required · Tutorial uses sample data only</p>
          </div>
        </div>
      </div>
    </div>
  );
}
