import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, FileText, Users, Truck, Package,
  ShoppingBag, Receipt, BarChart3, UserCog, Settings, HelpCircle,
  Search, Bell, Plus, TrendingUp, TrendingDown, Wallet, Landmark,
  Boxes, AlertTriangle, ArrowUpRight, ArrowDownRight, Menu, X, ChevronRight
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid
} from "recharts";

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

const naira = (n) =>
  "₦" + Math.round(n).toLocaleString("en-NG");

// ---------- mock data ----------
const revenueData = [
  { d: "Mon", revenue: 182000, expenses: 64000 },
  { d: "Tue", revenue: 145000, expenses: 51000 },
  { d: "Wed", revenue: 221000, expenses: 73000 },
  { d: "Thu", revenue: 198000, expenses: 68000 },
  { d: "Fri", revenue: 267000, expenses: 82000 },
  { d: "Sat", revenue: 312000, expenses: 91000 },
  { d: "Sun", revenue: 204000, expenses: 58000 },
];

const stats = [
  { label: "Today's Sales", value: 204000, delta: 12.4, up: true, icon: TrendingUp, accent: C.primary },
  { label: "Today's Profit", value: 84500, delta: 8.1, up: true, icon: Wallet, accent: C.success },
  { label: "Today's Expenses", value: 58000, delta: -3.2, up: false, icon: Receipt, accent: C.warning },
  { label: "Cash on Hand", value: 412300, delta: 2.6, up: true, icon: Landmark, accent: C.primary },
  { label: "Bank Balance", value: 1284000, delta: 5.9, up: true, icon: Landmark, accent: C.primary },
  { label: "Inventory Value", value: 3120000, delta: -1.1, up: false, icon: Boxes, accent: C.dark },
  { label: "Outstanding Debt", value: 96500, delta: 4.4, up: false, icon: ArrowDownRight, accent: C.danger },
  { label: "Owed to Suppliers", value: 145000, delta: -6.7, up: true, icon: ArrowUpRight, accent: C.warning },
];

const lowStock = [
  { name: "Peak Milk 400g", left: 4, unit: "cartons" },
  { name: "Dangote Sugar 1kg", left: 7, unit: "bags" },
  { name: "Indomie Super Pack", left: 3, unit: "cartons" },
  { name: "Kellogg's Corn Flakes", left: 6, unit: "packs" },
];

const latestSales = [
  { who: "Ngozi Umeh", amount: 24500, time: "2m ago", method: "Transfer" },
  { who: "Walk-in customer", amount: 8200, time: "18m ago", method: "Cash" },
  { who: "Chuka Stores", amount: 132000, time: "41m ago", method: "POS" },
  { who: "Ifeoma Okafor", amount: 15600, time: "1h ago", method: "Cash" },
];

const pendingInvoices = [
  { who: "Chuka Stores", amount: 340000, due: "Due in 2 days" },
  { who: "Blessing Eze", amount: 62000, due: "Due tomorrow" },
  { who: "Obi Retail Ltd", amount: 198000, due: "Overdue 3 days" },
];

