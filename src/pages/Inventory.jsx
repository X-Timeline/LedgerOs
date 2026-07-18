import { useState } from "react";
import {
  Package, Plus, ChevronDown, ChevronRight, AlertTriangle, Boxes,
  Banknote, Landmark, X, Layers
} from "lucide-react";

const C = {
  primary: "#2563EB",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  bg: "#F8FAFC",
  border: "#E2E8F0",
};

const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

const initialProducts = [
  {
    id: "p1", name: "Golden Morn", baseUnit: "carton", costingMethod: "FIFO",
    sellUnits: [{ name: "carton", factor: 1 }, { name: "packet", factor: 20 }],
    lots: [
      { id: "l1", qty: 3, remaining: 1, cost: 9000, date: "2026-06-02", channel: "cash" },
      { id: "l2", qty: 5, remaining: 5, cost: 15500, date: "2026-07-10", channel: "bank" },
    ],
  },
  {
    id: "p2", name: "Peak Milk 400g", baseUnit: "carton", costingMethod: "WEIGHTED_AVG",
    sellUnits: [{ name: "carton", factor: 1 }, { name: "tin", factor: 24 }],
    lots: [{ id: "l3", qty: 6, remaining: 4, cost: 33000, date: "2026-07-05", channel: "cash" }],
  },
  {
    id: "p3", name: "Indomie Super Pack", baseUnit: "carton", costingMethod: "FIFO",
    sellUnits: [{ name: "carton", factor: 1 }, { name: "pack", factor: 40 }],
    lots: [{ id: "l4", qty: 4, remaining: 3, cost: 24800, date: "2026-07-14", channel: "bank" }],
  },
];

function stockOf(product) {
  return product.lots.reduce((s, l) => s + l.remaining, 0);
}
function valueOf(product) {
  return product.lots.reduce((s, l) => s + (l.remaining / l.qty) * l.cost, 0);
}

