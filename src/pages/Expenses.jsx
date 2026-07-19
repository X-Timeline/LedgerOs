import { useState, useMemo } from "react";
import {
  Receipt, Plus, Fuel, Users, Zap, Bus, Landmark as TaxIcon, Home,
  Wrench, MoreHorizontal, Banknote, Landmark
} from "lucide-react";

const C = { primary: "#2563EB", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

const categories = [
  { key: "Fuel", icon: Fuel },
  { key: "Salary", icon: Users },
  { key: "Electricity", icon: Zap },
  { key: "Transport", icon: Bus },
  { key: "Tax", icon: TaxIcon },
  { key: "Rent", icon: Home },
  { key: "Maintenance", icon: Wrench },
  { key: "Misc", icon: MoreHorizontal },
];

const initialExpenses = [
  { id: "x1", category: "Fuel", amount: 12000, channel: "cash", date: "2026-07-17" },
  { id: "x2", category: "Rent", amount: 150000, channel: "bank", date: "2026-07-01" },
  { id: "x3", category: "Salary", amount: 90000, channel: "bank", date: "2026-07-05" },
  { id: "x4", category: "Electricity", amount: 18000, channel: "cash", date: "2026-07-14" },
];

export default function Expenses() {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ category: "Fuel", amount: "", channel: "cash" });
  const [filter, setFilter] = useState("all");

  const addExpense = () => {
    if (!form.amount) return;
    setExpenses((prev) => [{ id: "x" + Date.now(), ...form, amount: Number(form.amount), date: new Date().toISOString().slice(0, 10) }, ...prev]);
    setForm({ category: "Fuel", amount: "", channel: "cash" });
    setShowAdd(false);
  };

  const filtered = filter === "all" ? expenses : expenses.filter((e) => e.category === filter);
  const total = useMemo(() => filtered.reduce((s, e) => s + e.amount, 0), [filtered]);

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Expenses</h1>
            <p className="text-xs text-slate-400">Chase Furniture</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3.5 py-2" style={{ backgroundColor: C.primary }}>
            <Plus size={14} /> Add Expense
          </button>
        </div>

        <div className="rounded-2xl bg-white border p-4 my-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
          <p className="text-[11px] text-slate-500">Total {filter === "all" ? "" : filter + " "}expenses</p>
          <p className="text-xl font-semibold tabular-nums text-slate-900">{naira(total)}</p>
        </div>

        <div className="flex gap-1.5 mb-4 flex-wrap">
          <button onClick={() => setFilter("all")} className={`text-[11px] font-medium px-2.5 py-1.5 rounded-full border ${filter === "all" ? "bg-slate-900 text-white border-slate-900" : "text-slate-500"}`} style={{ borderColor: filter === "all" ? "#0F172A" : C.border }}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.key} onClick={() => setFilter(c.key)} className={`text-[11px] font-medium px-2.5 py-1.5 rounded-full border ${filter === c.key ? "bg-slate-900 text-white border-slate-900" : "text-slate-500"}`} style={{ borderColor: filter === c.key ? "#0F172A" : C.border }}>
              {c.key}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((e) => {
            const meta = categories.find((c) => c.key === e.category);
            return (
              <div key={e.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${C.danger}12` }}>
                    <meta.icon size={14} style={{ color: C.danger }} />
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{e.category}</p>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1">
                      {e.date} · {e.channel === "cash" ? <Banknote size={10} /> : <Landmark size={10} />} {e.channel}
                    </p>
                  </div>
                </div>
                <span className="text-[13px] font-semibold tabular-nums text-slate-900">{naira(e.amount)}</span>
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-xs text-slate-400 text-center py-8">No expenses in this category yet.</p>}
        </div>

        {showAdd && (
          <div className="fixed inset-0 z-50 flex items-end lg:items-center lg:justify-center">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowAdd(false)} />
            <div className="relative w-full lg:w-96 bg-white rounded-t-3xl lg:rounded-3xl p-5">
              <h3 className="text-sm font-semibold text-slate-900 mb-4">Log an expense</h3>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {categories.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => setForm({ ...form, category: c.key })}
                    className={`flex flex-col items-center gap-1 rounded-xl border py-2.5 ${form.category === c.key ? "border-blue-500 bg-blue-50" : ""}`}
                    style={{ borderColor: form.category === c.key ? C.primary : C.border }}
                  >
                    <c.icon size={15} style={{ color: form.category === c.key ? C.primary : "#64748B" }} />
                    <span className="text-[9.5px] font-medium text-slate-600">{c.key}</span>
                  </button>
                ))}
              </div>
              <div className="relative mb-3">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                <input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Amount"
                  className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none"
                  style={{ borderColor: C.border }}
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
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
              <button onClick={addExpense} className="w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ backgroundColor: C.primary }}>
                Save Expense
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