const recentActivity = [
  { text: "Sale recorded — Ngozi Umeh", time: "2 minutes ago" },
  { text: "Stock updated — Peak Milk 400g", time: "24 minutes ago" },
  { text: "Expense logged — Fuel ₦12,000", time: "1 hour ago" },
  { text: "Invoice sent — Obi Retail Ltd", time: "3 hours ago" },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Sales", icon: TrendingUp, path: "/pos" },
  { label: "POS", icon: ShoppingCart, path: "/pos" },
  { label: "Invoices", icon: FileText, path: null },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Suppliers", icon: Truck, path: "/suppliers" },
  { label: "Inventory", icon: Package, path: "/inventory" },
  { label: "Purchases", icon: ShoppingBag, path: "/inventory" },
  { label: "Capital & Cash Book", icon: Wallet, path: "/capital" },
  { label: "Expenses", icon: Receipt, path: null },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Employees", icon: UserCog, path: null },
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

// ---------- small components ----------
function StatCard({ label, value, delta, up, icon: Icon, accent, i }) {
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
        <span
          className="flex items-center justify-center rounded-lg w-8 h-8 shrink-0"
          style={{ backgroundColor: `${accent}14` }}
        >
          <Icon size={16} style={{ color: accent }} strokeWidth={2.25} />
        </span>
      </div>
      <div className="mt-2 text-xl font-semibold tabular-nums text-slate-900">
        {naira(value)}
      </div>
      <div className="mt-1 flex items-center gap-1 text-xs font-medium">
        {up ? (
          <ArrowUpRight size={13} style={{ color: C.success }} />
        ) : (
          <ArrowDownRight size={13} style={{ color: C.danger }} />
        )}
        <span style={{ color: up ? C.success : C.danger }}>
          {Math.abs(delta)}%
        </span>
        <span className="text-slate-400">vs yesterday</span>
      </div>
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
          <span
            className="w-2 h-2 rounded-full"
            style={{ backgroundColor: p.color }}
          />
          <span className="text-slate-300 capitalize">{p.dataKey}</span>
          <span className="font-medium tabular-nums ml-auto">{naira(p.value)}</span>
        </div>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [tab, setTab] = useState("activity");
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { key: "activity", label: "Recent Activity" },
    { key: "stock", label: "Low Stock" },
    { key: "sales", label: "Latest Sales" },
    { key: "invoices", label: "Pending Invoices" },
  ];

  return (
    <div className="min-h-screen w-full flex" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { transition: background-color 200ms ease-out, border-color 200ms ease-out, transform 200ms ease-out, box-shadow 200ms ease-out; }
      `}</style>

      {/* ---------- Sidebar (desktop) ---------- */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <div className="h-16 flex items-center gap-2 px-5 border-b" style={{ borderColor: C.border }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.primary }}>
            <span className="text-white text-xs font-bold">L</span>
          </div>
          <span className="font-semibold text-[15px] text-slate-900">LedgerOS</span>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path && location.pathname === item.path;
            const base = "w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium";
            if (!item.path) {
              return (
                <div key={item.label} className={`${base} text-slate-300 cursor-not-allowed justify-between`}>
                  <span className="flex items-center gap-3">
                    <item.icon size={17} strokeWidth={2} />
                    {item.label}
                  </span>
                  <span className="text-[9px] font-semibold tracking-wide bg-slate-50 text-slate-400 rounded-full px-1.5 py-0.5">SOON</span>
                </div>
              );
            }
            return (
              <Link
                key={item.label}
                to={item.path}
                className={`${base} ${isActive ? "bg-blue-50 text-blue-600" : "text-slate-600 hover:bg-slate-50"}`}
              >
                <item.icon size={17} strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="px-3 py-4 border-t space-y-0.5" style={{ borderColor: C.border }}>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium text-slate-600 hover:bg-slate-50">
            <Settings size={17} /> Settings
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium text-slate-600 hover:bg-slate-50">
            <HelpCircle size={17} /> Help
          </button>
        </div>
      </aside>

      {/* ---------- Mobile nav drawer ---------- */}
      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white p-4">
            <div className="flex items-center justify-between mb-4">
              <span className="font-semibold text-slate-900">LedgerOS</span>
              <button onClick={() => setMobileNavOpen(false)} className="p-1.5 rounded-lg hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <nav className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = item.path && location.pathname === item.path;
                if (!item.path) {
                  return (
                    <div key={item.label} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-slate-300">
                      <span className="flex items-center gap-3">
                        <item.icon size={17} />
                        {item.label}
                      </span>
                      <span className="text-[9px] font-semibold tracking-wide bg-slate-50 text-slate-400 rounded-full px-1.5 py-0.5">SOON</span>
                    </div>
                  );
                }
                return (
                  <Link
                    key={item.label}
                    to={item.path}
                    onClick={() => setMobileNavOpen(false)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium ${
                      isActive ? "bg-blue-50 text-blue-600" : "text-slate-600"
                    }`}
                  >
                    <item.icon size={17} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* ---------- Main ---------- */}
      <div className="flex-1 min-w-0 pb-16 lg:pb-0">
        {/* Top bar */}
        <header className="h-16 flex items-center gap-3 px-4 lg:px-8 border-b sticky top-0 z-30" style={{ borderColor: C.border, backgroundColor: `${C.bg}E6`, backdropFilter: "blur(8px)" }}>
          <button onClick={() => setMobileNavOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg hover:bg-slate-100">
            <Menu size={20} />
          </button>
          <div className="hidden sm:flex items-center gap-2 flex-1 max-w-sm bg-white border rounded-xl px-3 py-2" style={{ borderColor: C.border }}>
            <Search size={15} className="text-slate-400" />
            <input placeholder="Search products, customers, invoices…" className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400" />
          </div>
          <div className="flex-1 sm:hidden" />
          <button className="p-2 rounded-xl hover:bg-slate-100 relative">
            <Bell size={19} className="text-slate-600" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: C.danger }} />
          </button>
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">CO</div>
        </header>

        <main className="p-4 lg:p-8 space-y-6">
          {/* Hero: Today snapshot (signature element) */}
          <div className="relative overflow-hidden rounded-3xl px-5 py-6 lg:px-8 lg:py-7" style={{ background: `linear-gradient(135deg, ${C.primary}, ${C.primaryDark})` }}>
            <GraphPaper className="absolute inset-0 pointer-events-none" />
            <div className="relative flex flex-col lg:flex-row lg:items-end lg:justify-between gap-5">
              <div>
                <p className="text-blue-100 text-[13px] font-medium">Good morning, Chidi — here's today</p>
                <p className="mt-1 text-white text-3xl lg:text-4xl font-semibold tabular-nums tracking-tight">
                  {naira(204000)}
                  <span className="text-blue-200 text-base font-medium ml-2">sold so far</span>
                </p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {[
                    { l: "Profit", v: 84500 },
                    { l: "Expenses", v: 58000 },
                    { l: "Cash balance", v: 412300 },
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
                  <p className="text-xs text-slate-400">Last 7 days</p>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.primary }} />Revenue</span>
                  <span className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: C.warning }} />Expenses</span>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={230}>
                <AreaChart data={revenueData} margin={{ left: -18, right: 8 }}>
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
                {tab === "activity" &&
                  recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: C.primary }} />
                      <div className="min-w-0">
                        <p className="text-[13px] text-slate-700 leading-snug">{a.text}</p>
                        <p className="text-[11px] text-slate-400">{a.time}</p>
                      </div>
                    </div>
                  ))}

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

                {tab === "invoices" &&
                  pendingInvoices.map((s, i) => (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-700 truncate">{s.who}</p>
                        <p className={`text-[11px] ${s.due.startsWith("Overdue") ? "text-red-500" : "text-slate-400"}`}>{s.due}</p>
                      </div>
                      <span className="text-[13px] font-semibold tabular-nums text-slate-900 shrink-0">{naira(s.amount)}</span>
                    </div>
                  ))}
              </div>

              <button className="mt-4 w-full flex items-center justify-center gap-1 text-xs font-medium text-blue-600 py-2 rounded-xl hover:bg-blue-50">
                View all <ChevronRight size={13} />
              </button>
            </div>
          </div>

          {/* Expenses breakdown */}
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 4px 12px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Expenses this week</h3>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={revenueData} margin={{ left: -18, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#EEF2F7" vertical={false} />
                <XAxis dataKey="d" tick={{ fontSize: 12, fill: C.textSub }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: C.textSub }} axisLine={false} tickLine={false} tickFormatter={(v) => `₦${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="expenses" fill={C.warning} radius={[6, 6, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </main>
      </div>

      {/* ---------- Bottom nav (mobile) ---------- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t flex items-center justify-around h-16" style={{ borderColor: C.border }}>
        {[
          { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
          { icon: TrendingUp, label: "Sales", path: "/pos" },
          { icon: ShoppingCart, label: "POS", path: "/pos" },
          { icon: Package, label: "Stock", path: "/inventory" },
          { icon: BarChart3, label: "Reports", path: "/reports" },
        ].map((item) => {
          const isActive = item.path && location.pathname === item.path;
          const color = isActive ? C.primary : C.textSub;
          if (!item.path) {
            return (
              <div key={item.label} className="flex flex-col items-center gap-1 px-3 py-1.5 opacity-40">
                <item.icon size={20} strokeWidth={2} style={{ color: C.textSub }} />
                <span className="text-[10px] font-medium" style={{ color: C.textSub }}>{item.label}</span>
              </div>
            );
          }
          return (
            <Link key={item.label} to={item.path} className="flex flex-col items-center gap-1 px-3 py-1.5">
              <item.icon size={20} strokeWidth={2} style={{ color }} />
              <span className="text-[10px] font-medium" style={{ color }}>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
