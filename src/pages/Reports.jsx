import { useState, useEffect, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { BarChart3, TrendingUp, Scale, Clock, AlertTriangle, AlertCircle } from "lucide-react";
import { api } from "../lib/api.js";

const C = { primary: "#2563EB", success: "#22C55E", warning: "#F59E0B", danger: "#EF4444", bg: "#F8FAFC", border: "#E2E8F0" };
const naira = (n) => "₦" + Math.round(n).toLocaleString("en-NG");
const EPOCH = "1970-01-01T00:00:00Z";

function movingLabel(daysOld) {
  if (daysOld <= 14) return { key: "fast", label: "Fast-moving", color: C.success };
  if (daysOld <= 45) return { key: "normal", label: "Normal", color: C.primary };
  if (daysOld <= 75) return { key: "slow", label: "Slow-moving", color: C.warning };
  return { key: "dead", label: "Dead stock", color: C.danger };
}

export default function Reports() {
  const { selectedShop } = useOutletContext();
  const shopId = selectedShop?.id !== "all" ? selectedShop?.id : null;

  const [tab, setTab] = useState("trading");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [trading, setTrading] = useState(null);
  const [pnl, setPnl] = useState(null);
  const [balanceSheet, setBalanceSheet] = useState(null);
  const [aging, setAging] = useState([]);
  const [capitalNet, setCapitalNet] = useState(0);

  const refresh = useCallback(() => {
    if (!shopId) return;
    setLoading(true);
    const now = new Date().toISOString();
    Promise.all([
      api.get(`/reports/trading-account?shopId=${shopId}&start=${EPOCH}&end=${now}`),
      api.get(`/reports/profit-and-loss?shopId=${shopId}&start=${EPOCH}&end=${now}`),
      api.get(`/reports/balance-sheet?shopId=${shopId}&asOf=${now}`),
      api.get(`/reports/inventory-aging?shopId=${shopId}`),
      api.get(`/capital?shopId=${shopId}`),
    ])
      .then(([tradingData, pnlData, bsData, agingData, capitalData]) => {
        setLoading(false);
        setTrading(tradingData);
        setPnl(pnlData);
        setBalanceSheet(bsData);
        setAging(agingData || []);
        const net = (capitalData || []).reduce(
          (s, e) => s + (e.direction === "IN" ? Number(e.amount) : -Number(e.amount)),
          0
        );
        setCapitalNet(net);
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message);
      });
  }, [shopId]);

  useEffect(() => { refresh(); }, [refresh]);

  if (!shopId) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
        <p className="text-sm text-slate-400 text-center max-w-xs">
          Select a specific shop from the switcher above to view its reports — business-wide reports aren't wired yet.
        </p>
      </div>
    );
  }

  if (loading || !trading || !pnl || !balanceSheet) {
    return (
      <div className="w-full flex items-center justify-center py-24 px-4" style={{ fontFamily: "Inter, sans-serif" }}>
        {error ? (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl px-3.5 py-2.5 max-w-sm">
            <AlertCircle size={14} className="text-red-500 mt-0.5 shrink-0" />
            <p className="text-[12.5px] text-red-600 leading-relaxed">{error}</p>
          </div>
        ) : (
          <p className="text-sm text-slate-400">Loading…</p>
        )}
      </div>
    );
  }

  const reconciled = capitalNet + pnl.netProfit;

  return (
    <div className="w-full" style={{ backgroundColor: C.bg, fontFamily: "Inter, sans-serif" }}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
        <h1 className="text-lg font-semibold text-slate-900">Reports</h1>
        <p className="text-xs text-slate-400 mb-4">{selectedShop.name} · All time</p>

        <div className="flex gap-1 mb-5 bg-slate-100 rounded-xl p-1 w-fit flex-wrap">
          {[
            { key: "trading", label: "Trading Account", icon: TrendingUp },
            { key: "balance", label: "Balance Sheet", icon: Scale },
            { key: "aging", label: "Inventory Aging", icon: Clock },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg ${tab === t.key ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {tab === "trading" && (
          <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
            <h3 className="text-sm font-semibold text-slate-900 mb-4">Trading Account & P&L</h3>
            <div className="space-y-3">
              <Row label="Sales" value={trading.totalSales} />
              <Row label="Cost of Goods Sold" value={-trading.totalCOGS} negative />
              <Divider />
              <Row label="Gross Profit" value={trading.grossProfit} bold />
              <Row label="Expenses" value={-pnl.totalExpenses} negative />
              <Divider />
              <Row label="Net Profit" value={pnl.netProfit} bold big color={pnl.netProfit >= 0 ? C.success : C.danger} />
            </div>
          </div>
        )}

        {tab === "balance" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white border p-5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
              <h3 className="text-sm font-semibold text-slate-900 mb-1">Balance Sheet</h3>
              <p className="text-[11px] text-slate-400 mb-4">Snapshot as of today</p>

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-2">Assets</p>
              <div className="space-y-2 mb-4">
                <Row label="Cash on Hand" value={balanceSheet.cash} small />
                <Row label="Bank Balance" value={balanceSheet.bank} small />
                <Row label="Inventory (at cost)" value={balanceSheet.inventoryValue} small />
                <Row label="Owed by Customers" value={balanceSheet.customerDebtOwed} small />
              </div>
              <Divider />
              <Row label="Total Assets" value={balanceSheet.assets} bold />

              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mt-4 mb-2">Liabilities</p>
              <Row label="Owed to Suppliers" value={balanceSheet.liabilities} small />
              <Divider />
              <Row label="Total Liabilities" value={balanceSheet.liabilities} bold />

              <Divider />
              <Row label="Equity (Assets − Liabilities)" value={balanceSheet.equity} bold big color={C.primary} />
            </div>

            <div className="rounded-2xl bg-blue-50 border border-blue-100 p-4">
              <p className="text-[12px] text-blue-700 leading-relaxed">
                Reconciliation check: net capital contributed ({naira(capitalNet)}) + net profit
                ({naira(pnl.netProfit)}) = <span className="font-semibold">{naira(reconciled)}</span>.
                {" "}This should match Equity above{Math.abs(balanceSheet.equity - reconciled) < 1 ? " — it does." : `; currently off by ${naira(Math.abs(balanceSheet.equity - reconciled))}, worth checking for an unrecorded entry.`}
              </p>
            </div>
          </div>
        )}

        {tab === "aging" && (
          <div className="space-y-2">
            {aging.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-10">No stock on hand yet.</p>
            )}
            {aging.map((p) => {
              const meta = movingLabel(Number(p.days_old));
              return (
                <div key={p.product_id} className="flex items-center justify-between bg-white border rounded-2xl px-4 py-3.5" style={{ borderColor: C.border, boxShadow: "0 1px 2px rgba(15,23,42,0.04)" }}>
                  <div className="flex items-center gap-3">
                    {(meta.key === "slow" || meta.key === "dead") && <AlertTriangle size={15} style={{ color: meta.color }} />}
                    <div>
                      <p className="text-[13.5px] font-medium text-slate-900">{p.product_name}</p>
                      <p className="text-[11px] text-slate-400">{Math.round(p.days_old)} days since oldest unsold lot</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ color: meta.color, backgroundColor: `${meta.color}14` }}>
                    {meta.label}
                  </span>
                </div>
              );
            })}
            <p className="text-[11px] text-slate-400 text-center pt-2 px-4">
              Flags stock that's been sitting for a while — money tied up in something that isn't converting to cash.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, negative, bold, big, small, color }) {
  return (
    <div className="flex items-center justify-between">
      <span className={`${small ? "text-[12.5px]" : "text-[13px]"} ${bold ? "font-semibold text-slate-900" : "text-slate-600"}`}>{label}</span>
      <span
        className={`${big ? "text-base" : small ? "text-[12.5px]" : "text-[13px]"} font-semibold tabular-nums`}
        style={{ color: color || (negative ? C.danger : "#0F172A") }}
      >
        {negative ? `(${naira(Math.abs(value))})` : naira(value)}
      </span>
    </div>
  );
}

function Divider() {
  return <div className="h-px bg-slate-100 my-2" />;
}
