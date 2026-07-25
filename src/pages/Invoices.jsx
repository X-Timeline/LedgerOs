import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { FileText, Plus, Check, Clock, AlertCircle, X } from "lucide-react";
import { api } from "../lib/api.js";

const C = { primary: "#2563EB", success: "#22C55E", warning: "#F59E0B", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

const statusMeta = {
  pending: { label: "Pending", color: C.warning, icon: Clock },
  overdue: { label: "Overdue", color: C.danger, icon: AlertCircle },
  paid: { label: "Paid", color: C.success, icon: Check },
};

export default function Invoices() {
  const { selectedShop } = useOutletContext();
  const shopId = selectedShop?.id !== "all" ? selectedShop?.id : null;

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customer: "", amount: "", due: "" });
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    api.get(`/invoices?shopId=${shopId}`)
      .then((data) => { setInvoices(data); setLoading(false); })
      .catch((err) => { setError(err.message); setLoading(false); });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.effectiveStatus === filter);

  const addInvoice = async () => {
    if (!form.customer || !form.amount || !shopId) return;
    setSaving(true);
    try {
      await api.post("/invoices", {
        shopId,
        customerName: form.customer,
        amount: Number(form.amount),
        dueDate: form.due || new Date().toISOString().slice(0, 10),
      });
      await refresh();
      setForm({ customer: "", amount: "", due: "" });
      setShowAdd(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const markPaid = async (id) => {
    try {
      await api.patch(`/invoices/${id}/pay`, {});
      await refresh();
    } catch (err) {
      setError(err.message);
    }
  };

  if (!shopId) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4">
        <p className="text-sm text-slate-400">Select a specific shop from the switcher above to view its invoices.</p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Invoices</h1>
            <p className="text-xs text-slate-400">{selectedShop.name}</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3.5 py-2" style={{ backgroundColor: C.primary }}>
            <Plus size={14} /> New Invoice
          </button>
        </div>

        {error && (
          <div className="mb-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>
        )}

        <div className="flex gap-1.5 mb-4 flex-wrap">
          {["all", "pending", "overdue", "paid"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-[11px] font-medium px-2.5 py-1.5 rounded-full border capitalize ${filter === f ? "bg-slate-900 text-white border-slate-900" : "text-slate-500"}`} style={{ borderColor: filter === f ? "#0F172A" : C.border }}>
              {f}
            </button>
          ))}
        </div>

        {loading ? (
          <p className="text-xs text-slate-400">Loading invoices…</p>
        ) : (
        <div className="space-y-2">
          {filtered.map((inv) => {
            const meta = statusMeta[inv.effectiveStatus];
            return (
              <div key={inv.id} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}14` }}>
                    <meta.icon size={15} style={{ color: meta.color }} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-slate-900">{inv.customer_name}</p>
                    <p className="text-[11px]" style={{ color: meta.color }}>{meta.label} · Due {inv.due_date}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold tabular-nums text-slate-900">{naira(inv.amount)}</span>
                  {inv.effectiveStatus !== "paid" && (
                    <button onClick={() => markPaid(inv.id)} className="text-[10px] font-semibold text-blue-600 border border-blue-200 rounded-full px-2 py-1">
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        )}

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowAdd(false)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">New invoice</h3>
                <button onClick={() => setShowAdd(false)}><X size={16} className="text-slate-400" /></button>
              </div>
              <input value={form.customer} onChange={(e) => setForm({ ...form, customer: e.target.value })} placeholder="Customer name" className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-3" style={{ borderColor: C.border }} />
              <div className="relative mb-3">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none" style={{ borderColor: C.border }} />
              </div>
              <input type="date" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4" style={{ borderColor: C.border }} />
              <button onClick={addInvoice} disabled={saving} className="w-full rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60" style={{ backgroundColor: C.primary }}>
                {saving ? "Creating…" : "Create Invoice"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
