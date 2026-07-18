import { useState, useMemo } from "react";
import {
  Search, Plus, Minus, X, ShoppingCart, Banknote, Landmark, Clock,
  User, ChevronDown, Check, Trash2, Package
} from "lucide-react";

const C = {
  primary: "#2563EB",
  primaryDark: "#1D4ED8",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  dark: "#0F172A",
  textSub: "#64748B",
  border: "#E2E8F0",
};

const CURRENCY = "₦"; // Business.currency — hardcoded here for the preview, driven by settings in the real app
const money = (n) => CURRENCY + Math.round(n).toLocaleString("en-NG");

const products = [
  {
    id: "p1", name: "Golden Morn", stockBase: 42, baseUnit: "carton",
    units: [
      { name: "carton", price: 8000, factor: 1 },
      { name: "packet", price: 500, factor: 20 },
    ],
  },
  {
    id: "p2", name: "Peak Milk 400g", stockBase: 4, baseUnit: "carton",
    units: [
      { name: "carton", price: 22000, factor: 1 },
      { name: "tin", price: 950, factor: 24 },
    ],
  },
  {
    id: "p3", name: "Indomie Super Pack", stockBase: 3, baseUnit: "carton",
    units: [
      { name: "carton", price: 6200, factor: 1 },
      { name: "pack", price: 450, factor: 40 },
    ],
  },
  {
    id: "p4", name: "Dangote Sugar 1kg", stockBase: 7, baseUnit: "bag",
    units: [
      { name: "bag", price: 12000, factor: 1 },
      { name: "unit", price: 1400, factor: 10 },
    ],
  },
  {
    id: "p5", name: "Kellogg's Corn Flakes", stockBase: 6, baseUnit: "pack",
    units: [{ name: "pack", price: 3200, factor: 1 }],
  },
  {
    id: "p6", name: "Coca-Cola 50cl (crate)", stockBase: 18, baseUnit: "crate",
    units: [
      { name: "crate", price: 4500, factor: 1 },
      { name: "bottle", price: 250, factor: 24 },
    ],
  },
];

const customers = [
  { id: "c1", name: "Ngozi Umeh", phone: "0803 xxx xxx1" },
  { id: "c2", name: "Chuka Stores", phone: "0806 xxx xxx2" },
  { id: "c3", name: "Blessing Eze", phone: "0701 xxx xxx3" },
];

const availableInUnit = (product, unitName) => {
  const u = product.units.find((x) => x.name === unitName);
  return Math.floor(product.stockBase * u.factor);
};

