import { useState } from "react";
import { FileText, Plus, Check, Clock, AlertCircle, X, Info } from "lucide-react";

const C = { primary: "#2563EB", success: "#22C55E", warning: "#F59E0B", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

const initialInvoices = [
  { id: "i1", customer: "Chuka Stores", amount: 340000, due: "2026-07-20", status: "pending" },
  { id: "i2", customer: "Blessing Eze", amount: 62000, due: "2026-07-19", status: "pending" },
  { id: "i3", customer: "Obi Retail Ltd", amount: 198000, due: "2026-07-15", status: "overdue" },
  { id: "i4", customer: "Ngozi Umeh", amount: 24500, due: "2026-07-10", status: "paid" },
];

const statusMeta = {
  pending: { label: "Pending", color: C.warning, icon: Clock },
  overdue: { label: "Overdue", color: C.danger, icon: AlertCircle },
  paid: { label: "Paid", color: C.success, icon: Check },
};

export default function Invoices() {
  const [invoices, setInvoices] = useState(initialInvoices);
  const [filter, setFilter] = useState("all");
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ customer: "", amount: "", due: "" });

  const filtered = filter === "all" ? invoices : invoices.filter((i) => i.status === filter);

  const addInvoice = () => {
    if (!form.customer || !form.amount) return;
    setInvoices((prev) => [{ id: "i" + Date.now(), ...form, amount: Number(form.amount), status: "pending" }, ...prev]);
    setForm({ customer: "", amount: "", due: "" });
    setShowAdd(false);
  };

  const markPaid = (id) => setInvoices((prev) => prev.map((i) => (i.id === id ? { ...i, status: "paid" } : i)));

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Invoices</h1>
            <p className="text-xs text-slate-400">Chase Furniture</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3.5 py-2" style={{ backgroundColor: C.primary }}>
            <Plus size={14} /> New Invoice
          </button>
        </div>

        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-2.5 mb-4">
          <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            Sample data — there's no invoices table in the backend yet, so nothing entered here is saved. Needs a schema addition before this is real.
          </p>
        </div>

        <div className="flex gap-1.5 mb-4 flex-wrap">
          {["all", "pending", "overdue", "paid"].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`text-[11px] font-medium px-2.5 py-1.5 rounded-full border capitalize ${filter === f ? "bg-slate-900 text-white border-slate-900" : "text-slate-500"}`} style={{ borderColor: filter === f ? "#0F172A" : C.border }}>
              {f}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          {filtered.map((inv) => {
            const meta = statusMeta[inv.status];
            return (
              <div key={inv.id} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${meta.color}14` }}>
                    <meta.icon size={15} style={{ color: meta.color }} />
                  </span>
                  <div>
                    <p className="text-[13.5px] font-semibold text-slate-900">{inv.customer}</p>
                    <p className="text-[11px]" style={{ color: meta.color }}>{meta.label} · Due {inv.due}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-semibold tabular-nums text-slate-900">{naira(inv.amount)}</span>
                  {inv.status !== "paid" && (
                    <button onClick={() => markPaid(inv.id)} className="text-[10px] font-semibold text-blue-600 border border-blue-200 rounded-full px-2 py-1">
                      Mark Paid
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

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
              <button onClick={addInvoice} className="w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ backgroundColor: C.primary }}>
                Create Invoice
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
