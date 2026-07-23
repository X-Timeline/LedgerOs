import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Wallet, ArrowRightLeft, History, Banknote, Landmark, Plus,
  ArrowUp, ArrowDown, ArrowRight, AlertCircle
} from "lucide-react";
import { api } from "../lib/api.js";

const C = {
  primary: "#2563EB", success: "#22C55E", warning: "#F59E0B", danger: "#EF4444",
  bg: "#F8FAFC", border: "#E2E8F0",
};
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");
const EPOCH = "1970-01-01T00:00:00Z";

export default function CapitalCashBook() {
  const { selectedShop } = useOutletContext();
  const shopId = selectedShop?.id !== "all" ? selectedShop?.id : null;

  const [balances, setBalances] = useState({ cash: 0, bank: 0 });
  const [capitalEntries, setCapitalEntries] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [tab, setTab] = useState("capital");
  const [filter, setFilter] = useState("all");

  const [capitalForm, setCapitalForm] = useState({ direction: "in", amount: "", channel: "cash", note: "" });
  const [transferForm, setTransferForm] = useState({ direction: "cash_to_bank", amount: "", note: "" });

  const refresh = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    Promise.all([
      api.get(`/reports/cash-book?shopId=${shopId}&start=${encodeURIComponent(EPOCH)}&end=${encodeURIComponent(new Date().toISOString())}`),
      api.get(`/capital?shopId=${shopId}`),
      api.get(`/transfers?shopId=${shopId}`),
    ])
      .then(([cashBook, capitalData, transfersData]) => {
        setLoading(false);
        setBalances({ cash: cashBook.cash.net, bank: cashBook.bank.net });
        setCapitalEntries(capitalData || []);
        setTransfers(transfersData || []);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  const addCapital = async () => {
    if (!capitalForm.amount) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/capital", {
        shopId,
        direction: capitalForm.direction.toUpperCase(),
        amount: Number(capitalForm.amount),
        channel: capitalForm.channel.toUpperCase(),
        note: capitalForm.note || null,
      });
      setSaving(false);
      setCapitalForm({ direction: "in", amount: "", channel: "cash", note: "" });
      refresh();
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  };

  const addTransfer = async () => {
    if (!transferForm.amount) return;
    setSaving(true);
    setError("");
    try {
      await api.post("/transfers", {
        shopId,
        direction: transferForm.direction.toUpperCase(),
        amount: Number(transferForm.amount),
        note: transferForm.note || null,
      });
      setSaving(false);
      setTransferForm({ direction: "cash_to_bank", amount: "", note: "" });
      refresh();
    } catch (err) {
      setSaving(false);
      setError(err.message);
    }
  };

  const historyEntries = [
    ...capitalEntries.map((e) => ({
      id: e.id, type: "capital", direction: e.direction.toLowerCase(),
      amount: Number(e.amount), channel: e.channel.toLowerCase(), note: e.note, date: e.date,
    })),
    ...transfers.map((e) => ({
      id: e.id, type: "transfer", direction: e.direction.toLowerCase(),
      amount: Number(e.amount), note: e.note, date: e.date,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  const filtered = filter === "all" ? historyEntries : historyEntries.filter((e) => e.type === filter);

  const typeMeta = {
    capital: { label: "Capital", color: C.primary },
    transfer: { label: "Transfer", color: "#8B5CF6" },
  };

  if (!shopId) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Select a specific shop from the switcher above — capital and cash book are tracked per shop.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-lg font-semibold text-slate-900">Capital & Cash Book</h1>
        <p className="text-xs text-slate-400 mb-4">{selectedShop.name}</p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="rounded-2xl bg-white border p-4" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${C.primary}14` }}>
              <Banknote size={15} style={{ color: C.primary }} />
            </span>
            <p className="text-[11px] text-slate-500">Cash on Hand</p>
            <p className="text-lg font-semibold tabular-nums text-slate-900">{loading ? "…" : naira(balances.cash)}</p>
          </div>
          <div className="rounded-2xl bg-white border p-4" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <span className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${C.primary}14` }}>
              <Landmark size={15} style={{ color: C.primary }} />
            </span>
            <p className="text-[11px] text-slate-500">Bank Balance</p>
            <p className="text-lg font-semibold tabular-nums text-slate-900">{loading ? "…" : naira(balances.bank)}</p>
          </div>
        </div>

        <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {[
            { key: "capital", label: "Capital In/Out", icon: Wallet },
            { key: "transfer", label: "Cash ↔ Bank", icon: ArrowRightLeft },
            { key: "history", label: "Ledger History", icon: History },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg ${
                tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"
              }`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "capital" && (
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Record capital movement</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {[{ key: "in", label: "Capital In", icon: ArrowDown }, { key: "out", label: "Capital Out", icon: ArrowUp }].map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setCapitalForm({ ...capitalForm, direction: d.key })}
                    className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-medium ${
                      capitalForm.direction === d.key ? "border-blue-500 bg-blue-50 text-blue-600" : "text-slate-500"
                    }`}
                    style={{ borderColor: capitalForm.direction === d.key ? C.primary : C.border }}
                  >
                    <d.icon size={13} /> {d.label}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                  <input
                    type="number"
                    value={capitalForm.amount}
                    onChange={(e) => setCapitalForm({ ...capitalForm, amount: e.target.value })}
                    placeholder="1,000,000"
                    className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none"
                    style={{ borderColor: C.border }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-2">Channel</label>
                <div className="grid grid-cols-2 gap-2">
                  {[{ key: "cash", label: "Cash", icon: Banknote }, { key: "bank", label: "Bank", icon: Landmark }].map((m) => (
                    <button
                      key={m.key}
                      onClick={() => setCapitalForm({ ...capitalForm, channel: m.key })}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-[12px] font-medium ${
                        capitalForm.channel === m.key ? "border-blue-500 bg-blue-50 text-blue-600" : "text-slate-500"
                      }`}
                      style={{ borderColor: capitalForm.channel === m.key ? C.primary : C.border }}
                    >
                      <m.icon size={13} /> {m.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Note (optional)</label>
                <input
                  value={capitalForm.note}
                  onChange={(e) => setCapitalForm({ ...capitalForm, note: e.target.value })}
                  placeholder="e.g. Owner drawing"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                  style={{ borderColor: C.border }}
                />
              </div>
              <button onClick={addCapital} disabled={saving} className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white mt-1 disabled:opacity-50" style={{ backgroundColor: C.primary }}>
                <Plus size={15} /> {saving ? "Saving…" : "Record Entry"}
              </button>
            </div>
          </div>
        )}

        {tab === "transfer" && (
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Move money between Cash and Bank</h3>
            <p className="text-[11px] text-slate-400 mb-4">This nets to zero on your combined balance — it just moves which column it sits in.</p>
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-3">
                {[
                  { key: "cash_to_bank", from: "Cash", to: "Bank" },
                  { key: "bank_to_cash", from: "Bank", to: "Cash" },
                ].map((d) => (
                  <button
                    key={d.key}
                    onClick={() => setTransferForm({ ...transferForm, direction: d.key })}
                    className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl border py-3 text-[12.5px] font-medium ${
                      transferForm.direction === d.key ? "border-blue-500 bg-blue-50 text-blue-600" : "text-slate-500"
                    }`}
                    style={{ borderColor: transferForm.direction === d.key ? C.primary : C.border }}
                  >
                    {d.from} <ArrowRight size={12} /> {d.to}
                  </button>
                ))}
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Amount</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                  <input
                    type="number"
                    value={transferForm.amount}
                    onChange={(e) => setTransferForm({ ...transferForm, amount: e.target.value })}
                    placeholder="100,000"
                    className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none"
                    style={{ borderColor: C.border }}
                  />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium text-slate-500 block mb-1">Note (optional)</label>
                <input
                  value={transferForm.note}
                  onChange={(e) => setTransferForm({ ...transferForm, note: e.target.value })}
                  placeholder="e.g. Deposited at GTBank branch"
                  className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none"
                  style={{ borderColor: C.border }}
                />
              </div>
              <button onClick={addTransfer} disabled={saving} className="w-full flex items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold text-white mt-1 disabled:opacity-50" style={{ backgroundColor: C.primary }}>
                <ArrowRightLeft size={15} /> {saving ? "Saving…" : "Record Transfer"}
              </button>
            </div>
          </div>
        )}

        {tab === "history" && (
          <div>
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {["all", "capital", "transfer"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`text-[11px] font-medium px-2.5 py-1.5 rounded-full border capitalize ${
                    filter === f ? "bg-slate-900 text-white border-slate-900" : "text-slate-500"
                  }`}
                  style={{ borderColor: filter === f ? "#0F172A" : C.border }}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="space-y-2">
              {loading && <p className="text-xs text-slate-400 text-center py-10">Loading…</p>}
              {!loading && filtered.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-10">No entries yet.</p>
              )}
              {filtered.map((e) => {
                const isTransfer = e.type === "transfer";
                const meta = typeMeta[e.type];
                return (
                  <div key={e.id} className="flex items-center justify-between bg-white border rounded-xl px-4 py-3" style={{ borderColor: C.border }}>
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${meta.color}14` }}>
                        {isTransfer ? <ArrowRightLeft size={13} style={{ color: meta.color }} /> : e.direction === "in" ? <ArrowDown size={13} style={{ color: meta.color }} /> : <ArrowUp size={13} style={{ color: meta.color }} />}
                      </span>
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-slate-900 truncate">{e.note || meta.label}</p>
                        <p className="text-[11px] text-slate-400">
                          {meta.label} · {new Date(e.date).toISOString().slice(0, 10)} {!isTransfer && `· ${e.channel}`}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[13px] font-semibold tabular-nums shrink-0 ${isTransfer ? "text-slate-500" : e.direction === "in" ? "text-emerald-600" : "text-red-500"}`}>
                      {isTransfer ? naira(e.amount) : `${e.direction === "in" ? "+" : "−"}${naira(e.amount)}`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