export default function POS() {
  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]); // {key, productId, name, unit, price, qty, maxQty}
  const [unitPicker, setUnitPicker] = useState(null); // productId being chosen
  const [payment, setPayment] = useState("cash"); // cash | bank | credit
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [posted, setPosted] = useState(null); // last completed sale summary

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const addToCart = (product, unit) => {
    const key = `${product.id}:${unit.name}`;
    const max = availableInUnit(product, unit.name);
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        if (existing.qty >= max) return prev;
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      }
      if (max <= 0) return prev;
      return [
        ...prev,
        { key, productId: product.id, name: product.name, unit: unit.name, price: unit.price, qty: 1, maxQty: max },
      ];
    });
    setUnitPicker(null);
  };

  const changeQty = (key, delta) => {
    setCart((prev) =>
      prev
        .map((i) =>
          i.key === key ? { ...i, qty: Math.max(0, Math.min(i.maxQty, i.qty + delta)) } : i
        )
        .filter((i) => i.qty > 0)
    );
  };

  const removeItem = (key) => setCart((prev) => prev.filter((i) => i.key !== key));

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);

  const canPost = cart.length > 0 && (payment !== "credit" || customer);

  const postSale = () => {
    setPosted({
      total,
      items: cart.length,
      payment,
      customer: payment === "credit" ? customer?.name : null,
      postedBy: "Chidi (Cashier)",
    });
    setCart([]);
    setCustomer(null);
    setPayment("cash");
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      {/* ---------- Product picker ---------- */}
      <div className="flex-1 min-w-0 p-4 lg:p-6 pb-40 lg:pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">New Sale</h1>
            <p className="text-xs text-slate-400">Chase Furniture</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border rounded-full px-3 py-1.5" style={{ borderColor: C.border }}>
            <User size={13} /> Chidi (Cashier)
          </span>
        </div>

        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 mb-4" style={{ borderColor: C.border }}>
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const low = p.stockBase <= 5;
            return (
              <button
                key={p.id}
                onClick={() => setUnitPicker(p.id)}
                className="text-left rounded-2xl bg-white border p-3.5 hover:border-blue-300 hover:shadow-md"
                style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${C.primary}12` }}>
                  <Package size={17} style={{ color: C.primary }} />
                </div>
                <p className="text-[13px] font-semibold text-slate-900 leading-snug">{p.name}</p>
                <p className="text-xs text-slate-400 mt-0.5">from {money(Math.min(...p.units.map((u) => u.price)))}</p>
                <p className={`text-[11px] font-medium mt-2 ${low ? "text-amber-600" : "text-slate-400"}`}>
                  {p.stockBase} {p.baseUnit}{p.stockBase === 1 ? "" : "s"} left
                </p>
              </button>
            );
          })}
        </div>

        {/* Unit picker sheet */}
        {unitPicker && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setUnitPicker(null)} />
            <div className="relative w-full lg:w-96 bg-white rounded-t-3xl lg:rounded-3xl p-5">
              {(() => {
                const p = products.find((x) => x.id === unitPicker);
                return (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-900">{p.name} — choose unit</h3>
                      <button onClick={() => setUnitPicker(null)} className="p-1.5 rounded-lg hover:bg-slate-100">
                        <X size={16} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      {p.units.map((u) => {
                        const avail = availableInUnit(p, u.name);
                        return (
                          <button
                            key={u.name}
                            disabled={avail <= 0}
                            onClick={() => addToCart(p, u)}
                            className="w-full flex items-center justify-between rounded-xl border px-4 py-3 disabled:opacity-40 hover:border-blue-300"
                            style={{ borderColor: C.border }}
                          >
                            <div className="text-left">
                              <p className="text-[13px] font-medium text-slate-900 capitalize">{u.name}</p>
                              <p className="text-[11px] text-slate-400">{avail} available</p>
                            </div>
                            <span className="text-[13px] font-semibold tabular-nums text-slate-900">{money(u.price)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>

      {/* ---------- Cart panel ---------- */}
      <div className="lg:w-96 shrink-0 bg-white border-t lg:border-t-0 lg:border-l flex flex-col fixed bottom-0 left-0 right-0 lg:static max-h-[65vh] lg:max-h-none rounded-t-3xl lg:rounded-none" style={{ borderColor: C.border, boxShadow: "0 -4px 24px rgba(15,23,42,0.06)" }}>
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.border }}>
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <ShoppingCart size={16} /> Cart
          </span>
          <span className="text-xs text-slate-400">{cart.length} item{cart.length === 1 ? "" : "s"}</span>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {cart.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-2xl mb-1">🛒</p>
              <p className="text-xs text-slate-400">No items yet. Tap a product to add it.</p>
            </div>
          ) : (
            cart.map((i) => (
              <div key={i.key} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-slate-900 truncate">{i.name}</p>
                  <p className="text-[11px] text-slate-400 capitalize">{i.unit} · {money(i.price)} each</p>
                </div>
                <div className="flex items-center gap-1.5 border rounded-lg" style={{ borderColor: C.border }}>
                  <button onClick={() => changeQty(i.key, -1)} className="p-1.5 hover:bg-slate-50 rounded-l-lg">
                    <Minus size={12} />
                  </button>
                  <span className="text-xs font-medium w-5 text-center tabular-nums">{i.qty}</span>
                  <button onClick={() => changeQty(i.key, 1)} disabled={i.qty >= i.maxQty} className="p-1.5 hover:bg-slate-50 rounded-r-lg disabled:opacity-30">
                    <Plus size={12} />
                  </button>
                </div>
                <button onClick={() => removeItem(i.key)} className="p-1.5 text-slate-300 hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>

        <div className="px-5 py-4 border-t space-y-4" style={{ borderColor: C.border }}>
          {/* Payment method */}
          <div>
            <p className="text-[11px] font-medium text-slate-500 mb-2">Payment method</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: "cash", label: "Cash", icon: Banknote },
                { key: "bank", label: "Transfer", icon: Landmark },
                { key: "credit", label: "Credit", icon: Clock },
              ].map((m) => (
                <button
                  key={m.key}
                  onClick={() => setPayment(m.key)}
                  className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[11px] font-medium ${
                    payment === m.key ? "border-blue-500 bg-blue-50 text-blue-600" : "text-slate-500"
                  }`}
                  style={{ borderColor: payment === m.key ? C.primary : C.border }}
                >
                  <m.icon size={15} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Credit customer picker */}
          {payment === "credit" && (
            <div className="relative">
              <button
                onClick={() => setCustomerOpen((v) => !v)}
                className="w-full flex items-center justify-between rounded-xl border px-3 py-2.5 text-[13px]"
                style={{ borderColor: C.border }}
              >
                <span className={customer ? "text-slate-900 font-medium" : "text-slate-400"}>
                  {customer ? customer.name : "Select customer"}
                </span>
                <ChevronDown size={15} className="text-slate-400" />
              </button>
              {customerOpen && (
                <div className="absolute bottom-full mb-1 w-full bg-white border rounded-xl shadow-lg overflow-hidden z-10" style={{ borderColor: C.border }}>
                  {customers.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setCustomer(c); setCustomerOpen(false); }}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-[13px] hover:bg-slate-50"
                    >
                      <span>{c.name}</span>
                      {customer?.id === c.id && <Check size={14} style={{ color: C.primary }} />}
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[11px] text-amber-600 mt-1.5">Stock leaves now; sale stays pending until paid.</p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-500">Total</span>
            <span className="text-xl font-semibold tabular-nums text-slate-900">{money(total)}</span>
          </div>

          <button
            onClick={postSale}
            disabled={!canPost}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: C.primary }}
          >
            Complete Sale
          </button>
        </div>
      </div>

      {/* ---------- Success confirmation ---------- */}
      {posted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setPosted(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center">
            <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center mb-4" style={{ backgroundColor: `${C.success}18` }}>
              <Check size={26} style={{ color: C.success }} />
            </div>
            <h3 className="text-base font-semibold text-slate-900">Sale recorded</h3>
            <p className="text-2xl font-semibold tabular-nums mt-2 text-slate-900">{money(posted.total)}</p>
            <p className="text-xs text-slate-400 mt-1">
              {posted.items} item{posted.items === 1 ? "" : "s"} · {posted.payment === "credit" ? `Credit — ${posted.customer}` : posted.payment === "bank" ? "Transfer" : "Cash"}
            </p>
            <p className="text-[11px] text-slate-400 mt-1">Posted by {posted.postedBy}</p>
            <button
              onClick={() => setPosted(null)}
              className="w-full mt-5 rounded-xl py-2.5 text-sm font-semibold text-white"
              style={{ backgroundColor: C.primary }}
            >
              New Sale
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
