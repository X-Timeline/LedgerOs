import { useState } from "react";
import { Link, useLocation, Outlet } from "react-router-dom";
import {
  LayoutDashboard, ShoppingCart, FileText, Users, Truck, Package,
  ShoppingBag, Receipt, BarChart3, UserCog, Settings, HelpCircle,
  Search, Bell, Menu, X, ChevronDown, Store, Layers, TrendingUp, Wallet
} from "lucide-react";

const C = {
  primary: "#2563EB",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E2E8F0",
  textSub: "#64748B",
};

// Shops under this business. `factor` is a display-only illustration for the mock —
// in the real app, each shop's numbers come from its own independent API query.
export const shops = [
  { id: "all", name: "All Shops", factor: 1 },
  { id: "furniture", name: "Chase Furniture", factor: 0.62 },
  { id: "gadget", name: "Chase Gadget", factor: 0.38 },
];

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { label: "Sales", icon: TrendingUp, path: "/pos" },
  { label: "POS", icon: ShoppingCart, path: "/pos" },
  { label: "Invoices", icon: FileText, path: "/invoices" },
  { label: "Customers", icon: Users, path: "/customers" },
  { label: "Suppliers", icon: Truck, path: "/suppliers" },
  { label: "Inventory", icon: Package, path: "/inventory" },
  { label: "Purchases", icon: ShoppingBag, path: "/inventory" },
  { label: "Capital & Cash Book", icon: Wallet, path: "/capital" },
  { label: "Expenses", icon: Receipt, path: "/expenses" },
  { label: "Reports", icon: BarChart3, path: "/reports" },
  { label: "Team", icon: UserCog, path: "/team" },
];

export default function AppShell() {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedShop, setSelectedShop] = useState(shops[0]);
  const [shopMenuOpen, setShopMenuOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen w-full flex" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        * { transition: background-color 200ms ease-out, border-color 200ms ease-out, transform 200ms ease-out, box-shadow 200ms ease-out; }
      `}</style>

      {/* ---------- Sidebar (desktop) ---------- */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r" style={{ borderColor: C.border, backgroundColor: C.surface }}>
        <Link to="/dashboard" className="h-16 flex items-center gap-2 px-5 border-b" style={{ borderColor: C.border }}>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.primary }}>
            <span className="text-white text-xs font-bold">L</span>
          </div>
          <span className="font-semibold text-[15px] text-slate-900">LedgerOS</span>
        </Link>

        <div className="relative px-3 pt-3">
          <button
            onClick={() => setShopMenuOpen((v) => !v)}
            className="w-full flex items-center justify-between gap-2 rounded-xl border px-3 py-2.5 text-left"
            style={{ borderColor: C.border }}
          >
            <span className="flex items-center gap-2 min-w-0">
              {selectedShop.id === "all" ? <Layers size={14} className="text-blue-500 shrink-0" /> : <Store size={14} className="text-blue-500 shrink-0" />}
              <span className="text-[13px] font-semibold text-slate-900 truncate">{selectedShop.name}</span>
            </span>
            <ChevronDown size={14} className="text-slate-400 shrink-0" />
          </button>
          {shopMenuOpen && (
            <div className="absolute left-3 right-3 mt-1 bg-white border rounded-xl shadow-lg overflow-hidden z-20" style={{ borderColor: C.border }}>
              {shops.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedShop(s); setShopMenuOpen(false); }}
                  className={`w-full flex items-center gap-2 px-3 py-2.5 text-[13px] ${s.id === selectedShop.id ? "bg-blue-50 text-blue-600 font-medium" : "text-slate-600 hover:bg-slate-50"}`}
                >
                  {s.id === "all" ? <Layers size={13} /> : <Store size={13} />}
                  {s.name}
                </button>
              ))}
            </div>
          )}
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
          <Link to="/settings" className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium text-slate-600 hover:bg-slate-50">
            <Settings size={17} /> Settings
          </Link>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[13.5px] font-medium text-slate-300 cursor-not-allowed">
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
            <select
              value={selectedShop.id}
              onChange={(e) => setSelectedShop(shops.find((s) => s.id === e.target.value))}
              className="w-full rounded-xl border px-3 py-2.5 text-[13px] font-medium text-slate-900 outline-none mb-4 bg-white"
              style={{ borderColor: C.border }}
            >
              {shops.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
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

      {/* ---------- Main content area ---------- */}
      <div className="flex-1 min-w-0 pb-16 lg:pb-0 flex flex-col">
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
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
          </button>
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white text-xs font-semibold flex items-center justify-center">CO</div>
        </header>

        <div className="flex-1">
          <Outlet context={{ selectedShop }} />
        </div>
      </div>

      {/* ---------- Bottom nav (mobile) ---------- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-white border-t flex items-center justify-around h-16" style={{ borderColor: C.border }}>
        {[
          { icon: LayoutDashboard, label: "Home", path: "/dashboard" },
          { icon: ShoppingCart, label: "POS", path: "/pos" },
          { icon: Package, label: "Stock", path: "/inventory" },
          { icon: BarChart3, label: "Reports", path: "/reports" },
          { icon: Settings, label: "Settings", path: "/settings" },
        ].map((item) => {
          const isActive = location.pathname === item.path;
          const color = isActive ? C.primary : C.textSub;
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
