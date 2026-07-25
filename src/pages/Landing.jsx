import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  PlayCircle, Package, ShoppingCart, Wallet, BarChart3,
  Users, ArrowDownRight
} from "lucide-react";

// Structural note: dropped the gradient-hero -> floating-card ->
// pill-tabs -> gradient-CTA sandwich (that skeleton is what actually
// read as templated, independent of color). This is one continuous
// ruled page instead — a red margin rule and folio numbers carry the
// "ledger" idea through the whole layout, not just one card.

const C = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  success: "#22C55E",
  danger: "#EF4444",
  bg: "#F8FAFC",
  border: "#E2E8F0",
  dark: "#0F172A",
  textSub: "#64748B",
  margin: "#DC5A50", // ledger margin-rule red
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

// Ledger-margin page: a thin red rule near the left edge, running the
// full height of whatever it wraps, with a folio number top-right.
function Page({ folio, children }) {
  return (
    <div className="relative max-w-3xl mx-auto px-6 lg:px-0">
      <div className="absolute top-0 bottom-0 hidden sm:block" style={{ left: "3.25rem", width: 1, backgroundColor: C.margin, opacity: 0.35 }} />
      <div className="flex items-center justify-between pt-10 pb-1 sm:pl-24">
        <span className="text-[10px] font-semibold tracking-[0.2em] text-slate-300 uppercase">Folio {folio}</span>
      </div>
      <div className="sm:pl-24">{children}</div>
    </div>
  );
}

function RuledDivider() {
  return <div className="h-px w-full mt-8 mb-8" style={{ backgroundColor: C.border }} />;
}

export default function Landing() {
  const navigate = useNavigate();
  const [activeModule, setActiveModule] = useState(0);

  return (
    <div style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }} className="min-h-screen w-full">
      {/* =============== HEADER =============== */}
      <div className="border-b" style={{ borderColor: C.border }}>
        <div className="max-w-3xl mx-auto px-6 lg:px-0 flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ backgroundColor: C.primary }}>
              <span className="text-white text-[10px] font-bold">L</span>
            </div>
            <span className="font-semibold text-[14px] text-slate-900">LedgerOS</span>
          </div>
          <button onClick={() => navigate("/login")} className="text-[13px] font-medium text-slate-500 hover:text-slate-900">
            Sign in
          </button>
        </div>
      </div>

      {/* =============== HERO — one gradient moment, tight, tied to Dashboard's identity =============== */}
      <div className="max-w-3xl mx-auto px-6 lg:px-0 pt-12 pb-10 sm:pl-[calc(1.5rem+6rem)]">
        <p className="text-[11px] font-semibold tracking-[0.2em] uppercase mb-3" style={{ color: C.primary }}>LedgerOS</p>
        <h1 className="text-3xl lg:text-[2.5rem] font-semibold text-slate-900 leading-[1.1] tracking-tight max-w-lg">
          The book that balances itself.
        </h1>
        <p className="mt-4 text-slate-500 text-[15px] leading-relaxed max-w-md">
          Log what you bought, log what you sold. LedgerOS keeps the cost, the cash,
          and the profit — correct, every time, without a calculator in sight.
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-5">
          <button onClick={() => navigate("/signup")} className="text-white font-semibold text-sm rounded-xl px-5 py-3" style={{ backgroundColor: C.primary }}>
            Open an account
          </button>
          <button onClick={() => navigate("/tutorial")} className="flex items-center gap-1.5 text-[13px] font-medium text-slate-500 hover:text-slate-900">
            <PlayCircle size={15} /> or see a filled ledger first
          </button>
        </div>
      </div>

      {/* =============== FOLIO I — the worked entry, in normal page flow =============== */}
      <Page folio="I">
        <p className="text-[11px] font-semibold uppercase tracking-wide mb-4" style={{ color: C.primary }}>Specimen entry</p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[420px]">
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
        <RuledDivider />
      </Page>

      {/* =============== FOLIO II — index of modules =============== */}
      <Page folio="II">
        <h2 className="text-xl font-semibold text-slate-900 mb-5">Five sections. One set of books.</h2>
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
        <div className="flex items-start gap-3.5 py-2">
          <span className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.primary}12` }}>
            {(() => { const Icon = modules[activeModule].icon; return <Icon size={17} style={{ color: C.primary }} />; })()}
          </span>
          <p className="text-[14px] text-slate-500 leading-relaxed max-w-md pt-1.5">{modules[activeModule].body}</p>
        </div>
        <RuledDivider />
      </Page>

      {/* =============== FOLIO III — closing line, not a marketing footer =============== */}
      <Page folio="III">
        <div className="flex items-center gap-2 text-slate-400 text-[12px] mb-2">
          <ArrowDownRight size={13} /> Total carried forward
        </div>
        <h2 className="text-xl lg:text-2xl font-semibold text-slate-900 max-w-md leading-snug mb-5">
          Start the ledger your business already deserves.
        </h2>
        <div className="max-w-md pt-4 border-t flex items-center justify-between" style={{ borderColor: C.border }}>
          <span className="text-[12px] text-slate-400">No card required · sample data in the tutorial</span>
          <button onClick={() => navigate("/signup")} className="text-[13.5px] font-semibold underline decoration-2 underline-offset-4" style={{ color: C.primary, textDecorationColor: `${C.primary}55` }}>
            Open an account
          </button>
        </div>
        <div className="pb-16" />
      </Page>
    </div>
  );
}
