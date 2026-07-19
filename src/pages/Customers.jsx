import { useState } from "react";
import { Users, Plus, ChevronLeft, ArrowUp, ArrowDown, Phone, X } from "lucide-react";

const C = { primary: "#2563EB", success: "#22C55E", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

const initialCustomers = [
  {
    id: "c1", name: "Ngozi Umeh", phone: "0803 123 4567",
    entries: [
      { id: "x1", type: "charge", amount: 24500, note: "Sale on credit", date: "2026-07-12" },
      { id: "x2", type: "payment", amount: 10000, note: "Part payment", date: "2026-07-16" },
    ],
  },
  {
    id: "c2", name: "Chuka Stores", phone: "0806 987 6543",
    entries: [
      { id: "x3", type: "charge", amount: 340000, note: "Bulk order on credit", date: "2026-07-10" },
    ],
  },
  {
    id: "c3", name: "Blessing Eze", phone: "0701 456 7890",
    entries: [
      { id: "x4", type: "charge", amount: 62000, note: "Sale on credit", date: "2026-07-17" },
      { id: "x5", type: "payment", amount: 62000, note: "Paid in full", date: "2026-07-18" },
    ],
  },
];

const owed = (c) => c.entries.reduce((s, e) => s + (e.type === "charge" ? e.amount : -e.amount), 0);

export default function Customers() {
  const [customers, setCustomers] = useState(initialCustomers);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "" });
  const [entryForm, setEntryForm] = useState({ type: "payment", amount: "", note: "" });

  const customer = customers.find((c) => c.id === selected);

  const addCustomer = () => {
    if (!newCustomer.name) return;
    setCustomers((prev) => [...prev, { id: "c" + Date.now(), ...newCustomer, entries: [] }]);
    setNewCustomer({ name: "", phone: "" });
    setShowAdd(false);
  };

  const addEntry = () => {
    if (!entryForm.amount) return;
    setCustomers((prev) =>
      prev.map((c) =>
        c.id === selected
          ? { ...c, entries: [{ id: "x" + Date.now(), ...entryForm, amount: Number(entryForm.amount), date: new Date().toISOString().slice(0, 10) }, ...c.entries] }
          : c
      )
    );
    setEntryForm({ type: "payment", amount: "", note: "" });
  };

  if (customer) {
    const balance = owed(customer);
    return (
      <div className="min-h-screen w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
        <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-4">
            <ChevronLeft size={14} /> All customers
          </button>
          <div className="rounded-2xl bg-white border p-5 mb-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h1 className="text-base font-semibold text-slate-900">{customer.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={11} /> {customer.phone}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">Outstanding balance</span>
              <span className={`text-xl font-semibold tabular-nums ${balance > 0 ? "text-red-500" : "text-emerald-600"}`}>{naira(Math.abs(balance))}</span>
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
            <button onClick={addEntry} className="w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ backgroundColor: C.primary }}>
              Save Entry
            </button>
          </div>

          <h4 className="text-xs font-medium text-slate-500 mb-2">History</h4>
          <div className="space-y-2">
            {customer.entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: e.type === "charge" ? `${C.danger}14` : `${C.success}14` }}>
                    {e.type === "charge" ? <ArrowUp size={13} style={{ color: C.danger }} /> : <ArrowDown size={13} style={{ color: C.success }} />}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{e.note}</p>
                    <p className="text-[11px] text-slate-400">{e.date}</p>
                  </div>
                </div>
                <span className={`text-[13px] font-semibold tabular-nums ${e.type === "charge" ? "text-red-500" : "text-emerald-600"}`}>
                  {e.type === "charge" ? "+" : "−"}{naira(e.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Customers</h1>
            <p className="text-xs text-slate-400">Chase Furniture</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3.5 py-2" style={{ backgroundColor: C.primary }}>
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="space-y-2">
          {customers.map((c) => {
            const balance = owed(c);
            return (
              <button key={c.id} onClick={() => setSelected(c.id)} className="w-full flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: C.primary }}>
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                  </span>
                  <div className="text-left">
                    <p className="text-[13.5px] font-semibold text-slate-900">{c.name}</p>
                    <p className="text-[11px] text-slate-400">{c.phone}</p>
                  </div>
                </div>
                <span className={`text-[13px] font-semibold tabular-nums ${balance > 0 ? "text-red-500" : "text-slate-400"}`}>
                  {balance > 0 ? naira(balance) : "Settled"}
                </span>
              </button>
            );
          })}
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
              <button onClick={addCustomer} className="w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ backgroundColor: C.primary }}>
                Add Customer
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
