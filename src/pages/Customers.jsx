import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { Users, Plus, ChevronLeft, ArrowUp, ArrowDown, Phone, X, AlertCircle } from "lucide-react";
import { api } from "../lib/api.js";

const C = { primary: "#2563EB", success: "#22C55E", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

export default function Customers() {
  const { selectedShop } = useOutletContext();
  const shopId = selectedShop?.id !== "all" ? selectedShop?.id : null;

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const [selected, setSelected] = useState(null);
  const [ledger, setLedger] = useState({ entries: [], balanceOwed: 0 });
  const [ledgerLoading, setLedgerLoading] = useState(false);

  const [showAdd, setShowAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [entryForm, setEntryForm] = useState({ type: "payment", amount: "", channel: "cash", note: "" });

  const refresh = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    api
      .get(`/customers?shopId=${shopId}`)
      .then((data) => {
        setLoading(false);
        setCustomers(data || []);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  const openCustomer = (c) => {
    setSelected(c);
    setLedgerLoading(true);
    api
      .get(`/customers/${c.id}/debt`)
      .then((data) => {
        setLedgerLoading(false);
        setLedger(data);
      })
      .catch((err) => {
        setLedgerLoading(false);
        setError(err.message);
      });
  };

  const addCustomer = async () => {
    if (!newCustomer.name) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/customers", { shopId, name: newCustomer.name, phone: newCustomer.phone });
      setSaving(false);
      setNewCustomer({ name: "", phone: "" });
      setShowAdd(false);
      refresh();
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  };

  const addEntry = async () => {
    if (!entryForm.amount || !selected) return;
    setSaving(true);
    setError("");
    try {
      await api.post(`/customers/${selected.id}/debt`, {
        shopId,
        type: entryForm.type === "charge" ? "CHARGE" : "PAYMENT",
        amount: Number(entryForm.amount),
        channel: entryForm.channel.toUpperCase(),
      });
      setSaving(false);
      setEntryForm({ type: "payment", amount: "", channel: "cash", note: "" });
      openCustomer(selected); // refresh this customer's ledger
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  };

  if (!shopId) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Select a specific shop from the switcher above — customers are tracked per shop.
        </p>
      </div>
    );
  }

  if (selected) {
    return (
      <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
        <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-4">
            <ChevronLeft size={14} /> All customers
          </button>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

          <div className="rounded-2xl bg-white border p-5 mb-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h1 className="text-base font-semibold text-slate-900">{selected.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={11} /> {selected.phone}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">Outstanding balance</span>
              <span className={`text-xl font-semibold tabular-nums ${ledger.balanceOwed > 0 ? "text-red-500" : "text-emerald-600"}`}>
                {ledgerLoading ? "…" : naira(Math.abs(ledger.balanceOwed))}
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border p-5 mb-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Record payment or credit sale</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{ key: "payment", label: "Payment Received" }, { key: "charge", label: "New Credit Sale" }].map((t) => (
                <button
                  key={t.key}
                  onClick={() => setEntryForm({ ...entryForm, type: t.key })}
                  className={`text-[12px] font-medium rounded-xl border py-2.5 ${entryForm.type === t.key ? "border-blue-500 bg-blue-50 text-blue-600" : "text-slate-500"}`}
                  style={{ borderColor: entryForm.type === t.key ? C.primary : C.border }}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="relative mb-3">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
              <input
                type="number"
                value={entryForm.amount}
                onChange={(e) => setEntryForm({ ...entryForm, amount: e.target.value })}
                placeholder="Amount"
                className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none"
                style={{ borderColor: C.border }}
              />
            </div>
            <button onClick={addEntry} disabled={saving} className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: C.primary }}>
              {saving ? "Saving…" : "Save Entry"}
            </button>
          </div>

          <h4 className="text-xs font-medium text-slate-500 mb-2">History</h4>
          <div className="space-y-2">
            {ledgerLoading && <p className="text-xs text-slate-400 text-center py-6">Loading…</p>}
            {!ledgerLoading && ledger.entries.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-6">No entries yet.</p>
            )}
            {ledger.entries.slice().reverse().map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: e.type === "CHARGE" ? `${C.danger}14` : `${C.success}14` }}>
                    {e.type === "CHARGE" ? <ArrowUp size={13} style={{ color: C.danger }} /> : <ArrowDown size={13} style={{ color: C.success }} />}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{e.type === "CHARGE" ? "Credit sale" : "Payment received"}</p>
                    <p className="text-[11px] text-slate-400">{new Date(e.date).toISOString().slice(0, 10)}</p>
                  </div>
                </div>
                <span className={`text-[13px] font-semibold tabular-nums ${e.type === "CHARGE" ? "text-red-500" : "text-emerald-600"}`}>
                  {e.type === "CHARGE" ? "+" : "−"}{naira(e.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Customers</h1>
            <p className="text-xs text-slate-400">{selectedShop.name}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3.5 py-2" style={{ backgroundColor: C.primary }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="space-y-2">
          {loading && <p className="text-xs text-slate-400 text-center py-10">Loading…</p>}
          {!loading && customers.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-10">No customers yet — add your first one.</p>
          )}
          {customers.map((c) => (
            <button key={c.id} onClick={() => openCustomer(c)} className="w-full flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: C.primary }}>
                  {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div className="text-left">
                  <p className="text-[13.5px] font-semibold text-slate-900">{c.name}</p>
                  <p className="text-[11px] text-slate-400">{c.phone}</p>
                </div>
              </div>
              <ChevronLeft size={16} className="text-slate-300 rotate-180" />
            </button>
          ))}
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowAdd(false)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">New customer</h3>
                <button onClick={() => setShowAdd(false)}><X size={16} className="text-slate-400" /></button>
              </div>
              <input
                value={newCustomer.name}
                onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                placeholder="Full name"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-3"
                style={{ borderColor: C.border }}
              />
              <input
                value={newCustomer.phone}
                onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4"
                style={{ borderColor: C.border }}
              />
              <button onClick={addCustomer} disabled={saving} className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-50" style={{ backgroundColor: C.primary }}>
                {saving ? "Saving…" : "Add Customer"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
