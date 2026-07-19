import { useState } from "react";
import { BarChart3, TrendingUp, Scale, Clock, AlertTriangle } from "lucide-react";

const C = { primary: "#2563EB", success: "#22C55E", warning: "#F59E0B", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

// Mock figures — in the real app these are live-computed from the ledger, not stored
const trading = { sales: 3120000, cogs: 1980000, expenses: 480000 };
const balanceSheet = {
  cash: 412300, bank: 1284000, inventory: 3120000, debtors: 96500,
  payables: 145000, openingCapital: 5000000,
};

const agingProducts = [
  { name: "Golden Morn", daysSince: 8, moving: "fast" },
  { name: "Peak Milk 400g", daysSince: 14, moving: "normal" },
  { name: "Indomie Super Pack", daysSince: 5, moving: "fast" },
  { name: "Dangote Sugar 1kg", daysSince: 62, moving: "slow" },
  { name: "Kellogg's Corn Flakes", daysSince: 91, moving: "dead" },
];

const movingMeta = {
  fast: { label: "Fast-moving", color: C.success },
  normal: { label: "Normal", color: C.primary },
  slow: { label: "Slow-moving", color: C.warning },
  dead: { label: "Dead stock", color: C.danger },
};

export default function Reports() {
  const [tab, setTab] = useState("trading");

  const grossProfit = trading.sales - trading.cogs;
  const netProfit = grossProfit - trading.expenses;

  const assets = balanceSheet.cash + balanceSheet.bank + balanceSheet.inventory + balanceSheet.debtors;
  const liabilities = balanceSheet.payables;
  const equity = assets - liabilities;
  const reconciled = balanceSheet.openingCapital + netProfit;

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <p className="text-xs text-slate-400 mb-4">Chase Furniture · Year to date</p>

        <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {[
            { key: "trading", label: "Trading Account", icon: TrendingUp },
            { key: "balance", label: "Balance Sheet", icon: Scale },
            { key: "aging", label: "Inventory Aging", icon: Clock },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "trading" && (
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Trading Account & P&L</h3>
            <div className="space-y-3">
              <Row label="Sales" value={trading.sales} />
              <Row label="Cost of Goods Sold" value={-trading.cogs} negative />
              <Divider />
              <Row label="Gross Profit" value={grossProfit} bold />
              <Row label="Expenses" value={-trading.expenses} negative />
              <Divider />
              <Row label="Net Profit" value={netProfit} bold big color={netProfit >= 0 ? C.success : C.danger} />
            </div>
          </div>
        )}

        {tab === "balance" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Balance Sheet</h3>
              <p className="text-[11px] text-slate-400 mb-4">Snapshot as of today</p>

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Assets</p>
              <div className="space-y-2 mb-4">
                <Row label="Cash on Hand" value={balanceSheet.cash} small />
                <Row label="Bank Balance" value={balanceSheet.bank} small />
                <Row label="Inventory (at cost)" value={balanceSheet.inventory} small />
                <Row label="Owed by Customers" value={balanceSheet.debtors} small />
              </div>
              <Divider />
              <Row label="Total Assets" value={assets} bold />

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-4 mb-2">Liabilities</p>
              <Row label="Owed to Suppliers" value={liabilities} small />
              <Divider />
              <Row label="Total Liabilities" value={liabilities} bold />

              <Divider />
              <Row label="Equity (Assets − Liabilities)" value={equity} bold big color={C.primary} />
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-[12px] text-blue-700 leading-relaxed">
                Reconciliation check: opening capital ({naira(balanceSheet.openingCapital)}) + net profit
                ({naira(netProfit)}) = <span className="font-semibold">{naira(reconciled)}</span>.
                {" "}This should match Equity above{equity === reconciled ? " — it does." : `; currently off by ${naira(Math.abs(equity - reconciled))}, worth checking for an unrecorded entry.`}
              </p>
            </div>
          </div>
        )}

        {tab === "aging" && (
          <div className="space-y-2">
            {agingProducts.map((p) => {
              const meta = movingMeta[p.moving];
              return (
                <div key={p.name} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                  <div className="flex items-center gap-3">
                    {(p.moving === "slow" || p.moving === "dead") && <AlertTriangle size={15} style={{ color: meta.color }} />}
                    <div>
                      <p className="text-[13.5px] font-medium text-slate-900">{p.name}</p>
                      <p className="text-[11px] text-slate-400">{p.daysSince} days since oldest unsold lot</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: meta.color, backgroundColor: `${meta.color}14` }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
            <p className="text-[11px] text-slate-400 text-center pt-2 px-4">
              Flags stock that's been sitting for a while — money tied up in something that isn't converting to cash.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, negative, bold, big, small, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${small ? "text-[12.5px]" : "text-[13px]"} ${bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>{label}</span>
      <span
        className={`${big ? "text-base" : small ? "text-[12.5px]" : "text-[13px]"} font-semibold tabular-nums`}
        style={{ color: color || (negative ? C.danger : "#0F172A") }}
      >
        {negative ? `(${naira(Math.abs(value))})` : naira(value)}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-slate-100 my-2" />;
}
