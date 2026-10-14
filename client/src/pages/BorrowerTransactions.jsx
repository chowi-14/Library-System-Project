import { useState } from "react";
import {
  Ban, BookOpen, Banknote, Calendar, CalendarCheck, CheckCircle2,
  ChevronDown, History as HistoryIcon, Hourglass,
} from "lucide-react";
import Cover from "../components/Cover";
import { parse, fmtShort } from "../utils/dates";

const BURGUNDY = "#4a1a1f";
const RED = "#b91c1c";
const GREEN = "#0a7a46";
const AMBER = "#c97a2b";
const MUTED = "#6b7280";

const LOAN_DAYS = 14;
const FINE_PER_DAY = 5; // TODO: match the fine rule in your BorrowStore
const MS_DAY = 86_400_000;

const daysLeftOf = (due) => {
  const t = new Date();
  t.setHours(0, 0, 0, 0);
  return Math.round((parse(due) - t) / MS_DAY);
};
const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

const PAGE_SIZE = 15;

const pageNumbers = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const shown = [...new Set([1, total, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return shown.flatMap((p, i) => (i > 0 && p - shown[i - 1] > 1 ? ["…", p] : [p]));
};

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return <div />;

  const base = "min-w-9 rounded border px-3 py-1.5 text-sm";
  const idle = "border-gray-400 bg-white hover:bg-gray-100";

  return (
    <nav aria-label="Pagination" className="flex flex-wrap items-center justify-center gap-1.5">
      <button
        type="button"
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className={`${base} ${idle} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Prev
      </button>

      {pageNumbers(page, totalPages).map((p, i) =>
        p === "…" ? (
          <span key={`gap-${i}`} className="px-1 text-gray-500">…</span>
        ) : (
          <button
            key={p}
            type="button"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className={`${base} ${p === page ? "border-[#4a1a1f] bg-[#4a1a1f] font-bold text-white" : idle}`}
          >
            {p}
          </button>
        )
      )}

      <button
        type="button"
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className={`${base} ${idle} disabled:cursor-not-allowed disabled:opacity-40`}
      >
        Next
      </button>
    </nav>
  );
}

const FILTERS = [
  { key: "current", label: "Current", empty: "No current loans.", icon: BookOpen },
  { key: "pending", label: "Pending", empty: "No pending requests.", icon: Hourglass },
  { key: "overdue", label: "Overdue", empty: "No overdue books.", icon: CheckCircle2 },
  { key: "history", label: "History", empty: "No returned books yet.", icon: HistoryIcon },
];

const primaryBtn =
  "flex-1 rounded-xl bg-[#4a1a1f] py-3 text-sm font-bold text-white transition hover:brightness-125";

function TabButton({ label, count, selected, alert, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={selected}
      className={`flex shrink-0 items-center gap-2 border-b-2 px-3 pb-3 text-base font-bold transition ${
        selected
          ? "border-[#4a1a1f] text-[#4a1a1f]"
          : "border-transparent text-gray-500 hover:border-gray-400 hover:text-gray-800"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
          alert ? "bg-red-700 text-white" : selected ? "bg-[#4a1a1f] text-white" : "bg-gray-200 text-gray-600"
        }`}
      >
        {count}
      </span>
    </button>
  );
}

function EmptyState({ filter }) {
  const Icon = filter.icon;
  return (
    <div className="flex flex-col items-center gap-3 py-20 text-gray-600">
      <Icon size={48} color={BURGUNDY} />
      <p>{filter.empty}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value, color, bold }) {
  return (
    <div className="flex items-center gap-2.5 py-1">
      <Icon size={18} style={{ color: color ?? BURGUNDY }} />
      <span className="text-[13px] text-gray-500">{label}</span>
      <span
        className={`ml-auto text-sm ${bold ? "font-bold" : "font-semibold"}`}
        style={{ color: color ?? "#2b0f12" }}
      >
        {value}
      </span>
    </div>
  );
}

function CardShell({ className = "bg-white border-black/10", children }) {
  return <li className={`self-start rounded-[18px] border p-3.5 shadow-md ${className}`}>{children}</li>;
}

function StatusBadge({ label, color }) {
  return (
    <span
      className="rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide"
      style={{ color, backgroundColor: `${color}1f` }}
    >
      {label}
    </span>
  );
}

const MiniCover = ({ item }) => (
  <Cover title={item.title} src={item.cover} className="h-[92px] w-16 shrink-0 rounded-md shadow-md" />
);

function ExpandableCard({
  item, statusLabel, statusColor, cardClass, summary, summaryColor,
  progress, progressColor, details, actions,
}) {
  const [open, setOpen] = useState(false);
  return (
    <CardShell className={cardClass}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full gap-3.5 text-left"
      >
        <MiniCover item={item} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between">
            <StatusBadge label={statusLabel} color={statusColor} />
            <ChevronDown
              size={20}
              color={BURGUNDY}
              className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
            />
          </div>
          <h3 className="mt-2 line-clamp-2 text-base font-bold text-[#2b0f12]">{item.title}</h3>
          <p className="line-clamp-1 text-sm text-gray-500">{item.author}</p>
          {progress != null && (
            <div className="mt-2.5 h-1.5 overflow-hidden rounded bg-[#55161d]/10">
              <div
                className="h-full rounded"
                style={{ width: `${progress * 100}%`, backgroundColor: progressColor }}
              />
            </div>
          )}
          <p className="mt-2 text-xs font-semibold" style={{ color: summaryColor }}>{summary}</p>
        </div>
      </button>

      {open && (
        <div className="mt-3.5 border-t border-[#55161d]/15 pt-3">
          {details}
          <div className="mt-3 flex gap-3">{actions}</div>
        </div>
      )}
    </CardShell>
  );
}

function LoanCard({ item, onReturn, onView }) {
  const returned = Boolean(item.returned);
  const left = daysLeftOf(item.due);
  const overdue = !returned && left < 0;
  const fine = Math.max(0, -left) * FINE_PER_DAY;

  const [label, color] = returned
    ? ["RETURNED", MUTED]
    : overdue
    ? ["OVERDUE", RED]
    : ["BORROWED", GREEN];

  const summary = returned
    ? `Returned ${fmtShort(item.returned)}`
    : overdue
    ? `${plural(-left, "day")} overdue`
    : left === 0
    ? "Due today"
    : `${plural(left, "day")} remaining`;

  const progress = overdue ? 1 : Math.min(1, Math.max(0, (LOAN_DAYS - left) / LOAN_DAYS));

  const handleReturn = () => onReturn(item);

  return (
    <ExpandableCard
      item={item}
      statusLabel={label}
      statusColor={color}
      cardClass={overdue ? "bg-white border-red-700" : undefined}
      summary={summary}
      summaryColor={overdue ? RED : "#2b0f12"}
      progress={returned ? null : progress}
      progressColor={overdue ? RED : progress > 0.8 ? AMBER : GREEN}
      details={
        <>
          <InfoRow icon={CalendarCheck} label="Borrowed" value={fmtShort(item.borrowed)} />
          <InfoRow icon={Calendar} label="Due" value={fmtShort(item.due)} color={overdue ? RED : undefined} />
          {overdue && (
            <InfoRow icon={Banknote} label="Fine" value={`₱${fine.toFixed(2)}`} color={RED} bold />
          )}
        </>
      }
      actions={
        <>
          <button type="button" onClick={() => onView?.(item)} className={primaryBtn}>View Details</button>
          {!returned && (
            <button
              type="button"
              onClick={handleReturn}
              className="flex-1 rounded-xl bg-[#0a7a46] py-3 text-sm font-bold text-white transition hover:brightness-110"
            >
              Return
            </button>
          )}
        </>
      }
    />
  );
}

function RequestCard({ item, onView, onCancel }) {
  return (
    <CardShell>
      <div className="flex gap-3.5">
        <MiniCover item={item} />
        <div className="min-w-0 flex-1">
          <StatusBadge label="PENDING" color={AMBER} />
          <h3 className="mt-2 line-clamp-2 text-base font-bold text-[#2b0f12]">{item.title}</h3>
          <p className="line-clamp-1 text-sm text-gray-500">{item.author}</p>
          <p className="mt-2.5 text-xs font-semibold text-[#2b0f12]">Requested {fmtShort(item.requested)}</p>
          <p className="text-xs text-gray-500">Waiting for librarian approval</p>
        </div>
      </div>
      <div className="mt-3.5 flex gap-3">
        <button type="button" onClick={() => onView?.(item)} className={primaryBtn}>View Details</button>
        <button
          type="button"
          onClick={() => onCancel?.(item)}
          className="flex-1 rounded-xl bg-red-700 py-3 text-sm font-bold text-white transition hover:bg-red-800"
        >
          Cancel request
        </button>
      </div>
    </CardShell>
  );
}

function DeclinedCard({ item, onView }) {
  const declinedOn = item.decided ?? item.requested;
  return (
    <ExpandableCard
      item={item}
      statusLabel="DECLINED"
      statusColor={RED}
      cardClass="bg-[#ebebeb] border-red-700/35"
      summary={`Declined ${fmtShort(declinedOn)}`}
      summaryColor={RED}
      details={
        <>
          <InfoRow icon={Calendar} label="Requested" value={fmtShort(item.requested)} />
          <InfoRow icon={Ban} label="Declined" value={fmtShort(declinedOn)} color={RED} />
          <div className="mt-2 rounded-lg border border-red-700/30 bg-white p-3">
            <p className="text-[11px] font-bold uppercase tracking-wide text-red-700">Reason</p>
            <p className="mt-1 whitespace-pre-wrap text-sm text-[#2b0f12]">
              {item.declineReason || "No reason was given."}
            </p>
          </div>
        </>
      }
      actions={<button type="button" onClick={() => onView?.(item)} className={primaryBtn}>View Details</button>}
    />
  );
}

export default function BorrowerTransactions({
  borrowed = [],
  history = [],
  pending = [],
  declined = [],
  initialTab = "current",
  onReturn,
  onCancelRequest,
  onViewBook,
}) {
  const [tab, setTab] = useState(FILTERS.some((f) => f.key === initialTab) ? initialTab : "current");
  const [page, setPage] = useState(1);

  const current = borrowed.filter((b) => daysLeftOf(b.due) >= 0);
  const overdue = borrowed.filter((b) => daysLeftOf(b.due) < 0);

  const counts = {
    current: current.length,
    pending: pending.length,
    overdue: overdue.length,
    history: history.length + declined.length,
  };

  const SUMMARY_LABELS = {
    current: "borrowed",
    pending: "pending",
    overdue: "overdue",
    history: "in history",
  };
  const summary = `${counts[tab]} ${SUMMARY_LABELS[tab]}`;

  const loanCard = (b) => <LoanCard key={b.id} item={b} onReturn={onReturn} onView={onViewBook} />;

  // History = returned loans + declined requests, newest first
  const historyEntries = [
    ...history.map((h) => ({ date: h.returned, node: loanCard(h) })),
    ...declined.map((d) => ({
      date: d.decided ?? d.requested,
      node: <DeclinedCard key={`d${d.id}`} item={d} onView={onViewBook} />,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  const cards = {
    current: current.map(loanCard),
    overdue: overdue.map(loanCard),
    pending: pending.map((r) => (
      <RequestCard key={r.id} item={r} onView={onViewBook} onCancel={onCancelRequest} />
    )),
    history: historyEntries.map((e) => e.node),
  };

  const activeFilter = FILTERS.find((f) => f.key === tab);
  const list = cards[tab];
  const totalPages = Math.max(1, Math.ceil(list.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const items = list.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const changePage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

    return (
    <main className="w-full flex-1 px-[7%] py-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="text-3xl font-bold text-[#2b0f12]">My Books</h1>
        <p className="text-sm text-gray-500">{summary}</p>
      </div>

      <div className="mt-6 flex gap-6 overflow-x-auto border-b border-gray-300">
        {FILTERS.map((f) => (
          <TabButton
            key={f.key}
            label={f.label}
            count={counts[f.key]}
            selected={tab === f.key}
            alert={f.key === "overdue" && counts.overdue > 0}
            onClick={() => { setTab(f.key); setPage(1); }}
          />
        ))}
      </div>

      <section className="py-6">
        {list.length === 0 ? (
          <EmptyState filter={activeFilter} />
        ) : (
          <>
            <ul className="grid items-start gap-4 md:grid-cols-2 xl:grid-cols-3">{items}</ul>
            <div className="mt-8 grid items-center gap-4 sm:grid-cols-3">
              <p className="text-left text-sm text-gray-500">
                Showing {items.length} of {list.length}
              </p>
              <Pagination page={currentPage} totalPages={totalPages} onChange={changePage} />
            </div>
          </>
        )}
      </section>
    </main>
  );
}
