import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PlayCircle } from "lucide-react";

// ---------------------------------------------------------------
// Design direction: LedgerOS is a digital ledger — so the landing
// page IS a ledger: a bound cover on the left, an open ruled page
// on the right with a real worked example, tabbed index sections
// for each module (Purchases, Sales, Cash Book, Debtors, Reports),
// and a wax/ink-stamp call to action instead of a gradient pill
// button. No floating icon cards, no centered hero, no blue-gradient
// SaaS template.
// ---------------------------------------------------------------

const T = {
  cover: "#132A54",      // ledger cover, deep navy — same family as the app's primary blue
  coverDark: "#0A1730",  // shadow/spine side of the cover
  paper: "#F8F6F1",      // soft, barely-warm page — reads as "paper" without clashing with app white
  paperLine: "rgba(19,42,84,0.10)", // ruled line on the page, blue-tinted to match
  ink: "#0F172A",        // matches the app's C.dark exactly, ties typography straight to the rest of the app
  red: "#B42318",        // ledger red ink (debit)
  brass: "#2563EB",      // was a brass/gilt accent — now the app's actual primary blue
  brassLight: "#93C5FD", // light blue for text on dark backgrounds (tailwind blue-300)
};

const display = { fontFamily: "'Fraunces', serif" };
const body = { fontFamily: "'Source Serif 4', serif" };
const mono = { fontFamily: "'IBM Plex Mono', monospace" };

// A worked example straight out of the product's own accounting model —
// this doubles as the demo, instead of marketing copy.
const ledgerRows = [
  { date: "03 Jul", particulars: "Capital brought in", debit: "", credit: "1,000,000", balance: "1,000,000" },
  { date: "04 Jul", particulars: "Bought Golden Morn — 5 cartons", debit: "75,000", credit: "", balance: "925,000" },
  { date: "06 Jul", particulars: "Sold 2 cartons, cash", debit: "", credit: "40,000", balance: "965,000" },
  { date: "06 Jul", particulars: "Sold 1 carton, on credit — Mrs Adeyemi", debit: "", credit: "20,000*", balance: "985,000" },
];

const modules = [
  {
    tag: "I",
    label: "Purchases & Stock",
    body: "Every batch keeps its own cost. FIFO, LIFO, or weighted average — set per product, applied automatically on every sale.",
  },
  {
    tag: "II",
    label: "Sales (POS)",
    body: "Ring up a sale in seconds. Cash, transfer, or credit — profit is worked out the moment the sale is completed, never guessed.",
  },
  {
    tag: "III",
    label: "Cash Book",
    body: "Cash and bank are kept apart and reconciled continuously, down to the last transfer between them.",
  },
  {
    tag: "IV",
    label: "Debtors & Suppliers",
    body: "Know exactly who owes you, and who you owe, at any moment — not just at month end.",
  },
  {
    tag: "V",
    label: "Reports",
    body: "Trading account, profit & loss, balance sheet — read live from your books, never a stale export.",
  },
];

