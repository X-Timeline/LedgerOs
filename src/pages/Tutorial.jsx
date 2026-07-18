import { useState, useEffect } from "react";
import {
  Package, TrendingUp, TrendingDown, RotateCcw, Info, Plus,
  ShoppingBag, Receipt, Wallet
} from "lucide-react";

const C = {
  primary: "#2563EB",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  bg: "#F8FAFC",
  textSub: "#64748B",
  border: "#E2E8F0",
};

const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");
const STORAGE_KEY = "ledgeros-tutorial-purchases";

// Dummy baseline sales/expenses so the P&L has something to react to
const BASE_SALES = 640000;
const BASE_COGS = 410000;
const BASE_EXPENSES = 96000;

export default function Tutorial() {
  const [tab, setTab] = useState("purchase");
  const [purchases, setPurchases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ product: "", qty: "", unit: "carton", cost: "" });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPurchases(JSON.parse(raw));
    } catch {
      // no saved data yet, or storage unavailable — that's fine
    } finally {
      setLoading(false);
    }
  }, []);

  const save = (next) => {
    setPurchases(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // tutorial-only, safe to ignore storage failures
    }
  };

  const addPurchase = () => {
    if (!form.product || !form.qty || !form.cost) return;
    const entry = {
      id: Date.now(),
      product: form.product,
      qty: Number(form.qty),
      unit: form.unit,
      cost: Number(form.cost),
    };
    save([entry, ...purchases]);
    setForm({ product: "", qty: "", unit: "carton", cost: "" });
  };

  const resetTutorial = () => save([]);

  const totalPurchaseCost = purchases.reduce((s, p) => s + p.cost, 0);
  const sales = BASE_SALES;
  const cogs = BASE_COGS + totalPurchaseCost * 0.35; // dummy: some of new stock assumed sold
  const grossProfit = sales - cogs;
  const expenses = BASE_EXPENSES;
  const netProfit = grossProfit - expenses;

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-10">
        <div className="flex items-start justify-between mb-1">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Tutorial Sandbox</h1>
            <p className="text-xs text-slate-400">Sample data only — nothing here touches your real business</p>
          </div>
          <button onClick={resetTutorial} className="flex items-center gap-1.5 text-xs font-medium text-slate-500 border rounded-lg px-2.5 py-1.5 hover:bg-white" style={{ borderColor: C.border }}>
            <RotateCcw size={12} /> Reset
          </button>
        </div>

        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5 mt-4 mb-5">
          <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            Try logging a purchase below, then check the Trading P&L tab to see how it feeds into
            your profit numbers — the same way it will once you're running a real shop.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit">
          {[
            { key: "purchase", label: "Record Purchase", icon: ShoppingBag },
            { key: "pnl", label: "Trading P&L", icon: TrendingUp },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg ${
                tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {/* ---------- Record Purchase ---------- */}
        {tab === "purchase" && (
          <div className="space-y-5">
            <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Log a stock purchase</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Product name</label>
                  <input
                    value={form.product}
                    onChange={(e) => setForm({ ...form, product: e.target.value })}
                    placeholder="e.g. Golden Morn"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-blue-400"
                    style={{ borderColor: C.border }}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Quantity bought</label>
                    <input
                      type="number"
                      value={form.qty}
                      onChange={(e) => setForm({ ...form, qty: e.target.value })}
                      placeholder="5"
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-blue-400"
                      style={{ borderColor: C.border }}
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-medium text-slate-500 block mb-1">Unit</label>
                    <select
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-blue-400 bg-white"
                      style={{ borderColor: C.border }}
                    >
                      <option value="carton">carton</option>
                      <option value="bag">bag</option>
                      <option value="crate">crate</option>
                      <option value="pack">pack</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Total amount paid</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                    <input
                      type="number"
                      value={form.cost}
                      onChange={(e) => setForm({ ...form, cost: e.target.value })}
                      placeholder="15,000"
                      className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-400"
                      style={{ borderColor: C.border }}
                    />
                  </div>
                </div>
                <button
                  onClick={addPurchase}
                  className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white mt-1"
                  style={{ backgroundColor: C.primary }}
                >
                  <Plus size={15} /> Add Purchase
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-medium text-slate-500 mb-2">
                {loading ? "Loading…" : `${purchases.length} logged this session`}
              </h4>
              <div className="space-y-2">
                {purchases.map((p) => (
                  <div key={p.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3" style={{ borderColor: C.border }}>
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.warning}14` }}>
                        <Package size={14} style={{ color: C.warning }} />
                      </span>
                      <div>
                        <p className="text-[13px] font-medium text-slate-900">{p.product}</p>
                        <p className="text-[11px] text-slate-400">{p.qty} {p.unit}{p.qty === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                    <span className="text-[13px] font-semibold tabular-nums text-slate-900">{naira(p.cost)}</span>
                  </div>
                ))}
                {!loading && purchases.length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-6">No purchases logged yet — try adding one above.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ---------- Trading P&L ---------- */}
        {tab === "pnl" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Trading Account — this period</h3>
              <p className="text-[11px] text-slate-400 mb-4">Sample figures, adjusted by what you've logged in this session</p>
              <div className="space-y-3">
                {[
                  { label: "Sales", value: sales, positive: true },
                  { label: "Cost of Goods Sold", value: -cogs, positive: false },
                ].map((r) => (
                  <div key={r.label} className="flex items-center justify-between text-[13px]">
                    <span className="text-slate-600">{r.label}</span>
                    <span className={`font-medium tabular-nums ${r.positive ? "text-slate-900" : "text-red-500"}`}>
                      {r.positive ? naira(r.value) : `(${naira(Math.abs(r.value))})`}
                    </span>
                  </div>
                ))}
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-slate-900">Gross Profit</span>
                  <span className="tabular-nums" style={{ color: grossProfit >= 0 ? C.success : C.danger }}>{naira(grossProfit)}</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="text-slate-600">Expenses</span>
                  <span className="font-medium tabular-nums text-red-500">({naira(expenses)})</span>
                </div>
                <div className="h-px bg-slate-100" />
                <div className="flex items-center justify-between text-base font-semibold">
                  <span className="text-slate-900">Net Profit</span>
                  <span className="tabular-nums" style={{ color: netProfit >= 0 ? C.success : C.danger }}>{naira(netProfit)}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white border p-4" style={{ borderColor: C.border }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${C.primary}14` }}>
                  <Wallet size={14} style={{ color: C.primary }} />
                </span>
                <p className="text-[11px] text-slate-500">New stock this session</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">{naira(totalPurchaseCost)}</p>
              </div>
              <div className="rounded-2xl bg-white border p-4" style={{ borderColor: C.border }}>
                <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${netProfit >= 0 ? C.success : C.danger}14` }}>
                  {netProfit >= 0 ? <TrendingUp size={14} style={{ color: C.success }} /> : <TrendingDown size={14} style={{ color: C.danger }} />}
                </span>
                <p className="text-[11px] text-slate-500">Margin</p>
                <p className="text-sm font-semibold tabular-nums text-slate-900">{sales ? ((netProfit / sales) * 100).toFixed(1) : 0}%</p>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center px-4">
              In your real account, this same report runs off actual sales and purchase lots —
              day, month, or year, any range you choose.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
