import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Building2, Store } from "lucide-react";

const C = { primary: "#2563EB", primaryDark: "#1D4ED8", bg: "#F8FAFC", border: "#E2E8F0" };

// Simulated invite context — in the real app this is decoded server-side from the /join/:token URL
const MOCK_INVITE = { shop: "Chase Furniture", role: "Cashier", invitedBy: "Chase Enterprise Ltd" };

export default function Auth() {
  const [mode, setMode] = useState("login"); // login | signup | invite
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });

  const isInvite = mode === "invite";
  const isSignup = mode === "signup" || isInvite;

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-8">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.primary }}>
            <span className="text-white text-xs font-bold">L</span>
          </div>
          <span className="font-semibold text-[15px] text-slate-900">LedgerOS</span>
        </div>

        <div className="rounded-3xl bg-white border p-6" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)" }}>
          {isInvite && (
            <div className="flex items-start gap-2.5 bg-blue-50 border border-blue-100 rounded-xl px-3.5 py-3 mb-5">
              <Store size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-blue-700 leading-relaxed">
                You're joining <span className="font-semibold">{MOCK_INVITE.shop}</span> as{" "}
                <span className="font-semibold">{MOCK_INVITE.role}</span>, invited by {MOCK_INVITE.invitedBy}.
              </p>
            </div>
          )}

          <h1 className="text-lg font-semibold text-slate-900 mb-1">
            {mode === "login" ? "Welcome back" : isInvite ? "Join your team" : "Create your business"}
          </h1>
          <p className="text-[13px] text-slate-400 mb-6">
            {mode === "login"
              ? "Log in to your LedgerOS account"
              : isInvite
              ? "Just your details — your shop and role are already set"
              : "Start with your name, email, and a password"}
          </p>

          <div className="space-y-3">
            {isSignup && (
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Full name"
                  className="w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-400"
                  style={{ borderColor: C.border }}
                />
              </div>
            )}
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                placeholder="Email address"
                className="w-full rounded-xl border pl-10 pr-3.5 py-2.5 text-sm outline-none focus:border-blue-400"
                style={{ borderColor: C.border }}
              />
            </div>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                placeholder="Password"
                className="w-full rounded-xl border pl-10 pr-10 py-2.5 text-sm outline-none focus:border-blue-400"
                style={{ borderColor: C.border }}
              />
              <button onClick={() => setShowPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <button
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white mt-2"
              style={{ backgroundColor: C.primary }}
            >
              {mode === "login" ? "Log In" : isInvite ? "Join Shop" : "Continue"} <ArrowRight size={15} />
            </button>
          </div>

          {!isInvite && (
            <>
              {mode === "signup" && (
                <div className="flex items-center gap-2 mt-5 text-[11px] text-slate-400">
                  <Building2 size={13} />
                  Next: name your business, then create your first shop
                </div>
              )}
              <div className="mt-5 pt-5 border-t text-center" style={{ borderColor: C.border }}>
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-[13px] text-slate-500"
                >
                  {mode === "login" ? (
                    <>No account? <span className="font-medium text-blue-600">Sign up</span></>
                  ) : (
                    <>Already have an account? <span className="font-medium text-blue-600">Log in</span></>
                  )}
                </button>
              </div>
            </>
          )}

          {isInvite && (
            <p className="mt-5 text-[11px] text-slate-400 text-center">
              This invite is single-use and tied to {MOCK_INVITE.shop}.
            </p>
          )}
        </div>

        {/* Preview-only toggle to demo all three states — not part of the real UI */}
        <div className="flex justify-center gap-2 mt-5">
          {["login", "signup", "invite"].map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`text-[11px] px-2.5 py-1 rounded-full border ${mode === m ? "bg-slate-900 text-white border-slate-900" : "text-slate-400"}`}
              style={{ borderColor: mode === m ? "#0F172A" : C.border }}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
