import { useState, useEffect } from "react";
import { Building2, Store, Plus, X, Check } from "lucide-react";
import { api } from "../lib/api.js";

const C = { primary: "#2563EB", success: "#22C55E", bg: "#F8FAFC", border: "#E2E8F0" };
const currencies = ["NGN — Nigerian Naira (₦)", "GHS — Ghanaian Cedi (₵)", "KES — Kenyan Shilling (KSh)", "USD — US Dollar ($)"];

export default function Settings() {
  const [tab, setTab] = useState("business");
  const [business, setBusiness] = useState({ name: "Chase Enterprise Ltd", currency: currencies[0] });
  const [businessId, setBusinessId] = useState(null);
  const [saved, setSaved] = useState(false);
  const [shops, setShops] = useState([]);
  const [loadingShops, setLoadingShops] = useState(true);
  const [showAddShop, setShowAddShop] = useState(false);
  const [newShop, setNewShop] = useState({ name: "" });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  // Load the real shop list from the backend
  const loadShops = async () => {
    setLoadingShops(true);
    try {
      const data = await api.get("/shops");
      setShops(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingShops(false);
    }
  };

  // Load the business this user owns, so we know which businessId to attach new shops to
  const loadBusiness = async () => {
    try {
      const businesses = await api.get("/businesses");
      if (businesses[0]) {
        setBusiness({ name: businesses[0].name, currency: businesses[0].currency });
        setBusinessId(businesses[0].id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadBusiness();
    loadShops();
  }, []);

  const saveBusiness = async () => {
    if (!businessId) return;
    try {
      await api.patch(`/businesses/${businessId}`, { currency: business.currency });
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    } catch (err) {
      setError(err.message);
    }
  };

  const addShop = async () => {
    if (!newShop.name || !businessId) return;
    setCreating(true);
    setError("");
    try {
      // Note: create_business_with_shop always creates a NEW business too.
      // Since we already have a business, this should call a dedicated
      // "add shop to existing business" endpoint instead. See note below.
      await api.post("/shops", { businessId, name: newShop.name });
      await loadShops();
      setNewShop({ name: "" });
      setShowAddShop(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-lg font-semibold text-slate-900 mb-1">Settings</h1>
        <p className="text-xs text-slate-400 mb-5">Manage your business and shops</p>

        <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit">
          {[{ key: "business", label: "Business", icon: Building2 }, { key: "shops", label: "Shops", icon: Store }].map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "business" && (
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Business profile</h3>
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Business name</label>
            <input value={business.name} onChange={(e) => setBusiness({ ...business, name: e.target.value })} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4" style={{ borderColor: C.border }} />
            <label className="text-[11px] font-medium text-slate-500 block mb-1">Currency</label>
            <select value={business.currency} onChange={(e) => setBusiness({ ...business, currency: e.target.value })} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-5 bg-white" style={{ borderColor: C.border }}>
              {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <button onClick={saveBusiness} className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white" style={{ backgroundColor: saved ? C.success : C.primary }}>
              {saved ? <><Check size={15} /> Saved</> : "Save Changes"}
            </button>
          </div>
        )}

        {tab === "shops" && (
          <div>
            {error && (
              <div className="mb-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
            )}
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500">{shops.length} shop{shops.length === 1 ? "" : "s"} under this business</p>
              <button onClick={() => setShowAddShop(true)} className="flex items-center gap-1.5 text-[11px] font-semibold text-white rounded-lg px-2.5 py-1.5" style={{ backgroundColor: C.primary }}>
                <Plus size={12} /> Open Shop
              </button>
            </div>
            {loadingShops ? (
              <p className="text-xs text-slate-400">Loading shops…</p>
            ) : (
              <div className="space-y-2">
                {shops.map((s) => (
                  <div key={s.id} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                    <div className="flex items-center gap-3">
                      <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${C.primary}12` }}>
                        <Store size={15} style={{ color: C.primary }} />
                      </span>
                      <p className="text-[13.5px] font-semibold text-slate-900">{s.name}</p>
                    </div>
                    <span className="text-[12px] text-slate-400">Code: {s.shop_code}</span>
                  </div>
                ))}
              </div>
            )}

            {showAddShop && (
              <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowAddShop(false)} />
                <div className="relative w-full max-w-sm bg-white rounded-3xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-slate-900">Open a new shop</h3>
                    <button onClick={() => setShowAddShop(false)}><X size={16} className="text-slate-400" /></button>
                  </div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Shop name</label>
                  <input value={newShop.name} onChange={(e) => setNewShop({ ...newShop, name: e.target.value })} placeholder="e.g. Chase Electronics" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4" style={{ borderColor: C.border }} />
                  <button onClick={addShop} disabled={creating} className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: C.primary }}>
                    {creating ? "Creating…" : "Create Shop"}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