export default function Inventory() {
  const [products, setProducts] = useState(initialProducts);
  const [tab, setTab] = useState("stock");
  const [expanded, setExpanded] = useState(null);

  const [purchase, setPurchase] = useState({ productId: "", qty: "", cost: "", channel: "cash" });
  const [newProduct, setNewProduct] = useState({
    name: "", baseUnit: "carton", costingMethod: "FIFO",
    sellUnits: [{ name: "carton", factor: 1 }],
  });

  const addLot = () => {
    if (!purchase.productId || !purchase.qty || !purchase.cost) return;
    setProducts((prev) =>
      prev.map((p) =>
        p.id === purchase.productId
          ? {
              ...p,
              lots: [
                ...p.lots,
                {
                  id: "l" + Date.now(),
                  qty: Number(purchase.qty),
                  remaining: Number(purchase.qty),
                  cost: Number(purchase.cost),
                  date: new Date().toISOString().slice(0, 10),
                  channel: purchase.channel,
                },
              ],
            }
          : p
      )
    );
    setPurchase({ productId: "", qty: "", cost: "", channel: "cash" });
    setTab("stock");
  };

  const addSellUnit = () =>
    setNewProduct((p) => ({ ...p, sellUnits: [...p.sellUnits, { name: "", factor: "" }] }));

  const updateSellUnit = (i, field, value) =>
    setNewProduct((p) => ({
      ...p,
      sellUnits: p.sellUnits.map((u, idx) => (idx === i ? { ...u, [field]: value } : u)),
    }));

  const removeSellUnit = (i) =>
    setNewProduct((p) => ({ ...p, sellUnits: p.sellUnits.filter((_, idx) => idx !== i) }));

  const createProduct = () => {
    if (!newProduct.name) return;
    setProducts((prev) => [
      ...prev,
      { ...newProduct, id: "p" + Date.now(), lots: [] },
    ]);
    setNewProduct({ name: "", baseUnit: "carton", costingMethod: "FIFO", sellUnits: [{ name: "carton", factor: 1 }] });
    setTab("stock");
  };

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="mb-1">
          <h1 className="text-lg font-semibold text-slate-900">Inventory</h1>
          <p className="text-xs text-slate-400">Chase Furniture</p>
        </div>

        <div className="flex gap-1 my-5 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {[
            { key: "stock", label: "Stock" },
            { key: "purchase", label: "Log Purchase" },
            { key: "product", label: "Add Product" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`text-xs font-medium px-3.5 py-2 rounded-lg ${
                tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* ---------- Stock list ---------- */}
        {tab === "stock" && (
          <div className="space-y-3">
            {products.map((p) => {
              const stock = stockOf(p);
              const low = stock <= 5;
              const isOpen = expanded === p.id;
              return (
                <div key={p.id} className="rounded-2xl bg-white border overflow-hidden" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                  <button
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                    className="w-full flex items-center justify-between px-4 py-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${C.primary}12` }}>
                        <Package size={16} style={{ color: C.primary }} />
                      </span>
                      <div className="text-left">
                        <p className="text-[13.5px] font-semibold text-slate-900">{p.name}</p>
                        <p className="text-[11px] text-slate-400">{p.costingMethod.replace("_", " ")} · {p.lots.length} lot{p.lots.length === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-[13px] font-semibold tabular-nums ${low ? "text-amber-600" : "text-slate-900"}`}>
                          {stock} {p.baseUnit}{stock === 1 ? "" : "s"}
                        </p>
                        <p className="text-[11px] text-slate-400">{naira(valueOf(p))} value</p>
                      </div>
                      {isOpen ? <ChevronDown size={16} className="text-slate-400" /> : <ChevronRight size={16} className="text-slate-400" />}
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t px-4 py-3 space-y-2" style={{ borderColor: C.border }}>
                      {low && (
                        <div className="flex items-center gap-1.5 text-[11px] text-amber-600 font-medium mb-1">
                          <AlertTriangle size={12} /> Running low
                        </div>
                      )}
                      {p.lots.map((l) => (
                        <div key={l.id} className="flex items-center justify-between text-[12px]">
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Layers size={12} /> {l.date} · {l.remaining}/{l.qty} left
                            {l.channel === "cash" ? <Banknote size={11} className="text-slate-300" /> : <Landmark size={11} className="text-slate-300" />}
                          </span>
                          <span className="font-medium tabular-nums text-slate-700">{naira(l.cost)}</span>
                        </div>
                      ))}
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {p.sellUnits.map((u) => (
                          <span key={u.name} className="text-[10px] font-medium text-slate-500 bg-slate-50 border rounded-full px-2 py-0.5" style={{ borderColor: C.border }}>
                            1 {p.baseUnit} = {u.factor} {u.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ---------- Log Purchase ---------- */}
        {tab === "purchase" && (
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Log a new stock purchase</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Product</label>
                <select
                  value={purchase.productId}
                  onChange={(e) => setPurchase({ ...purchase, productId: e.target.value })}
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none bg-white"
                  style={{ borderColor: C.border }}
                >
                  <option value="">Select product…</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.baseUnit})</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Quantity bought</label>
                  <input
                    type="number"
                    value={purchase.qty}
                    onChange={(e) => setPurchase({ ...purchase, qty: e.target.value })}
                    placeholder="5"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                    style={{ borderColor: C.border }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Total cost</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                    <input
                      type="number"
                      value={purchase.cost}
                      onChange={(e) => setPurchase({ ...purchase, cost: e.target.value })}
                      placeholder="15,000"
                      className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none"
                      style={{ borderColor: C.border }}
                    />
                  </div>
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-2">Paid via</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: "cash", label: "Cash", icon: Banknote }, { key: "bank", label: "Bank", icon: Landmark }].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setPurchase({ ...purchase, channel: m.key })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-medium ${
                        purchase.channel === m.key ? "border-blue-500 bg-blue-50 text-blue-600" : "text-slate-500"
                      }`}
                      style={{ borderColor: purchase.channel === m.key ? C.primary : C.border }}
                    >
                      <m.icon size={13} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={addLot}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white mt-1"
                style={{ backgroundColor: C.primary }}
              >
                <Plus size={15} /> Add to Stock
              </button>
            </div>
          </div>
        )}

        {/* ---------- Add Product ---------- */}
        {tab === "product" && (
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">New product</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Product name</label>
                <input
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                  placeholder="e.g. Dangote Sugar 1kg"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                  style={{ borderColor: C.border }}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Purchase unit</label>
                  <input
                    value={newProduct.baseUnit}
                    onChange={(e) => setNewProduct({ ...newProduct, baseUnit: e.target.value })}
                    placeholder="carton, bag…"
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                    style={{ borderColor: C.border }}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Costing method</label>
                  <select
                    value={newProduct.costingMethod}
                    onChange={(e) => setNewProduct({ ...newProduct, costingMethod: e.target.value })}
                    className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none bg-white"
                    style={{ borderColor: C.border }}
                  >
                    <option value="FIFO">FIFO</option>
                    <option value="LIFO">LIFO</option>
                    <option value="WEIGHTED_AVG">Weighted Avg</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-slate-500">Sell units</label>
                  <button onClick={addSellUnit} className="text-[11px] font-medium text-blue-600 flex items-center gap-1">
                    <Plus size={11} /> Add unit
                  </button>
                </div>
                <div className="space-y-2">
                  {newProduct.sellUnits.map((u, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <input
                        value={u.name}
                        onChange={(e) => updateSellUnit(i, "name", e.target.value)}
                        placeholder="packet"
                        className="flex-1 rounded-xl border px-3 py-2 text-[13px] outline-none"
                        style={{ borderColor: C.border }}
                      />
                      <span className="text-[11px] text-slate-400 shrink-0">per 1 {newProduct.baseUnit || "unit"} =</span>
                      <input
                        type="number"
                        value={u.factor}
                        onChange={(e) => updateSellUnit(i, "factor", e.target.value)}
                        placeholder="20"
                        className="w-16 rounded-xl border px-3 py-2 text-[13px] outline-none"
                        style={{ borderColor: C.border }}
                      />
                      {newProduct.sellUnits.length > 1 && (
                        <button onClick={() => removeSellUnit(i)} className="text-slate-300 hover:text-red-500 shrink-0">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={createProduct}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white mt-1"
                style={{ backgroundColor: C.primary }}
              >
                <Boxes size={15} /> Create Product
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
