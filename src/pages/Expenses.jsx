import { useState, useEffect, useCallback, useMemo } from "react";
import { useOutletContext } from "react-router-dom";
import { Receipt, Plus, Banknote, Landmark, Fuel, Zap, Wrench, Home, Users, HelpCircle, AlertCircle } from "lucide-react";
import { api } from "../lib/api.js";

const C = { primary: "#2563EB", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

const categories = [
  { key: "Fuel", icon: Fuel },
  { key: "Salary", icon: Users },
  { key: "Electricity", icon: Zap },
  { key: "Transport", icon: Fuel },
  { key: "Rent", icon: Home },
  { key: "Maintenance", icon: Wrench },
  { key: "Misc", icon: HelpCircle },
];

export default function Expenses() {
  const { selectedShop } = useOutletContext();
  const shopId = selectedShop?.id !== "all" ? selectedShop?.id : null;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: "Fuel", amount: "", channel: "cash", note: "" });
  const [showForm, setShowForm] = useState(false);

  const refresh = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    api
      .get(`/expenses?shopId=${shopId}`)
      .then((data) => {
        setLoading(false);
        setExpenses(data || []);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  const total = useMemo(() => expenses.reduce((s, e) => s + Number(e.amount), 0), [expenses]);

  const addExpense = async () => {
    if (!form.amount) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/expenses", {
        shopId,
        category: form.category,
        amount: Number(form.amount),
        channel: form.channel.toUpperCase(),
        date: new Date().toISOString(),
      });
      setSaving(false);
      setForm({ category: "Fuel", amount: "", channel: "cash", note: "" });
      setShowForm(false);
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
          Select a specific shop from the switcher above — expenses are tracked per shop.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Expenses</h1>
            <p className="text-xs text-slate-400">{selectedShop.name}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3.5 py-2" style={{ backgroundColor: C.primary }}>
            <Plus size={14} /> Add
          </button>
        </div>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mt-4">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="rounded-2xl bg-white border p-4 my-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
          <p className="text-[11px] text-slate-500">Total expenses this period</p>
          <p className="text-xl font-semibold tabular-nums text-slate-900">{loading ? "…" : naira(total)}</p>
        </div>

        <div className="space-y-2">
          {loading && <p className="text-xs text-slate-400 text-center py-10">Loading…</p>}
          {!loading && expenses.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-10">No expenses logged yet.</p>
          )}
          {expenses.map((e) => {
            const meta = categories.find((c) => c.key === e.category) || categories[categories.length - 1];
            return (
              <div key={e.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${C.danger}12` }}>
                    <meta.icon size={15} style={{ color: C.danger }} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{e.category}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      {new Date(e.date).toISOString().slice(0, 10)} · {e.channel === "CASH" ? <Banknote size={11} /> : <Landmark size={11} />} {e.channel.toLowerCase()}
                    </p>
                  </div>
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-red-500">−{naira(e.amount)}</span>
              </div>
            );
          })}
        </div>

        {showForm && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowForm(false)} />
            <div className="relative w-full lg:w-96 bg-white rounded-t-3xl lg:rounded-3xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Log an expense</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-2">Category</label>
                  <div className="grid grid-cols-4 gap-2">
                    {categories.map((c) => (
                      <button
                        key={c.key}
                        onClick={() => setForm({ ...form, category: c.key })}
                        className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 text-[10px] font-medium ${form.category === c.key ? "border-blue-500 bg-blue-50 text-blue-600" : "text-slate-500"}`}
                        style={{ borderColor: form.category === c.key ? C.primary : C.border }}
                      >
                        <c.icon size={14} />
                        {c.key}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-1">Amount</label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                    <input
                      type="number"
                      value={form.amount}
                      onChange={(e) => setForm({ ...form, amount: e.target.value })}
                      placeholder="12,000"
                      className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none"
                      style={{ borderColor: C.border }}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-500 block mb-2">Paid via</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[{ key: "cash", label: "Cash", icon: Banknote }, { key: "bank", label: "Bank", icon: Landmark }].map((m) => (
                      <button
                        key={m.key}
                        onClick={() => setForm({ ...form, channel: m.key })}
                        className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-medium ${form.channel === m.key ? "border-blue-500 bg-blue-50 text-blue-600" : "text-slate-500"}`}
                        style={{ borderColor: form.channel === m.key ? C.primary : C.border }}
                      >
                        <m.icon size={13} /> {m.label}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={addExpense} disabled={saving} className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white mt-1 disabled:opacity-50" style={{ backgroundColor: C.primary }}>
                  <Receipt size={15} /> {saving ? "Saving…" : "Save Expense"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
