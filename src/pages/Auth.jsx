import { useState, useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Building2, Store, AlertCircle, MailCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { supabase } from "../lib/supabaseClient.js";

const C = { primary: "#2563EB", primaryDark: "#1D4ED8", bg: "#F8FAFC", border: "#E2E8F0", danger: "#EF4444" };

const modeFromPath = (pathname) => {
  if (pathname.startsWith("/join/")) return "invite";
  if (pathname.startsWith("/signup")) return "signup";
  return "login";
};

export default function Auth() {
  const location = useLocation();
  const navigate = useNavigate();
  const { token } = useParams(); // the shop_code, when arriving via /join/:token
  const { signIn, signUp } = useAuth();

  const [mode, setMode] = useState(() => modeFromPath(location.pathname)); // login | signup | invite
  const [showPw, setShowPw] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checkEmail, setCheckEmail] = useState(false);

  useEffect(() => {
    setMode(modeFromPath(location.pathname));
    setError("");
  }, [location.pathname]);

  const isInvite = mode === "invite";
  const isSignup = mode === "signup" || isInvite;

  const submit = async () => {
    setError("");
    if (!form.email || !form.password || (isSignup && !form.name)) {
      setError("Please fill in every field.");
      return;
    }
    setLoading(true);

    if (mode === "login") {
      const { error } = await signIn(form.email, form.password);
      setLoading(false);
      if (error) return setError(error.message);
      navigate("/dashboard");
      return;
    }

    // signup or invite — both create an account first
    const { data, error: signUpError } = await signUp(form.email, form.password, form.name);
    if (signUpError) {
      setLoading(false);
      return setError(signUpError.message);
    }

    // If email confirmation is required, there's no session yet — the RPC
    // calls below need auth.uid(), so they can't run until the user confirms
    // and logs in. Show a clear message instead of silently failing.
    if (!data.session) {
      setLoading(false);
      setCheckEmail(true);
      return;
    }

    if (isInvite) {
      const { error: joinError } = await supabase.rpc("join_shop_with_code", { p_shop_code: token });
      setLoading(false);
      if (joinError) return setError(joinError.message);
      navigate("/dashboard");
      return;
    }

    setLoading(false);
    navigate("/onboarding");
  };

  if (checkEmail) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center px-4 py-10" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
        <div className="w-full max-w-sm rounded-3xl bg-white border p-6 text-center" style={{ borderColor: C.border }}>
          <MailCheck size={28} className="mx-auto mb-3" style={{ color: C.primary }} />
          <h1 className="text-base font-semibold text-slate-900 mb-1">Check your email</h1>
          <p className="text-[13px] text-slate-500 leading-relaxed">
            We sent a confirmation link to <span className="font-medium text-slate-700">{form.email}</span>.
            {isInvite
              ? " After confirming, log in and you'll need to enter the shop code again to finish joining."
              : " After confirming, log in to continue setting up your business."}
          </p>
          <button
            onClick={() => navigate("/login")}
            className="w-full mt-5 rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: C.primary }}
          >
            Go to Log In
          </button>
        </div>
      </div>
    );
  }

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
                Joining with shop code <span className="font-semibold">{token}</span>. Enter your details to create your account.
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
              ? "Just your details — your shop is already set"
              : "Start with your name, email, and a password"}
          </p>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
            </div>
          )}

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
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <button onClick={() => setShowPw((v) => !v)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <button
              onClick={submit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white mt-2 disabled:opacity-60"
              style={{ backgroundColor: C.primary }}
            >
              {loading ? "Please wait…" : (
                <>
                  {mode === "login" ? "Log In" : isInvite ? "Join Shop" : "Continue"} <ArrowRight size={15} />
                </>
              )}
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
                  onClick={() => navigate(mode === "login" ? "/signup" : "/login")}
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
              This shop code can be reused by teammates you share it with.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
