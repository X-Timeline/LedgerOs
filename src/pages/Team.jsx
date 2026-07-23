import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { UserCog, Copy, Check, ShieldCheck, AlertCircle, Info } from "lucide-react";
import { api } from "../lib/api.js";

const C = { primary: "#2563EB", success: "#22C55E", bg: "#F8FAFC", border: "#E2E8F0" };

export default function Team() {
  const { selectedShop } = useOutletContext();
  const shopId = selectedShop?.id !== "all" ? selectedShop?.id : null;

  const [members, setMembers] = useState([]);
  const [shopCode, setShopCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const refresh = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    Promise.all([
      api.get(`/shops/${shopId}/members`),
      api.get("/shops"), // shop_code isn't in the members list — pull it from the shop record
    ])
      .then(([membersData, shopsData]) => {
        setLoading(false);
        setMembers(membersData || []);
        const shop = (shopsData || []).find((s) => s.id === shopId);
        setShopCode(shop?.shop_code || null);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  const joinLink = shopCode ? `${window.location.origin}/join/${shopCode}` : "";

  const copyLink = () => {
    navigator.clipboard?.writeText(joinLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!shopId) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Select a specific shop from the switcher above — team membership is per shop.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-lg font-semibold text-slate-900">Team</h1>
        <p className="text-xs text-slate-400 mb-4">{selectedShop.name}</p>

        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
          </div>
        )}

        <div className="rounded-2xl bg-white border p-5 mb-6" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Invite to this shop</h3>
          <p className="text-[11px] text-slate-400 mb-3">
            Anyone with this link can join as <span className="font-medium">Cashier</span>. Higher roles aren't assignable via link yet — promote someone from here once they've joined.
          </p>
          {loading ? (
            <p className="text-xs text-slate-400">Loading…</p>
          ) : shopCode ? (
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[12px] bg-slate-50 border rounded-lg px-3 py-2.5 truncate" style={{ borderColor: C.border }}>{joinLink}</code>
              <button onClick={copyLink} className="p-2.5 rounded-lg hover:bg-slate-50 shrink-0" style={{ color: copied ? C.success : "#64748B" }}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">No join code found for this shop.</p>
          )}
        </div>

        <h4 className="text-xs font-medium text-slate-500 mb-2">Members</h4>
        <div className="space-y-2">
          {loading && <p className="text-xs text-slate-400 text-center py-6">Loading…</p>}
          {!loading && members.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-6">No one's joined this shop yet — share the link above.</p>
          )}
          {members.map((m) => (
            <div key={m.id} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <div className="flex items-center gap-3">
                <span className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold text-white" style={{ backgroundColor: C.primary }}>
                  {(m.profiles?.name || m.profiles?.email || "?").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <p className="text-[13.5px] font-semibold text-slate-900">{m.profiles?.name || m.profiles?.email}</p>
                  <p className="text-[11px] text-slate-400">{m.profiles?.email}</p>
                </div>
              </div>
              <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 border rounded-full px-2.5 py-1" style={{ borderColor: C.border }}>
                {m.role === "Owner" && <ShieldCheck size={11} style={{ color: C.primary }} />}
                {m.role}
              </span>
            </div>
          ))}
        </div>

        <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3 mt-6">
          <Info size={14} className="text-blue-500 mt-0.5 shrink-0" />
          <p className="text-[12px] text-blue-700 leading-relaxed">
            Per-person invite links with a locked-in role (Manager, Accountant, etc.) aren't built yet — this uses one shared code per shop that always assigns Cashier. Worth upgrading later for finer control.
          </p>
        </div>
      </div>
    </div>
  );
}