export default function Landing() {
  const navigate = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [activeModule, setActiveModule] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 60);
    return () => clearTimeout(t);
  }, []);

  return (
    <div style={{ backgroundColor: T.paper, fontFamily: "'Source Serif 4', serif" }} className="min-h-screen w-full">
      <style>{`
        @keyframes coverIn {
          from { opacity: 0; transform: translateX(-18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes pageIn {
          from { opacity: 0; transform: translateX(18px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes rowIn {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .stamp-btn { transition: transform 160ms ease, box-shadow 160ms ease; }
        .stamp-btn:hover { transform: rotate(-4deg) scale(1.04); }
        .stamp-btn:active { transform: rotate(-2deg) scale(0.97); }
        a:focus-visible, button:focus-visible {
          outline: 2px solid ${T.brass};
          outline-offset: 3px;
        }
        @media (prefers-reduced-motion: reduce) {
          .anim-cover, .anim-page, .anim-row { animation: none !important; opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* hidden SVG filter: gives the ink stamp a rough, non-vector edge */}
      <svg width="0" height="0" style={{ position: "absolute" }}>
        <filter id="stampRough">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" result="noise" />
          <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.5" />
        </filter>
      </svg>

      {/* =============== HERO: the open ledger book =============== */}
      <div className="relative w-full overflow-hidden" style={{ backgroundColor: T.coverDark }}>
        <div className="max-w-5xl mx-auto px-4 lg:px-6">
          {/* top wordmark, sits above the "book" like a shelf label */}
          <div className="flex items-center justify-between pt-6 pb-5">
            <span style={{ ...display, color: T.brassLight, letterSpacing: "0.02em" }} className="text-[15px] font-semibold">
              LedgerOS
            </span>
            <button
              onClick={() => navigate("/login")}
              style={{ ...body, color: T.brassLight }}
              className="text-[13px] underline decoration-dotted underline-offset-4 hover:text-white"
            >
              Sign in
            </button>
          </div>

          {/* the book itself: cover (left) + open page (right) + spine */}
          <div className="relative grid lg:grid-cols-[1fr_auto_1.15fr] rounded-t-lg overflow-hidden shadow-2xl">
            {/* left: cloth cover */}
            <div
              className={`relative px-7 py-10 lg:py-14 flex flex-col justify-center ${mounted ? "anim-cover" : "opacity-0"}`}
              style={{
                backgroundColor: T.cover,
                backgroundImage: `
                  repeating-linear-gradient(45deg, rgba(255,255,255,0.025) 0 2px, transparent 2px 5px),
                  repeating-linear-gradient(-45deg, rgba(0,0,0,0.03) 0 2px, transparent 2px 5px),
                  linear-gradient(160deg, rgba(255,255,255,0.06), transparent 40%)
                `,
                animation: mounted ? "coverIn 620ms cubic-bezier(.2,.7,.2,1) both" : "none",
              }}
            >
              <p style={{ ...mono, color: T.brassLight }} className="text-[10.5px] tracking-[0.22em] uppercase mb-4 opacity-80">
                Trade &amp; Household Accounts
              </p>
              <h1 style={{ ...display, color: "#F4EFDF" }} className="text-[2.1rem] lg:text-[2.6rem] leading-[1.06] font-semibold">
                The book that balances itself.
              </h1>
              <p style={{ ...body, color: "rgba(244,239,223,0.78)" }} className="mt-5 text-[15px] leading-relaxed max-w-sm">
                Log what you bought, log what you sold. LedgerOS keeps the cost, the cash,
                and the profit — correct, every time, without a calculator in sight.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-5">
                <button
                  onClick={() => navigate("/signup")}
                  className="stamp-btn relative flex items-center justify-center"
                  style={{
                    width: 156, height: 156,
                    border: `3px double ${T.brassLight}`,
                    borderRadius: "50%",
                    filter: "url(#stampRough)",
                    transform: "rotate(-6deg)",
                    background: "transparent",
                  }}
                >
                  <span style={{ ...display, color: T.brassLight }} className="text-[13px] font-semibold tracking-[0.12em] uppercase leading-tight text-center px-3">
                    Open an
                    <br />
                    Account
                  </span>
                </button>
                <button
                  onClick={() => navigate("/tutorial")}
                  style={{ ...body, color: T.brassLight }}
                  className="flex items-center gap-1.5 text-[13.5px] hover:text-white"
                >
                  <PlayCircle size={16} /> See a filled ledger
                </button>
              </div>
            </div>

            {/* spine / binding */}
            <div
              className="hidden lg:block relative w-6"
              style={{
                background: `linear-gradient(90deg, ${T.coverDark}, #0B1712 50%, ${T.coverDark})`,
              }}
            >
              <div
                className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-[2px]"
                style={{
                  backgroundImage: `repeating-linear-gradient(to bottom, ${T.brass} 0 4px, transparent 4px 11px)`,
                }}
              />
            </div>

            {/* right: open ruled page with the worked example */}
            <div
              className={`relative px-6 py-8 lg:py-12 lg:px-9 ${mounted ? "anim-page" : "opacity-0"}`}
              style={{
                backgroundColor: T.paper,
                backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 31px, ${T.paperLine} 31px 32px)`,
                animation: mounted ? "pageIn 620ms 120ms cubic-bezier(.2,.7,.2,1) both" : "none",
              }}
            >
              <p style={{ ...mono, color: T.red }} className="text-[10.5px] tracking-[0.18em] uppercase mb-3">
                Ledger No. 1 — Specimen Entry
              </p>

              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ color: T.ink }} className="text-left">
                    <th style={mono} className="text-[10px] uppercase tracking-wide font-medium pb-2 w-[52px]">Date</th>
                    <th style={mono} className="text-[10px] uppercase tracking-wide font-medium pb-2">Particulars</th>
                    <th style={mono} className="text-[10px] uppercase tracking-wide font-medium pb-2 text-right w-[70px]">Debit</th>
                    <th style={mono} className="text-[10px] uppercase tracking-wide font-medium pb-2 text-right w-[70px]">Credit</th>
                    <th style={mono} className="text-[10px] uppercase tracking-wide font-medium pb-2 text-right w-[78px]">Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerRows.map((r, i) => (
                    <tr
                      key={i}
                      className={mounted ? "anim-row" : "opacity-0"}
                      style={{ animation: mounted ? `rowIn 420ms ${260 + i * 120}ms both` : "none" }}
                    >
                      <td style={{ ...mono, color: T.ink }} className="text-[11.5px] py-2 align-top opacity-70">{r.date}</td>
                      <td style={{ ...body, color: T.ink }} className="text-[12.5px] py-2 align-top pr-2">{r.particulars}</td>
                      <td style={{ ...mono, color: T.red }} className="text-[12px] py-2 align-top text-right">{r.debit}</td>
                      <td style={{ ...mono, color: T.cover }} className="text-[12px] py-2 align-top text-right">{r.credit}</td>
                      <td style={{ ...mono, color: T.ink }} className="text-[12px] py-2 align-top text-right font-medium">{r.balance}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={5} style={{ borderTop: `1px solid ${T.ink}` }} className="pt-2">
                      <div className="flex items-baseline justify-between">
                        <span style={{ ...body, color: T.ink }} className="text-[11.5px] italic opacity-70">
                          * owed by customer, not yet received
                        </span>
                        <span style={{ ...mono, color: T.ink }} className="text-[12px] font-semibold">
                          Gross profit&nbsp;&nbsp;₦15,000
                        </span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* =============== MODULE INDEX (ledger tabs) =============== */}
      <div className="max-w-5xl mx-auto px-4 lg:px-6 py-16 lg:py-20">
        <p style={{ ...mono, color: T.red }} className="text-[10.5px] tracking-[0.2em] uppercase mb-2">
          Index
        </p>
        <h2 style={{ ...display, color: T.ink }} className="text-[1.6rem] font-semibold mb-8">
          Five sections. One set of books.
        </h2>

        <div className="grid lg:grid-cols-[240px_1fr] gap-0 border" style={{ borderColor: "rgba(28,58,46,0.25)" }}>
          {/* tab column */}
          <div className="flex lg:flex-col overflow-x-auto lg:overflow-visible">
            {modules.map((m, i) => (
              <button
                key={m.label}
                onClick={() => setActiveModule(i)}
                className="relative text-left px-4 py-3.5 shrink-0 lg:shrink border-b lg:border-b lg:last:border-b-0"
                style={{
                  borderColor: "rgba(28,58,46,0.18)",
                  backgroundColor: activeModule === i ? T.paper : "transparent",
                  borderLeft: activeModule === i ? `3px solid ${T.red}` : "3px solid transparent",
                }}
              >
                <span style={{ ...mono, color: T.red }} className="text-[10px] mr-2">{m.tag}</span>
                <span style={{ ...body, color: T.ink }} className="text-[13.5px] font-medium">{m.label}</span>
              </button>
            ))}
          </div>

          {/* open page for the active tab */}
          <div
            className="px-6 py-8 lg:px-10 lg:py-10"
            style={{
              backgroundColor: T.paper,
              backgroundImage: `repeating-linear-gradient(to bottom, transparent 0 30px, ${T.paperLine} 30px 31px)`,
            }}
          >
            <h3 style={{ ...display, color: T.ink }} className="text-[1.3rem] font-semibold mb-3">
              {modules[activeModule].label}
            </h3>
            <p style={{ ...body, color: T.ink }} className="text-[14.5px] leading-relaxed max-w-md opacity-85">
              {modules[activeModule].body}
            </p>
          </div>
        </div>
      </div>

      {/* =============== CLOSING =============== */}
      <div style={{ backgroundColor: T.cover }} className="w-full">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 py-16 lg:py-20 flex flex-col items-center text-center">
          <p style={{ ...mono, color: T.brassLight }} className="text-[11px] tracking-[0.2em] uppercase mb-3 opacity-80">
            Brought forward · Carried forward · Never lost
          </p>
          <h2 style={{ ...display, color: "#F4EFDF" }} className="text-[1.7rem] lg:text-[2rem] font-semibold max-w-lg leading-snug mb-8">
            Start the ledger your business already deserves.
          </h2>
          <button
            onClick={() => navigate("/signup")}
            className="stamp-btn relative flex items-center justify-center"
            style={{
              width: 148, height: 148,
              border: `3px double ${T.brassLight}`,
              borderRadius: "50%",
              filter: "url(#stampRough)",
              transform: "rotate(4deg)",
            }}
          >
            <span style={{ ...display, color: T.brassLight }} className="text-[12.5px] font-semibold tracking-[0.12em] uppercase leading-tight text-center px-3">
              Open an
              <br />
              Account
            </span>
          </button>
          <p style={{ ...body, color: "rgba(244,239,223,0.6)" }} className="text-[12px] mt-6">
            No card required · Tutorial uses sample data only
          </p>
        </div>
      </div>
    </div>
  );
}
