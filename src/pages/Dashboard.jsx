import { useOutletContext, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import {
  Plus, TrendingUp, Wallet, Landmark,
  Boxes, AlertTriangle, ArrowDownRight, ArrowUpRight, ChevronRight, Receipt, AlertCircle
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";
import { api } from "../lib/api.js";

// ---------- tokens ----------
const C = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  dark: "#0F172A",
  text: "#0F172A",
  textSub: "#64748B",
  border: "#E2E8F0",
};

const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

// Sample weekly trend — no backend endpoint returns a daily time-series yet,
// only period totals. Flagged clearly rather than presented as real.
const sampleTrend = [
  { d: "Mon", revenue: 182000, expenses: 64000 },
  { d: "Tue", revenue: 145000, expenses: 51000 },
  { d: "Wed", revenue: 221000, expenses: 73000 },
  { d: "Thu", revenue: 198000, expenses: 68000 },
  { d: "Fri", revenue: 267000, expenses: 82000 },
  { d: "Sat", revenue: 312000, expenses: 91000 },
  { d: "Sun", revenue: 204000, expenses: 58000 },
];

// ---------- graph-paper texture (ledger motif) ----------
const GraphPaper = ({ className = "" }) => (
  <svg className={className} width="100%" height="100%" preserveAspectRatio="none">
    <defs>
      <pattern id="ledgerGrid" width="24" height="24" patternUnits="userSpaceOnUse">
        <path d="M 24 0 L 0 0 0 24" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
      </pattern>
    </defs>
    <rect width="100%" height="100%" fill="url(#ledgerGrid)" />
  </svg>
);

function StatCard({ label, value, icon: Icon, accent, i }) {
  return (
    <div
      className="rounded-2xl bg-white border border-slate-200 p-4 opacity-0"
      style={{
        boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)",
        animation: `fadeUp 400ms ease-out ${i * 45}ms forwards`,
      }}
    >
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-medium text-slate-500">{label}</span>
        <span className="flex items-center justify-center rounded-lg w-8 h-8 shrink-0" style={{ backgroundColor: `${accent}14` }}>
          <Icon size={16} style={{ color: accent }} strokeWidth={2.25} />
        </span>
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-slate-900">{naira(value)}</div>
    </div>
  );
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-slate-900 text-white text-xs px-3 py-2 shadow-lg">
      <div className="font-medium mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
          <span className="text-slate-300 capitalize">{p.dataKey}</span>
          <span className="font-medium tabular-nums ml-auto">{naira(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [tab, setTab] = useState("stock");
  const navigate = useNavigate();
  const { selectedShop, businessId } = useOutletContext();
  const isAllShops = selectedShop?.id === "all";
  const shopId = !isAllShops ? selectedShop?.id : null;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trading, setTrading] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const tabs = [
    { key: "stock", label: "Low Stock" },
    { key: "sales", label: "Latest Sales" },
  ];

  const refresh = useCallback(() => {
    if (isAllShops && !businessId) return;
    if (!isAllShops && !shopId) return;

    setLoading(true);
    const now = new Date().toISOString();
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const start = startOfToday.toISOString();

    const scopeParam = isAllShops ? `businessId=${businessId}` : `shopId=${shopId}`;
    const prefix = isAllShops ? '/reports/business' : '/reports';
    const bsQuery = isAllShops ? `${scopeParam}&asOf=${now}` : `${scopeParam}&asOf=${now}`;

    Promise.all([
      api.get(`${prefix}/trading-account?${scopeParam}&start=${start}&end=${now}`),
      api.get(`${prefix}/profit-and-loss?${scopeParam}&start=${start}&end=${now}`),
      api.get(`${prefix}/balance-sheet?${bsQuery}`),
      api.get(`/products?${scopeParam}`),
      api.get(`/sales?${scopeParam}`),
    ])
      .then(([tradingData, pnlData, bsData, productsData, salesData]) => {
        setLoading(false);
        setTrading(tradingData);
        setPnl(pnlData);
        setBalanceSheet(bsData);
        setProducts(productsData || []);
        setSales(salesData || []);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, [shopId, isAllShops, businessId]);

  useEffect(() => { refresh(); }, [refresh]);

  if (isAllShops && !businessId) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4">
        <p className="text-sm text-slate-400">Loading business data…</p>
      </div>
    );
  }

  if (loading || !trading || !pnl || !balanceSheet) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4">
        {error ? (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 max-w-sm">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Loading…</p>
        )}
      </div>
    );
  }

  const stats = [
    { label: "Today's Sales", value: trading.totalSales, icon: TrendingUp, accent: C.primary },
    { label: "Today's Profit", value: pnl.netProfit, icon: Wallet, accent: C.success },
    { label: "Today's Expenses", value: pnl.totalExpenses, icon: Receipt, accent: C.warning },
    { label: "Cash on Hand", value: balanceSheet.cash, icon: Landmark, accent: C.primary },
    { label: "Bank Balance", value: balanceSheet.bank, icon: Landmark, accent: C.primary },
    { label: "Inventory Value", value: balanceSheet.inventoryValue, icon: Boxes, accent: C.dark },
    { label: "Outstanding Debt", value: balanceSheet.customerDebtOwed, icon: ArrowDownRight, accent: C.danger },
    { label: "Owed to Suppliers", value: balanceSheet.liabilities, icon: ArrowUpRight, accent: C.warning },
  ];

  const lowStock = products
    .map((p) => ({
      name: p.name,
      left: (p.purchase_lots || []).reduce((s, l) => s + Number(l.remaining_quantity), 0),
      unit: p.base_unit,
    }))
    .filter((p) => p.left <= 5)
    .slice(0, 6);

  const latestSales = sales.slice(0, 6).map((s) => ({
    who: s.customers?.name || "Walk-in customer",
    amount: Number(s.total_amount),
    method: s.channel,
    time: new Date(s.created_at).toLocaleString("en-NG", { hour: "numeric", minute: "2-digit", day: "numeric", month: "short" }),
  }));

  return (
    <>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
      <main className="p-4 lg:p-8 space-y-6">
        {/* Hero: Today snapshot (signature element) */}
        <div className="relative overflow-hidden rounded-3xl px-5 py-6 lg:px-8 lg:py-7" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }}>
          <GraphPaper className="absolute inset-0 pointer-events-none" />
          <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
            <div>
              <p className="text-blue-100 text-[13px] font-medium">
                {isAllShops ? "Here's your business today (all shops combined)" : `Here's ${selectedShop.name} today`}
              </p>
              <p className="mt-1 text-white text-3xl lg:text-4xl font-semibold tabular-nums tracking-tight">
                {naira(trading.totalSales)}
                <span className="text-blue-200 text-base font-medium ml-2">sold so far</span>
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[
                  { l: "Profit", v: pnl.netProfit },
                  { l: "Expenses", v: pnl.totalExpenses },
                  { l: "Cash balance", v: balanceSheet.cash },
                ].map((c) => (
                  <div key={c.l} className="rounded-xl px-3 py-1.5 bg-white/10 border border-white/15">
                    <span className="text-blue-100 text-[11px] block leading-tight">{c.l}</span>
                    <span className="text-white text-sm font-semibold tabular-nums">{naira(c.v)}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => navigate("/pos")} className="flex items-center justify-center gap-2 bg-white text-blue-600 font-semibold text-sm rounded-xl px-4 py-3 hover:bg-blue-50 shrink-0">
              <Plus size={17} strokeWidth={2.5} />
              New Sale
            </button>
          </div>
        </div>

        {/* Stat grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} i={i} />
          ))}
        </div>

        {/* Charts + side panel */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Revenue chart */}
          <div className="xl:col-span-2 rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)" }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Revenue vs Expenses</h3>
                <p className="text-xs text-slate-400">Sample trend — daily breakdown isn't available from the backend yet</p>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.primary }} />Revenue</span>
                <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.warning }} />Expenses</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={sampleTrend} margin={{ left: -18, right: 8 }}>
                <defs>
                  <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={C.primary} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={C.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 12, fill: C.textSub }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: C.textSub }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke={C.primary} strokeWidth={2.5} fill="url(#rev)" />
                <Area type="monotone" dataKey="expenses" stroke={C.warning} strokeWidth={2} fillOpacity={0} strokeDasharray="4 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tabbed side panel */}
          <div className="rounded-2xl bg-white border p-5 flex flex-col" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)" }}>
            <div className="flex gap-1 mb-4 flex-wrap">
              {tabs.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`text-xs font-medium px-2.5 py-1.5 rounded-lg ${
                    tab === t.key ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <div className="space-y-3 flex-1">
              {tab === "stock" && lowStock.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">Nothing running low right now.</p>
              )}
              {tab === "stock" &&
                lowStock.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${C.warning}14` }}>
                        <AlertTriangle size={14} style={{ color: C.warning }} />
                      </span>
                      <span className="text-[13px] text-slate-700 truncate">{s.name}</span>
                    </div>
                    <span className="text-xs font-medium text-slate-500 shrink-0">{s.left} {s.unit} left</span>
                  </div>
                ))}

              {tab === "sales" && latestSales.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-6">No sales recorded yet.</p>
              )}
              {tab === "sales" &&
                latestSales.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[13px] font-medium text-slate-700 truncate">{s.who}</p>
                      <p className="text-[11px] text-slate-400">{s.method} · {s.time}</p>
                    </div>
                    <span className="text-[13px] font-semibold tabular-nums text-slate-900 shrink-0">{naira(s.amount)}</span>
                  </div>
                ))}
            </div>

            <button onClick={() => navigate(tab === "stock" ? "/inventory" : "/pos")} className="mt-4 w-full flex items-center justify-center gap-1 text-xs font-medium text-blue-600 py-2 rounded-xl hover:bg-blue-50">
              View all <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </main>
    </>
  );
}
