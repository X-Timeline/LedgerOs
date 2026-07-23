import { useState, useMemo, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Search, Plus, Minus, X, ShoppingCart, Banknote, Landmark, Clock,
  User, ChevronDown, Check, Trash2, Package, AlertCircle
} from "lucide-react";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

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

const CURRENCY = "₦"; // Business.currency — hardcoded here for now, driven by Settings later
const money = (n) => CURRENCY + Math.round(n).toLocaleString("en-NG");

function unitsFor(product) {
  const own = { name: product.base_unit, conversion: 1 };
  const extra = (product.product_units || []).map((u) => ({ name: u.unit_name, conversion: Number(u.conversion_to_base) }));
  return [own, ...extra];
}

function baseStock(product) {
  return (product.purchase_lots || []).reduce((s, l) => s + Number(l.remaining_quantity), 0);
}

function availableInUnit(product, unitName) {
  const u = unitsFor(product).find((x) => x.name === unitName);
  if (!u) return 0;
  return Math.floor(baseStock(product) * u.conversion);
}

export default function POS() {
  const { selectedShop } = useOutletContext();
  const { user } = useAuth();
  const shopId = selectedShop?.id !== "all" ? selectedShop?.id : null;

  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [posting, setPosting] = useState(false);
  const [cart, setCart] = useState([]); // {key, productId, name, unit, price, qty, maxQty}
  const [unitPicker, setUnitPicker] = useState(null); // productId being chosen
  const [cartOpen, setCartOpen] = useState(false); // mobile cart modal — opens when a product is added
  const [payment, setPayment] = useState("cash"); // cash | bank | credit
  const [customerOpen, setCustomerOpen] = useState(false);
  const [customer, setCustomer] = useState(null);
  const [posted, setPosted] = useState(null); // last completed sale summary

  const refresh = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    Promise.all([
      api.get(`/products?shopId=${shopId}`),
      api.get(`/customers?shopId=${shopId}`),
    ])
      .then(([productsData, customersData]) => {
        setLoading(false);
        setProducts(productsData || []);
        setCustomers(customersData || []);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  const addToCart = (product, unitName) => {
    const key = `${product.id}:${unitName}`;
    const max = availableInUnit(product, unitName);
    setCart((prev) => {
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        if (existing.qty >= max) return prev;
        return prev.map((i) => (i.key === key ? { ...i, qty: i.qty + 1 } : i));
      }
      if (max <= 0) return prev;
      return [
        ...prev,
        { key, productId: product.id, name: product.name, unit: unitName, price: 0, qty: 1, maxQty: max },
      ];
    });
    setUnitPicker(null);
    setCartOpen(true); // a good was clicked to be sold — surface the cart now
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

  const changePrice = (key, price) => {
    setCart((prev) => prev.map((i) => (i.key === key ? { ...i, price: Number(price) || 0 } : i)));
  };

  const removeItem = (key) => setCart((prev) => prev.filter((i) => i.key !== key));

  const total = useMemo(() => cart.reduce((sum, i) => sum + i.price * i.qty, 0), [cart]);

  const canPost = cart.length > 0 && cart.every((i) => i.price > 0) && (payment !== "credit" || customer);

  const postSale = async () => {
    setError("");
    setPosting(true);
    const lines = cart.map((i) => ({
      productId: i.productId,
      unitSold: i.unit,
      quantity: i.qty,
      unitPrice: i.price,
    }));

    try {
      await api.post("/sales", {
        shopId,
        customerId: payment === "credit" ? customer?.id : null,
        channel: payment.toUpperCase(),
        lines,
      });
    } catch (err) {
      setPosting(false);
      return setError(err.message);
    }

    setPosting(false);
    setPosted({
      total,
      items: cart.length,
      payment,
      customer: payment === "credit" ? customer?.name : null,
      postedBy: user?.user_metadata?.name || user?.email || "You",
    });
    setCart([]);
    setCustomer(null);
    setPayment("cash");
    setCartOpen(false);
    refresh(); // stock just changed server-side — pull the new numbers
  };

  if (!shopId) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Select a specific shop from the switcher above to make a sale — "All Shops" doesn't apply here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col lg:flex-row" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      {/* ---------- Product picker ---------- */}
      <div className="flex-1 min-w-0 p-4 lg:p-6 pb-40 lg:pb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">New Sale</h1>
            <p className="text-xs text-slate-400">{selectedShop.name}</p>
          </div>
          <span className="flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-white border rounded-full px-3 py-1.5" style={{ borderColor: C.border }}>
            <User size={13} /> {user?.user_metadata?.name || user?.email}
          </span>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="flex items-center gap-2 bg-white border rounded-xl px-3 py-2.5 mb-4" style={{ borderColor: C.border }}>
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search products…"
            className="bg-transparent text-sm outline-none w-full placeholder:text-slate-400"
          />
        </div>

        {loading && <p className="text-xs text-slate-400 text-center py-10">Loading…</p>}
        {!loading && products.length === 0 && (
          <p className="text-xs text-slate-400 text-center py-10">No products yet — add some from Inventory first.</p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
          {filtered.map((p) => {
            const stock = baseStock(p);
            const low = stock <= 5;
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
                <p className={`text-[11px] font-medium mt-2 ${low ? "text-amber-600" : "text-slate-400"}`}>
                  {stock} {p.base_unit}{stock === 1 ? "" : "s"} left
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
                      {unitsFor(p).map((u) => {
                        const avail = availableInUnit(p, u.name);
                        return (
                          <button
                            key={u.name}
                            disabled={avail <= 0}
                            onClick={() => addToCart(p, u.name)}
                            className="w-full flex items-center justify-between rounded-xl border px-4 py-3 disabled:opacity-40 hover:border-blue-300"
                            style={{ borderColor: C.border }}
                          >
                            <div className="text-left">
                              <p className="text-[13px] font-medium text-slate-900 capitalize">{u.name}</p>
                              <p className="text-[11px] text-slate-400">{avail} available</p>
                            </div>
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

      {/* ---------- Cart: desktop persistent side panel ---------- */}
      <div className="hidden lg:flex lg:w-96 shrink-0 bg-white border-l flex-col" style={{ borderColor: C.border }}>
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
                  <p className="text-[11px] text-slate-400 capitalize flex items-center gap-1">
                    {i.unit} ·
                    <span className="text-slate-400">₦</span>
                    <input
                      type="number"
                      value={i.price || ""}
                      onChange={(e) => changePrice(i.key, e.target.value)}
                      placeholder="price"
                      className="w-16 border-b border-dashed outline-none bg-transparent"
                      style={{ borderColor: C.border }}
                    />
                    each
                  </p>
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
            disabled={!canPost || posting}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
            style={{ backgroundColor: C.primary }}
          >
            {posting ? "Posting…" : "Complete Sale"}
          </button>
        </div>
      </div>

      {/* ---------- Cart: mobile modal — only opens when a good is added ---------- */}
      {cartOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-slate-900/40" onClick={() => setCartOpen(false)} />
          <div className="relative w-full bg-white rounded-t-3xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: C.border }}>
              <button
                onClick={() => setCartOpen(false)}
                aria-label="Cancel"
                className="w-8 h-8 rounded-full flex items-center justify-center text-white shrink-0"
                style={{ backgroundColor: C.danger }}
              >
                <X size={16} />
              </button>
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <ShoppingCart size={16} /> Cart · {cart.length} item{cart.length === 1 ? "" : "s"}
              </span>
              <span className="w-8" />
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
                      <p className="text-[11px] text-slate-400 capitalize flex items-center gap-1">
                    {i.unit} ·
                    <span className="text-slate-400">₦</span>
                    <input
                      type="number"
                      value={i.price || ""}
                      onChange={(e) => changePrice(i.key, e.target.value)}
                      placeholder="price"
                      className="w-16 border-b border-dashed outline-none bg-transparent"
                      style={{ borderColor: C.border }}
                    />
                    each
                  </p>
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
                disabled={!canPost || posting}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: C.primary }}
              >
                {posting ? "Posting…" : "Complete Sale"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---------- Floating reopen affordance (mobile, cart has items but modal closed) ---------- */}
      {!cartOpen && cart.length > 0 && (
        <button
          onClick={() => setCartOpen(true)}
          className="lg:hidden fixed bottom-20 right-4 z-40 flex items-center gap-2 rounded-full pl-4 pr-5 py-3 text-white text-sm font-semibold shadow-lg"
          style={{ backgroundColor: C.primary }}
        >
          <ShoppingCart size={16} />
          {cart.length} · {money(total)}
        </button>
      )}

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
