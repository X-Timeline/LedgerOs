import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Package, Plus, ChevronDown, ChevronRight, AlertTriangle, Boxes,
  Banknote, Landmark, X, Layers, AlertCircle
} from "lucide-react";
import { api } from "../lib/api.js";

const C = {
  primary: "#2563EB",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
  bg: "#F8FAFC",
  border: "#E2E8F0",
};

const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

function stockOf(product) {
  return (product.purchase_lots || []).reduce((s, l) => s + Number(l.remaining_quantity), 0);
}
function valueOf(product) {
  return (product.purchase_lots || []).reduce(
    (s, l) => s + (Number(l.remaining_quantity) / Number(l.quantity || 1)) * Number(l.total_cost),
    0
  );
}

export default function Inventory() {
  const { selectedShop } = useOutletContext();
  const shopId = selectedShop?.id !== "all" ? selectedShop?.id : null;

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("stock");
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(false);

  const [purchase, setPurchase] = useState({ productId: "", qty: "", cost: "", channel: "cash" });
  const [returnModal, setReturnModal] = useState(null); // the lot being returned
  const [returnQty, setReturnQty] = useState("");
  const [returnReason, setReturnReason] = useState("");
  const [savingReturn, setSavingReturn] = useState(false);

  const [editPriceProduct, setEditPriceProduct] = useState(null);
  const [newPriceValue, setNewPriceValue] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);

  const [historyProduct, setHistoryProduct] = useState(null);
  const [historyLog, setHistoryLog] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: "", baseUnit: "carton", costingMethod: "FIFO", defaultPrice: "",
    sellUnits: [{ name: "", factor: "" }],
  });

  const refresh = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    api
      .get(`/products?shopId=${shopId}`)
      .then((data) => {
        setLoading(false);
        setProducts(data || []);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  const savePrice = async () => {
    if (!editPriceProduct) return;
    setSavingPrice(true);
    setError("");
    try {
      await api.patch(`/products/${editPriceProduct.id}`, {
        defaultPrice: newPriceValue === "" ? null : Number(newPriceValue),
      });
      await refresh();
      setEditPriceProduct(null);
      setNewPriceValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingPrice(false);
    }
  };

  const openPriceHistory = async (product) => {
    setHistoryProduct(product);
    setHistoryLoading(true);
    try {
      const data = await api.get(`/products/${product.id}/audit-log`);
      setHistoryLog(data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  const submitPurchaseReturn = async () => {
    if (!returnModal || !returnQty) return;
    setSavingReturn(true);
    setError("");
    try {
      await api.post("/returns/purchase", {
        purchaseLotId: returnModal.id,
        quantityReturned: Number(returnQty),
        reason: returnReason || undefined,
      });
      await refresh();
      setReturnModal(null);
      setReturnQty("");
      setReturnReason("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSavingReturn(false);
    }
  };

  const addLot = async () => {
    if (!purchase.productId || !purchase.qty || !purchase.cost) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/purchase-lots", {
        shopId,
        productId: purchase.productId,
        quantity: Number(purchase.qty),
        totalCost: Number(purchase.cost),
        channel: purchase.channel.toUpperCase(),
        purchaseDate: new Date().toISOString(),
      });
      setSaving(false);
      setPurchase({ productId: "", qty: "", cost: "", channel: "cash" });
      setTab("stock");
      refresh();
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
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

  const createProduct = async () => {
    if (!newProduct.name) return;
    setSaving(true);
    setError("");

    const validUnits = newProduct.sellUnits.filter((u) => u.name && u.factor);

    try {
      await api.post("/products", {
        shopId,
        name: newProduct.name,
        baseUnit: newProduct.baseUnit || "unit",
        costingMethod: newProduct.costingMethod,
        defaultPrice: newProduct.defaultPrice ? Number(newProduct.defaultPrice) : null,
        sellUnits: validUnits.map((u) => ({ name: u.name, conversionToBase: Number(u.factor) })),
      });
      setSaving(false);
      setNewProduct({ name: "", baseUnit: "carton", costingMethod: "FIFO", defaultPrice: "", sellUnits: [{ name: "", factor: "" }] });
      setTab("stock");
      refresh();
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  };

  if (!shopId) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Select a specific shop from the switcher above to manage its inventory — "All Shops" doesn't apply here.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="mb-1">
          <h1 className="text-lg font-semibold text-slate-900">Inventory</h1>
          <p className="text-xs text-slate-400">{selectedShop.name}</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mt-4">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

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
            {loading && <p className="text-xs text-slate-400 text-center py-10">Loading…</p>}
            {!loading && products.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-10">No products yet — add your first one.</p>
            )}
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
                        <p className="text-[11px] text-slate-400">{p.costing_method.replace("_", " ")} · {(p.purchase_lots || []).length} lot{(p.purchase_lots || []).length === 1 ? "" : "s"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <p className={`text-[13px] font-semibold tabular-nums ${low ? "text-amber-600" : "text-slate-900"}`}>
                          {stock} {p.base_unit}{stock === 1 ? "" : "s"}
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

                      <div className="flex items-center justify-between text-[12px] pb-2 border-b" style={{ borderColor: C.border }}>
                        <span className="text-slate-500">
                          Selling price: <span className="font-semibold text-slate-900">{p.default_price ? naira(p.default_price) : "not set"}</span> / {p.base_unit}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => { setEditPriceProduct(p); setNewPriceValue(p.default_price || ""); }}
                            className="text-[10px] font-semibold text-blue-600 border border-blue-200 rounded-full px-2 py-0.5"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => openPriceHistory(p)}
                            className="text-[10px] font-semibold text-slate-500 border rounded-full px-2 py-0.5"
                            style={{ borderColor: C.border }}
                          >
                            History
                          </button>
                        </div>
                      </div>

                      {(p.purchase_lots || [])
                        .slice()
                        .sort((a, b) => new Date(b.purchase_date) - new Date(a.purchase_date))
                        .map((l) => (
                          <div key={l.id} className="flex items-center justify-between text-[12px]">
                            <span className="flex items-center gap-1.5 text-slate-500">
                              <Layers size={12} /> {new Date(l.purchase_date).toISOString().slice(0, 10)} · {l.remaining_quantity}/{l.quantity} left
                              {l.channel === "CASH" ? <Banknote size={11} className="text-slate-300" /> : <Landmark size={11} className="text-slate-300" />}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="font-medium tabular-nums text-slate-700">{naira(l.total_cost)}</span>
                              {Number(l.remaining_quantity) > 0 && (
                                <button
                                  onClick={() => setReturnModal(l)}
                                  className="text-[10px] font-semibold text-red-600 border border-red-200 rounded-full px-2 py-0.5"
                                >
                                  Return
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      {(p.purchase_lots || []).length === 0 && (
                        <p className="text-[11px] text-slate-400">No stock purchased yet for this product.</p>
                      )}
                      <div className="pt-2 flex flex-wrap gap-1.5">
                        {(p.product_units || []).map((u) => (
                          <span key={u.id} className="text-[10px] font-medium text-slate-500 bg-slate-50 border rounded-full px-2 py-0.5" style={{ borderColor: C.border }}>
                            1 {p.base_unit} = {u.conversion_to_base} {u.unit_name}
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
                    <option key={p.id} value={p.id}>{p.name} ({p.base_unit})</option>
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
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white mt-1 disabled:opacity-50"
                style={{ backgroundColor: C.primary }}
              >
                <Plus size={15} /> {saving ? "Saving…" : "Add to Stock"}
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
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Default selling price (₦, per {newProduct.baseUnit || "unit"}, optional)</label>
                <input
                  type="number"
                  value={newProduct.defaultPrice}
                  onChange={(e) => setNewProduct({ ...newProduct, defaultPrice: e.target.value })}
                  placeholder="e.g. 12000"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                  style={{ borderColor: C.border }}
                />
                <p className="text-[10.5px] text-slate-400 mt-1">Pre-fills at POS checkout — cashiers can still change it per sale.</p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-medium text-slate-500">Sell units (optional — beyond the purchase unit)</label>
                  <button onClick={addSellUnit} className="text-[11px] font-medium text-blue-600 flex items-center gap-1">
                    <Plus size={11} /> Add unit
                  </button>
                </div>
                <div className="space-y-2">
                  {newProduct.sellUnits.map((u, i) => (
                    <div key={i} className="rounded-xl border p-3" style={{ borderColor: C.border }}>
                      <div className="flex items-center gap-2 mb-2">
                        <input
                          value={u.name}
                          onChange={(e) => updateSellUnit(i, "name", e.target.value)}
                          placeholder="packet"
                          className="flex-1 min-w-0 rounded-lg border px-3 py-2 text-[13px] outline-none"
                          style={{ borderColor: C.border }}
                        />
                        {newProduct.sellUnits.length > 1 && (
                          <button onClick={() => removeSellUnit(i)} className="text-slate-300 hover:text-red-500 shrink-0 p-1">
                            <X size={14} />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[11px] text-slate-400 whitespace-nowrap">per 1 {newProduct.baseUnit || "unit"} =</span>
                        <input
                          type="number"
                          value={u.factor}
                          onChange={(e) => updateSellUnit(i, "factor", e.target.value)}
                          placeholder="20"
                          className="w-20 min-w-0 rounded-lg border px-3 py-2 text-[13px] outline-none"
                          style={{ borderColor: C.border }}
                        />
                        <span className="text-[11px] text-slate-400 truncate">{u.name || "unit"}{u.factor && u.factor !== "1" ? "s" : ""}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={createProduct}
                disabled={saving}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white mt-1 disabled:opacity-50"
                style={{ backgroundColor: C.primary }}
              >
                <Boxes size={15} /> {saving ? "Saving…" : "Create Product"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- Return stock to supplier modal ---------- */}
        {returnModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setReturnModal(null)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Return stock to supplier</h3>
                <button onClick={() => setReturnModal(null)}><X size={16} className="text-slate-400" /></button>
              </div>
              <p className="text-[12px] text-slate-500 mb-4">
                {returnModal.remaining_quantity} units currently in stock from this batch (bought {new Date(returnModal.purchase_date).toISOString().slice(0, 10)}).
              </p>

              <label className="text-[11px] font-medium text-slate-500 block mb-1">Quantity to return</label>
              <input
                type="number"
                value={returnQty}
                onChange={(e) => setReturnQty(e.target.value)}
                max={returnModal.remaining_quantity}
                placeholder={`up to ${returnModal.remaining_quantity}`}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-3"
                style={{ borderColor: C.border }}
              />

              <label className="text-[11px] font-medium text-slate-500 block mb-1">Reason (optional)</label>
              <input
                value={returnReason}
                onChange={(e) => setReturnReason(e.target.value)}
                placeholder="e.g. damaged, wrong item"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4"
                style={{ borderColor: C.border }}
              />

              <button
                onClick={submitPurchaseReturn}
                disabled={savingReturn || !returnQty || Number(returnQty) > Number(returnModal.remaining_quantity)}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: C.danger }}
              >
                {savingReturn ? "Processing…" : "Confirm Return"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- Edit selling price modal ---------- */}
        {editPriceProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setEditPriceProduct(null)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Edit selling price</h3>
                <button onClick={() => setEditPriceProduct(null)}><X size={16} className="text-slate-400" /></button>
              </div>
              <p className="text-[12px] text-slate-500 mb-4">{editPriceProduct.name} — per {editPriceProduct.base_unit}</p>

              <label className="text-[11px] font-medium text-slate-500 block mb-1">New price (₦)</label>
              <input
                type="number"
                value={newPriceValue}
                onChange={(e) => setNewPriceValue(e.target.value)}
                placeholder="e.g. 12000"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4"
                style={{ borderColor: C.border }}
              />

              <button
                onClick={savePrice}
                disabled={savingPrice}
                className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: C.primary }}
              >
                {savingPrice ? "Saving…" : "Save Price"}
              </button>
            </div>
          </div>
        )}

        {/* ---------- Price/change history modal ---------- */}
        {historyProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setHistoryProduct(null)} />
            <div className="relative w-full max-w-md bg-white rounded-3xl p-5 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">{historyProduct.name} — history</h3>
                <button onClick={() => setHistoryProduct(null)}><X size={16} className="text-slate-400" /></button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-3">
                {historyLoading ? (
                  <p className="text-xs text-slate-400 text-center py-6">Loading…</p>
                ) : historyLog.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">No changes recorded yet.</p>
                ) : (
                  historyLog.map((h) => {
                    const priceChanged = h.action === "UPDATE" && h.before?.default_price != h.after?.default_price;
                    return (
                      <div key={h.id} className="border rounded-xl px-3.5 py-2.5" style={{ borderColor: C.border }}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-medium text-slate-700">{h.user_name || h.user_email || "Unknown user"}</span>
                          <span className="text-[10.5px] text-slate-400">{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        {h.action === "INSERT" && (
                          <p className="text-[11.5px] text-slate-500">Created this product{h.after?.default_price ? ` with price ${naira(h.after.default_price)}` : ""}.</p>
                        )}
                        {h.action === "DELETE" && (
                          <p className="text-[11.5px] text-red-500">Deleted this product.</p>
                        )}
                        {h.action === "UPDATE" && priceChanged && (
                          <p className="text-[11.5px] text-slate-500">
                            Changed price: <span className="text-red-500">{h.before?.default_price ? naira(h.before.default_price) : "not set"}</span>
                            {" → "}
                            <span className="text-emerald-600 font-medium">{h.after?.default_price ? naira(h.after.default_price) : "not set"}</span>
                          </p>
                        )}
                        {h.action === "UPDATE" && !priceChanged && (
                          <p className="text-[11.5px] text-slate-500">Updated product details.</p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
