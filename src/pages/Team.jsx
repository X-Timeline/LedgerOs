import { useState } from "react";
import { UserCog, Plus, Copy, Check, X, Trash2, ShieldCheck } from "lucide-react";

const C = { primary: "#2563EB", success: "#22C55E", warning: "#F59E0B", bg: "#F8FAFC", border: "#E2E8F0" };

const shops = ["Chase Furniture", "Chase Gadget"];
const roles = ["Manager", "Cashier", "Accountant"];

const initialTeam = [
  { id: "u1", name: "Chase Okeke", role: "Owner", shop: "All Shops" },
  { id: "u2", name: "Chidi Nwosu", role: "Cashier", shop: "Chase Furniture" },
  { id: "u3", name: "Amaka Obi", role: "Manager", shop: "Chase Gadget" },
];

const initialInvites = [
  { id: "n1", shop: "Chase Furniture", role: "Cashier", link: "ledgeros.app/join/8f2a...", status: "pending" },
];

export default function Team() {
  const [team] = useState(initialTeam);
  const [invites, setInvites] = useState(initialInvites);
  const [showInvite, setShowInvite] = useState(false);
  const [form, setForm] = useState({ shop: shops[0], role: roles[0] });
  const [copiedId, setCopiedId] = useState(null);

  const createInvite = () => {
    const token = Math.random().toString(16).slice(2, 10);
    setInvites((prev) => [
      { id: "n" + Date.now(), shop: form.shop, role: form.role, link: `ledgeros.app/join/${token}...`, status: "pending" },
      ...prev,
    ]);
    setShowInvite(false);
  };

  const copyLink = (inv) => {
    navigator.clipboard?.writeText(`https://${inv.link}`).catch(() => {});
    setCopiedId(inv.id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const revokeInvite = (id) => setInvites((prev) => prev.filter((i) => i.id !== id));

  return (
    <div className="min-h-screen w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Team</h1>
            <p className="text-xs text-slate-400">Chase Enterprise Ltd</p>
          </div>
          <button onClick={() => setShowInvite(true)} className="flex items-center gap-1.5 text-xs font-semibold text-white rounded-xl px-3.5 py-2" style={{ backgroundColor: C.primary }}>
            <Plus size={14} /> Invite
          </button>
        </div>

        <h4 className="text-xs font-medium text-slate-500 mb-2">Members</h4>
        <div className="space-y-2 mb-6">
          {team.map((m) => (
            <div key={m.id} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: C.primary }}>
                  {m.name.split(" ").map((n) => n[0]).join("").slice(0, 2)}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-slate-900">{m.name}</p>
                  <p className="text-[11px] text-slate-400">{m.shop}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border rounded-full px-2.5 py-1" style={{ borderColor: C.border }}>
                {m.role === "Owner" && <ShieldCheck size={11} style={{ color: C.primary }} />}
                {m.role}
              </span>
            </div>
          ))}
        </div>

        <h4 className="text-xs font-medium text-slate-500 mb-2">Pending invites</h4>
        <div className="space-y-2">
          {invites.map((inv) => (
            <div key={inv.id} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <div>
                <p className="text-[13px] font-medium text-slate-900">{inv.role} · {inv.shop}</p>
                <p className="text-[11px] text-slate-400 font-mono">{inv.link}</p>
              </div>
              <div className="flex items-center gap-1.5">
                <button onClick={() => copyLink(inv)} className="p-2 rounded-lg hover:bg-slate-50" style={{ color: copiedId === inv.id ? C.success : "#64748B" }}>
                  {copiedId === inv.id ? <Check size={14} /> : <Copy size={14} />}
                </button>
                <button onClick={() => revokeInvite(inv.id)} className="p-2 rounded-lg text-slate-300 hover:text-red-500 hover:bg-slate-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {invites.length === 0 && <p className="text-xs text-slate-400 text-center py-6">No pending invites.</p>}
        </div>

        {showInvite && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-slate-900/40" onClick={() => setShowInvite(false)} />
            <div className="relative w-full max-w-sm bg-white rounded-3xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-slate-900">Invite a team member</h3>
                <button onClick={() => setShowInvite(false)}><X size={16} className="text-slate-400" /></button>
              </div>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Shop</label>
              <select value={form.shop} onChange={(e) => setForm({ ...form, shop: e.target.value })} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-3 bg-white" style={{ borderColor: C.border }}>
                {shops.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4 bg-white" style={{ borderColor: C.border }}>
                {roles.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
              <p className="text-[11px] text-slate-400 mb-4">A single-use link will be generated. Share it however you like — it can only be used once.</p>
              <button onClick={createInvite} className="w-full rounded-xl py-3 text-sm font-semibold text-white" style={{ backgroundColor: C.primary }}>
                Generate Invite Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
