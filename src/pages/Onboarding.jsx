import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Store, ArrowRight, Check, AlertCircle } from "lucide-react";
import { api } from "../lib/api.js";

const C = { primary: "#2563EB", primaryDark: "#1D4ED8", success: "#22C55E", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const currencies = ["NGN — Nigerian Naira (₦)", "GHS — Ghanaian Cedi (₵)", "KES — Kenyan Shilling (KSh)", "USD — US Dollar ($)"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [business, setBusiness] = useState({ name: "", currency: currencies[0] });
  const [shop, setShop] = useState({ name: "", capital: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const steps = [
    { n: 1, label: "Business" },
    { n: 2, label: "First Shop" },
  ];

  const finish = async () => {
    if (!shop.name) return;
    setError("");
    setLoading(true);

    try {
      const { business_id, shop_id } = await api.post("/businesses", {
        businessName: business.name,
        shopName: shop.name,
      });

      const currencyCode = business.currency.slice(0, 3);
      await api.patch(`/businesses/${business_id}`, { currency: currencyCode });

      if (shop.capital) {
        await api.post("/capital", {
          shopId: shop_id,
          direction: "IN",
          amount: Number(shop.capital),
          channel: "CASH",
          note: "Opening capital",
        });
      }

      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setLoading(false);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center px-4 py-10" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 justify-center mb-6">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: C.primary }}>
            <span className="text-white text-xs font-bold">L</span>
          </div>
          <span className="font-semibold text-[15px] text-slate-900">LedgerOS</span>
        </div>

        <div className="flex items-center justify-center gap-2 mb-6">
          {steps.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold"
                style={{
                  backgroundColor: step >= s.n ? C.primary : "#E2E8F0",
                  color: step >= s.n ? "#fff" : "#94A3B8",
                }}
              >
                {step > s.n ? <Check size={13} /> : s.n}
              </div>
              <span className={`text-[11px] font-medium ${step >= s.n ? "text-slate-900" : "text-slate-400"}`}>{s.label}</span>
              {i < steps.length - 1 && <div className="w-8 h-px bg-slate-200 mx-1" />}
            </div>
          ))}
        </div>

        <div className="rounded-3xl bg-white border p-6" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04), 0 8px 24px rgba(15,23,42,0.05)" }}>
          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 mb-4">
              <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
              <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
            </div>
          )}
          {step === 1 && (
            <>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${C.primary}12` }}>
                <Building2 size={17} style={{ color: C.primary }} />
              </span>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">Name your business</h1>
              <p className="text-[13px] text-slate-400 mb-5">This is the umbrella over all your shops.</p>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Business name</label>
              <input
                value={business.name}
                onChange={(e) => setBusiness({ ...business, name: e.target.value })}
                placeholder="e.g. Chase Enterprise Ltd"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4"
                style={{ borderColor: C.border }}
              />
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Currency</label>
              <select
                value={business.currency}
                onChange={(e) => setBusiness({ ...business, currency: e.target.value })}
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-6 bg-white"
                style={{ borderColor: C.border }}
              >
                {currencies.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <button
                onClick={() => business.name && setStep(2)}
                disabled={!business.name}
                className="w-full flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                style={{ backgroundColor: C.primary }}
              >
                Continue <ArrowRight size={15} />
              </button>
            </>
          )}

          {step === 2 && (
            <>
              <span className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: `${C.primary}12` }}>
                <Store size={17} style={{ color: C.primary }} />
              </span>
              <h1 className="text-lg font-semibold text-slate-900 mb-1">Open your first shop</h1>
              <p className="text-[13px] text-slate-400 mb-5">
                Under <span className="font-medium text-slate-600">{business.name}</span> — you can add more shops anytime from Settings.
              </p>
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Shop name</label>
              <input
                value={shop.name}
                onChange={(e) => setShop({ ...shop, name: e.target.value })}
                placeholder="e.g. Chase Furniture"
                className="w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none mb-4"
                style={{ borderColor: C.border }}
              />
              <label className="text-[11px] font-medium text-slate-500 block mb-1">Opening capital</label>
              <div className="relative mb-6">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-slate-400">₦</span>
                <input
                  type="number"
                  value={shop.capital}
                  onChange={(e) => setShop({ ...shop, capital: e.target.value })}
                  placeholder="1,000,000"
                  className="w-full rounded-xl border pl-7 pr-3.5 py-2.5 text-sm outline-none"
                  style={{ borderColor: C.border }}
                />
              </div>
              <div className="flex gap-2">
                <button onClick={() => setStep(1)} className="rounded-xl py-3 px-4 text-sm font-medium text-slate-500 border" style={{ borderColor: C.border }}>
                  Back
                </button>
                <button
                  onClick={finish}
                  disabled={!shop.name || loading}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-40"
                  style={{ backgroundColor: C.primary }}
                >
                  {loading ? "Creating…" : <>Go to Dashboard <ArrowRight size={15} /></>}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
