import { useState } from "react";
import { Truck, Plus, ChevronLeft, ArrowUp, ArrowDown, Phone, X } from "lucide-react";

const C = { primary: "#2563EB", success: "#22C55E", warning: "#F59E0B", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");

const initialSuppliers = [
  {
    id: "s1", name: "Dangote Distribution Ltd", phone: "0812 111 2233",
    entries: [
      { id: "y1", type: "charge", amount: 145000, note: "Stock bought on credit", date: "2026-07-09" },
    ],
  },
  {
    id: "s2", name: "Golden Foods Wholesale", phone: "0705 444 5566",
    entries: [
      { id: "y2", type: "charge", amount: 96000, note: "Restock on credit", date: "2026-07-14" },
      { id: "y3", type: "payment", amount: 50000, note: "Part payment", date: "2026-07-17" },
    ],
  },
];

const owed = (s) => s.entries.reduce((sum, e) => sum + (e.type === "charge" ? e.amount : -e.amount), 0);

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState(initialSuppliers);
  const [selected, setSelected] = useState(null);
  const [showAdd, setShowAdd] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", phone: "" });
  const [entryForm, setEntryForm] = useState({ type: "payment", amount: "", note: "" });

  const supplier = suppliers.find((s) => s.id === selected);

  const addSupplier = () => {
    if (!newSupplier.name) return;
    setSuppliers((prev) => [...prev, { id: "s" + Date.now(), ...newSupplier, entries: [] }]);
    setNewSupplier({ name: "", phone: "" });
    setShowAdd(false);
  };

  const addEntry = () => {
    if (!entryForm.amount) return;
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === selected
          ? { ...s, entries: [{ id: "y" + Date.now(), ...entryForm, amount: Number(entryForm.amount), date: new Date().toISOString().slice(0, 10) }, ...s.entries] }
          : s
      )
    );
    setEntryForm({ type: "payment", amount: "", note: "" });
  };

  if (supplier) {
    const balance = owed(supplier);
    return (
      <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
        <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
          <button onClick={() => setSelected(null)} className="flex items-center gap-1 text-xs font-medium text-slate-500 mb-4">
            <ChevronLeft size={14} /> All suppliers
          </button>
          <div className="rounded-2xl bg-white border p-5 mb-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h1 className="text-base font-semibold text-slate-900">{supplier.name}</h1>
            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5"><Phone size={11} /> {supplier.phone}</p>
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs text-slate-500">You owe</span>
              <span className={`text-xl font-semibold tabular-nums ${balance > 0 ? "text-amber-600" : "text-emerald-600"}`}>{naira(Math.abs(balance))}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white border p-5 mb-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-3">Record purchase or payment</h3>
            <div className="grid grid-cols-2 gap-2 mb-3">
              {[{ key: "payment", label: "Payment Made" }, { key: "charge", label: "Purchase on Credit" }].map((t) => (
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
            {supplier.entries.map((e) => (
              <div key={e.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3" style={{ borderColor: C.border }}>
                <div className="flex items-center gap-2.5">
                  <span className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: e.type === "charge" ? `${C.warning}14` : `${C.success}14` }}>
                    {e.type === "charge" ? <ArrowUp size={13} style={{ color: C.warning }} /> : <ArrowDown size={13} style={{ color: C.success }} />}
                  </span>
                  <div>
                    <p className="text-[13px] font-medium text-slate-900">{e.note}</p>
                    <p className="text-[11px] text-slate-400">{e.date}</p>
                  </div>
                </div>
                <span className={`text-[13px] font-semibold tabular-nums ${e.type === "charge" ? "text-amber-600" : "text-emerald-600"}`}>
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
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Suppliers</h1>
            <p className="text-xs text-slate-400">Chase Furniture</p>
          </div>
          <button onClick={() => setShowAdd(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3.5 py-2" style={{ backgroundColor: C.primary }}>
            <Plus size={14} /> Add
          </button>
        </div>

        <div className="space-y-2">
          {suppliers.map((s) => {
            const balance = owed(s);
            return (
              <button key={s.id} onClick={() => setSelected(s.id)} className="w-full flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                <div className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full flex items-center justify-center" style={{ backgroundColor: `${C.primary}12` }}>
                    <Truck size={15} style={{ color: C.primary }} />
                  </span>
                  <div className="text-left">
                    <p className="text-[13.5px] font-semibold text-slate-900">{s.name}</p>
                    <p className="text-[11px] text-slate-400">{s.phone}</p>
                  </div>
                </div>
                <span className={`text-[13px] font-semibold tabular-nums ${balance > 0 ? "text-amber-600" : "text-slate-400"}`}>
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
                <h3 className="text-sm font-semibold text-slate-900">New supplier</h3>
                <button onClick={() => setShowAdd(false)}><X size={16} className="text-slate-400" /></button>
              </div>
              <input
                value={newSupplier.name}
                onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })}
                placeholder="Business name"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-3"
                style={{ borderColor: C.border }}
              />
              <input
                value={newSupplier.phone}
                onChange={(e) => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4"
                style={{ borderColor: C.border }}
              />
              <button onClick={addSupplier} className="w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ backgroundColor: C.primary }}>
                Add Supplier
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
