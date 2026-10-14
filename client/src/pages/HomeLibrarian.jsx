import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";
import crest from "../assets/crest.webp";
import { Html5Qrcode } from "html5-qrcode";
import {
  AreaChart, Area,
  BarChart, Bar,
  LineChart as RLineChart, Line,
  PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, Cell, ReferenceLine, LabelList,
} from "recharts";

const API = `${import.meta.env.VITE_API_URL ?? "http://localhost:5001/api"}/books`;
const BORROW_API = `${import.meta.env.VITE_API_URL ?? "http://localhost:5001/api"}/borrowings`;
const ROWS_PER_PAGE = 10;
const BASE = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";
const AUTH_API = `${BASE}/auth`;
// Keep these in sync with LibraryService
const LOAN_DAYS = 14;
const MAX_LOANS = 3;
const FINE_PER_DAY = 5;

const api = async (path = "", options = {}, base = API) => {
  const res = await fetch(`${base}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
  const text = await res.text();
  let data = null;
  try { data = JSON.parse(text); } catch { /* not JSON */ }
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status}): ${text.slice(0, 120)}`);
  return data;
};


const selectSm = "rounded-lg border border-[#4a1f1f]/25 bg-white px-3 py-2 text-[13px] focus:border-[#4a1f1f] focus:outline-none focus:ring-2 focus:ring-[#eea51c]/40";
const inputBase =
  "block w-full rounded-lg border bg-white px-3 py-2.5 text-[13px] font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#eea51c]/50";
const btnBase = "cursor-pointer rounded-lg px-4 py-2.5 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eea51c]/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary = `${btnBase} border border-[#eea51c] bg-[#eea51c] text-[#FFFFFF] shadow-sm hover:bg-[#d8940f]`;
const btnSecondary = `${btnBase} border border-[#4a1f1f]/25 bg-white text-[#4a1f1f] hover:bg-[#faf6f0]`;
const btnDanger = `${btnBase} border border-[#c0121f] bg-[#c0121f] text-white shadow-sm hover:bg-[#9c0e19]`;
const btnSmall = "cursor-pointer rounded-md border border-[#4a1f1f]/25 bg-white px-3.5 py-1.5 text-xs font-semibold text-[#4a1f1f] transition hover:bg-[#faf6f0] disabled:cursor-not-allowed disabled:opacity-50";

const btnApprove = `${btnBase} border border-[#0c7a43] bg-[#0c7a43] text-white shadow-sm hover:bg-[#09653a]`;
const btnDecline = `${btnBase} border border-[#c0121f]/30 bg-[#c0121f]/10 text-[#c0121f] hover:bg-[#c0121f]/20`;
const btnCompact = "cursor-pointer rounded-lg px-3 py-2 text-[13px] font-semibold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eea51c]/60 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
const btnImport = `${btnCompact} border border-[#0c7a43] bg-[#0c7a43] text-white shadow-sm hover:bg-[#09653a]`;
const btnAdd = `${btnCompact} border border-[#eea51c] bg-[#eea51c] text-[#FFFFFF] shadow-sm hover:bg-[#d8940f]`;
const btnReturn = "cursor-pointer rounded-md border border-[#0c7a43] bg-[#0c7a43] px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-[#09653a] disabled:cursor-not-allowed disabled:opacity-50";
const btnIssue = "cursor-pointer rounded-md border border-[#eea51c] bg-[#eea51c] px-3.5 py-1.5 text-xs font-semibold text-[#FFFFFF] transition hover:bg-[#d8940f] disabled:cursor-not-allowed disabled:opacity-50";
const btnBrowse = "cursor-pointer rounded-lg border border-[#eea51c] bg-[#eea51c] px-4 py-2 text-[13px] font-semibold text-[#FFFFFF] shadow-sm transition hover:bg-[#d8940f] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#eea51c]/60";

function SearchInput({ className = "", ...props }) {
  return (
    <div className={`relative ${className}`}>
      <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#4a1f1f]" />
      <input type="search" {...props} className={`${selectSm} w-full pl-9`} />
    </div>
  );
}

function SortableTable({ columns, rows, defaultSort, emptyText, resetKey, toolbar, filters }) {
  const [sort, setSort] = useState(defaultSort);
  const [page, setPage] = useState(1);
  const [lastKey, setLastKey] = useState(resetKey);

  if (resetKey !== lastKey) {
    setLastKey(resetKey);
    setPage(1);
  }

  const sortable = columns.filter((c) => c.sortable);

  const sorted = useMemo(() => {
    const list = [...rows];
    const { key, dir } = sort;
    list.sort((a, b) => {
      const x = a[key] ?? "";
      const y = b[key] ?? "";
      return String(x).localeCompare(String(y), undefined, { numeric: true, sensitivity: "base" }) * (dir === "asc" ? 1 : -1);
    });
    return list;
  }, [rows, sort]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / ROWS_PER_PAGE));
  const current = Math.min(page, totalPages);
  const start = (current - 1) * ROWS_PER_PAGE;
  const pageRows = sorted.slice(start, start + ROWS_PER_PAGE);

  const changeSort = (next) => {
    setSort(next);
    setPage(1);
  };

  const toggle = (key) =>
    changeSort(sort.key === key ? { key, dir: sort.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" });

  return (
    <>
      <div className={`mb-3 flex flex-wrap items-center gap-2 text-[13px] ${toolbar ? "justify-between" : "justify-end"}`}>
        <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2">
          Sort by
          <select className={selectSm} value={sort.key} onChange={(e) => changeSort({ ...sort, key: e.target.value })}>
            {sortable.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
        <select
          className={selectSm}
          aria-label="Sort order"
          value={sort.dir}
          onChange={(e) => changeSort({ ...sort, dir: e.target.value })}
        >
          <option value="asc">A to Z</option>
          <option value="desc">Z to A</option>
        </select>
        {filters}
        </div>
        {toolbar}
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#4a1f1f]/15 bg-white shadow-sm">
        <table className="w-full border-collapse text-[13px]">
          <thead className="bg-[#faf6f0]">
            <tr>
              {columns.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    className={`whitespace-nowrap border-b border-[#4a1f1f]/15 px-3 py-3 text-center text-xs font-semibold tracking-wide text-[#4a1f1f] ${c.plain ? "normal-case" : "uppercase"}`}
                    aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                  >
                    {c.sortable ? (
                      <button
                        className="inline-flex cursor-pointer items-center gap-1 border-0 bg-transparent font-semibold hover:text-[#0b4a8b] focus-visible:text-[#0b4a8b] focus-visible:outline-none"
                        onClick={() => toggle(c.key)}
                      >
                        {c.label}
                        <span className={`text-[10px] ${active ? "text-[#0b4a8b]" : "text-gray-500"}`}>
                          {active ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}
                        </span>
                      </button>
                    ) : (
                      c.label
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => (
              <tr key={row.id} className="border-b border-[#4a1f1f]/10 transition-colors last:border-b-0 hover:bg-[#faf6f0]">
                {columns.map((c) => (
                  <td key={c.key} className="px-2.5 py-3 text-center">{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="p-6 text-center text-gray-500">
                  {emptyText || "No results match your filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sorted.length > 0 && (
        <p className="mt-2 text-center text-xs text-gray-500">
          Showing {start + 1}–{start + pageRows.length} of {sorted.length}
        </p>
      )}
      <Pagination page={current} totalPages={totalPages} onChange={setPage} />
    </>
  );
}

const fmt = (iso) =>
  iso
    ? new Date(iso + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
    : "-";

const fmtWhen = (iso) =>
  new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

const fmtStamp = (v) => {
  if (!v) return "-";
  const s = String(v);
  if (!/T\d{2}:\d{2}/.test(s)) return fmt(s.slice(0, 10));
  return fmtWhen(s);
};

const EditIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 6h18" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

const Cover = ({ colors = ["#4a1f1f", "#eea51c"], image, size = "sm" }) => {
  const [failed, setFailed] = useState(false);
  const dims = size === "lg" ? "aspect-[2/3] w-[72px] shrink-0" : "aspect-[2/3] w-[34px] shrink-0";
  if (image && !failed) {
    return (
      <img
        className={`mx-auto block ${dims} rounded-[3px] object-cover ${size === "lg" ? "shadow-md ring-1 ring-black/10" : ""}`}
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className={`relative mx-auto ${dims} overflow-hidden rounded-[3px]`} style={{ background: colors[0] }}>
      <span
        className={`absolute rounded-sm ${size === "lg" ? "inset-x-3 bottom-5 h-2.5" : "inset-x-1.5 bottom-2 h-1.5"}`}
        style={{ background: colors[1] }}
      />
    </div>
  );
};

const Avatar = ({ src, name = "", className = "h-10 w-10" }) => {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return <img src={src} alt="" className={`${className} shrink-0 rounded-full object-cover`} onError={() => setFailed(true)} />;
  }
  return (
    <span className={`${className} flex shrink-0 items-center justify-center rounded-full bg-[#4a1f1f] font-bold text-white`}>
      {name.charAt(0).toUpperCase() || "?"}
    </span>
  );
};

const BADGE_COLORS = {
  overdue: "bg-[#c0121f]/10 text-[#c0121f] ring-[#c0121f]/30",
  available: "bg-[#0c7a43]/10 text-[#0c7a43] ring-[#0c7a43]/30",
  returned: "bg-[#0c7a43]/10 text-[#0c7a43] ring-[#0c7a43]/30",
  "not-returned": "bg-[#eea51c]/15 text-[#8a5a00] ring-[#eea51c]/40",
  borrowed: "bg-[#eea51c]/15 text-[#8a5a00] ring-[#eea51c]/40",
  "pending-return": "bg-[#eea51c]/15 text-[#8a5a00] ring-[#eea51c]/40",
};

const Badge = ({ status, overdue }) => {
  const kind = overdue ? "overdue" : status.toLowerCase().replace(" ", "-");
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${BADGE_COLORS[kind]}`}>
      {status}
    </span>
  );
};

const CATEGORIES = ["Fiction", "Non-Fiction", "Academic", "Restricted"];
const EMPTY_FORM = { title: "", author: "", isbn: "", publisher: "", category: "", subcategory: "", published: "", pages: "", description: "", image: "", copies: "1", shelf: "" };
const DESC_MAX = 300;
const todayISO = () => new Date().toISOString().slice(0, 10);

const resizeImage = (file, maxWidth = 240, quality = 0.7) =>
  new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Could not read this image."));
    };
    img.src = url;
  });

const validate = (f) => {
  const e = {};
  const title = f.title.trim();
  if (!title) e.title = "Book title is required.";
  else if (title.length < 2) e.title = "Title must be at least 2 characters.";
  else if (title.length > 100) e.title = "Title must be 100 characters or fewer.";

  const author = f.author.trim();
  if (!author) e.author = "Author name is required.";
  else if (!/^\p{L}[\p{L}\s.'-]*$/u.test(author)) e.author = "Use letters only.";
  else if (author.length > 60) e.author = "Keep it under 60 characters.";

  const publisher = f.publisher.trim();
  if (!publisher) e.publisher = "Publisher is required.";
  else if (publisher.length > 60) e.publisher = "Keep it under 60 characters.";

  if (!f.category) e.category = "Choose a category.";

  const sub = (f.subcategory || "").trim();
  if (sub.length > 40) e.subcategory = "Keep it under 40 characters.";
  else if (sub && !/^[\p{L}\p{N}\s&'-]+$/u.test(sub)) e.subcategory = "Use letters, numbers, spaces, & ' - only.";

  if (!f.published) e.published = "Pick a publish date.";
  else if (f.published > todayISO()) e.published = "Date can't be in the future.";

  const desc = f.description.trim();
  if (desc && desc.length < 10) e.description = "Write at least 10 characters, or leave it empty.";
  else if (desc.length > DESC_MAX) e.description = "Keep it under 300 characters.";

  const isbn = String(f.isbn || "").replace(/[\s-]/g, "");
  if (!isbn) e.isbn = "ISBN is required.";
  else if (!/^(\d{9}[\dXx]|\d{13})$/.test(isbn)) e.isbn = "Enter a valid ISBN (10 or 13 digits).";

  const pages = String(f.pages ?? "").trim();
  if (!pages) e.pages = "Number of pages is required.";
  else if (!/^\d+$/.test(pages) || +pages < 1 || +pages > 10000) e.pages = "Enter a whole number from 1 to 10000.";

  if (String(f.shelf || "").trim().length > 40) e.shelf = "Keep it under 40 characters.";

  if (!/^\d+$/.test(String(f.copies).trim()) || +f.copies < 1 || +f.copies > 99) e.copies = "Enter a whole number from 1 to 99.";

  const img = f.image.trim();
  if (img) {
    try {
      const u = new URL(img);
      if (!/^https?:$/.test(u.protocol)) throw new Error();
    } catch {
      e.image = "Enter a valid image link (https://...).";
    }
  }
  return e;
};

let modalLocks = 0;

function Modal({ title, subtitle, titleId, onClose, small, role = "dialog", describedBy, children }) {
  const timer = useRef(null);

  useEffect(() => {
    modalLocks++;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer.current);
      modalLocks--;
      if (modalLocks === 0) document.body.style.overflow = "";
    };
  }, []);

  const onScroll = (e) => {
    const el = e.currentTarget;
    el.classList.add("is-scrolling");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => el.classList.remove("is-scrolling"), 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ${small ? "max-w-[400px]" : "max-w-[460px]"}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border-0 bg-black/5 p-1.5 text-gray-700 transition hover:bg-black/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        <div className="shrink-0 border-b border-[#4a1f1f]/10 bg-[#faf6f0] px-6 pb-4 pt-6 pr-14">
          <h2 id={titleId} className="text-xl font-bold leading-tight text-[#4a1f1f]">{title}</h2>
          {subtitle && <p className="mt-1 text-[13px] text-gray-500">{subtitle}</p>}
        </div>
        <div className="hover-scroll min-h-0 flex-1 overflow-y-auto" onScroll={onScroll}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, error, counter, children }) {
  return (
    <div>
      <label className="block text-[13px] font-bold">
        {label}
        <div className="mt-1.5">{children}</div>
      </label>
      {(error || counter) && (
        <div className="mt-1 flex items-start justify-between gap-2">
          {error ? <span className="block text-[11.5px] font-normal text-[#c0121f]" role="alert">{error}</span> : <span />}
          {counter}
        </div>
      )}
    </div>
  );
}

function ModalFrame({ titleId, onClose, header, footer, children }) {
  const timer = useRef(null);

  useEffect(() => {
    modalLocks++;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(timer.current);
      modalLocks--;
      if (modalLocks === 0) document.body.style.overflow = "";
    };
  }, []);

  const onScroll = (e) => {
    const el = e.currentTarget;
    el.classList.add("is-scrolling");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => el.classList.remove("is-scrolling"), 800);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[90vh] w-full max-w-[520px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border-0 bg-black/5 p-1.5 text-gray-700 transition hover:bg-black/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
        {header}
        <div className="hover-scroll min-h-0 flex-1 overflow-y-auto" onScroll={onScroll}>
          {children}
        </div>
        {footer}
      </div>
    </div>
  );
}

const FormSection = ({ title, children }) => (
  <fieldset className="rounded-xl border border-[#4a1f1f]/20 p-4">
    <legend className="px-1.5 text-xs font-semibold uppercase tracking-wide text-[#4a1f1f]">{title}</legend>
    <div className="flex flex-col gap-3.5">{children}</div>
  </fieldset>
);

function SubcategoryPicker({ options, disabled, placeholder, ...inputProps }) {
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const value = inputProps.value || "";

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const term = value.trim().toLowerCase();
  const matches = options.filter((s) => s.toLowerCase().includes(term));
  const isNew = term !== "" && !options.some((s) => s.toLowerCase() === term);

  const choose = (s) => {
    inputProps.onChange({ target: { value: s } });
    setOpen(false);
  };

  return (
    <div ref={boxRef} className="relative">
      <input
        {...inputProps}
        type="text"
        maxLength={40}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        onFocus={() => setOpen(true)}
        onChange={(e) => { inputProps.onChange(e); setOpen(true); }}
      />
      {open && !disabled && (matches.length > 0 || isNew) && (
        <ul className="absolute left-0 right-0 z-20 mt-1 max-h-44 overflow-y-auto rounded-lg border border-[#4a1f1f]/20 bg-white py-1 shadow-lg">
          {matches.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                className="block w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-[13px] font-normal text-[#1b1b1b] hover:bg-[#faf6f0]"
              >
                {s}
              </button>
            </li>
          ))}
          {isNew && (
            <li className="border-t border-[#4a1f1f]/10">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(value.trim())}
                className="block w-full cursor-pointer border-0 bg-transparent px-3 py-2 text-left text-[13px] font-semibold text-[#8a5a00] hover:bg-[#faf6f0]"
              >
                + Add "{value.trim()}" as a new subcategory
              </button>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

function BookFormModal({ book, books = [], ask, onClose, onSave }) {
  const editing = !!book;
  const isData = !!book?.image && book.image.startsWith("data:");
  const [form, setForm] = useState(() =>
    book
      ? {
          title: book.title, author: book.author, publisher: book.publisher, category: book.category,
          subcategory: book.subcategory || "",
          published: book.published, description: book.description || "", image: isData ? "" : book.image || "",
          copies: String(book.copies ?? 1),
          isbn: book.isbn || "",
          pages: book.pages ? String(book.pages) : "",
          shelf: book.shelf || "",
        }
      : EMPTY_FORM
  );
  const [touched, setTouched] = useState({});
  const [upload, setUpload] = useState(isData ? { name: "Uploaded image", data: book.image } : null);
  const [fileError, setFileError] = useState("");
  const [imgOk, setImgOk] = useState(null);
  const [saving, setSaving] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const firstRef = useRef(null);
  const fileRef = useRef(null);
  const errors = validate(upload ? { ...form, image: "" } : form);
  const previewSrc = upload ? upload.data : form.image.trim() && !errors.image ? form.image.trim() : "";

  const pickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setFileError("Choose an image file (PNG, JPG or WEBP).");
    if (file.size > 5 * 1024 * 1024) return setFileError("Image must be 5 MB or smaller.");
    try {
      const data = await resizeImage(file);
      setUpload({ name: file.name, data });
      setFileError("");
    } catch (err) {
      setFileError(err.message);
    }
  };
  const clearUpload = () => { setUpload(null); setFileError(""); };

  useEffect(() => { firstRef.current?.focus(); }, []);
  useEffect(() => { setImgOk(null); }, [previewSrc]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const err = (k) => touched[k] && errors[k];
  const bind = (k) => ({
    value: form[k],
    onChange: (e) => setForm({ ...form, [k]: e.target.value }),
    onBlur: () => setTouched({ ...touched, [k]: true }),
    className: `${inputBase} ${err(k) ? "border-[#c0121f]" : "border-[#4a1f1f]/25 focus:border-[#4a1f1f]"} ${form[k] ? "text-[#1b1b1b]" : "text-gray-400"}`,
    "aria-invalid": !!err(k),
  });

  const submit = async (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, true])));
    if (Object.keys(errors).length) {
      setSubmitError(`Fix these fields: ${Object.keys(errors).join(", ")}.`);
      return;
    }
    ask(
      editing ? "Save Changes" : "Add Book",
      editing ? `Save changes to "${form.title.trim()}"?` : `Add "${form.title.trim()}" to the catalog?`,
      editing ? "Yes, save" : "Yes, add",
      save
    );
  };

  const save = async () => {
    setSaving(true);
    setSubmitError("");
    try {
      await onSave({
        title: form.title.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim(),
        category: form.category,
        subcategory: form.subcategory.trim(),
        published: form.published,
        description: form.description.trim(),
        image: upload ? upload.data : form.image.trim(),
        copies: Number(form.copies),
        isbn: form.isbn.replace(/[\s-]/g, "").toUpperCase(),
        pages: Number(form.pages),
        shelf: form.shelf.trim(),
      });
    } catch (err) {
      setSubmitError(err.message);
      setSaving(false);
    }
  };

  const full = form.description.length >= DESC_MAX;

  const original = useMemo(
    () =>
      book
        ? {
            title: book.title, author: book.author, publisher: book.publisher, category: book.category,
            subcategory: book.subcategory || "",
            published: book.published, description: book.description || "", image: isData ? "" : book.image || "",
            copies: String(book.copies ?? 1),
            isbn: book.isbn || "",
            pages: book.pages ? String(book.pages) : "",
            shelf: book.shelf || "",
          }
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const norm = (v) => String(v ?? "").trim();
  const changedFields = original
    ? Object.keys(original).filter((k) => norm(form[k]) !== norm(original[k]))
    : [];
  const imageChanged = original ? (upload ? upload.data : null) !== (isData ? book.image : null) : false;
  const hasChanges = !editing || changedFields.length > 0 || imageChanged;

    return (
    <ModalFrame
      titleId="book-form-title"
      onClose={onClose}
      header={
        <div className="flex items-center gap-4 border-b border-[#4a1f1f]/10 bg-[#faf6f0] px-6 pt-6 pb-5 pr-14">
          {previewSrc && imgOk !== false ? (
            <img
              className="h-[92px] w-[64px] shrink-0 rounded-md object-cover shadow-md ring-1 ring-black/10"
              src={previewSrc}
              alt="Cover preview"
              referrerPolicy="no-referrer"
              onLoad={() => setImgOk(true)}
              onError={() => setImgOk(false)}
            />
          ) : (
            <div className="relative h-[92px] w-[64px] shrink-0 overflow-hidden rounded-md bg-[#4a1f1f] shadow-md">
              <span className="absolute inset-x-2 bottom-4 h-2 rounded-sm bg-[#eea51c]" />
            </div>
          )}
          <div className="min-w-0">
            <h2 id="book-form-title" className="text-xl font-bold leading-tight text-[#4a1f1f]">
              {editing ? "Edit Book" : "Add Book"}
            </h2>
            <span className="mt-1 inline-block rounded-full bg-[#4a1f1f]/10 px-3 py-0.5 text-xs font-semibold text-[#4a1f1f]">
              {form.category || "No category yet"}
            </span>
            <p className="mt-1 truncate text-[13px] text-gray-500">
              {form.title.trim() || "Untitled book"}
              {form.author.trim() && ` · ${form.author.trim()}`}
            </p>
          </div>
        </div>
      }
      footer={
        <div className="flex shrink-0 flex-col gap-3 border-t border-[#4a1f1f]/10 bg-white px-6 py-4">
          {submitError && (
            <p className="rounded-lg bg-[#c0121f]/10 p-3 text-[12.5px] font-semibold text-[#c0121f]" role="alert">{submitError}</p>
          )}
          <div className="grid grid-cols-2 gap-4">
            <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
            <button
              type="submit"
              form="book-form"
              className={btnPrimary}
              disabled={saving || !hasChanges}
              title={!hasChanges ? "No changes to save" : undefined}
            >
              {saving ? "Saving..." : editing ? "Save changes" : "Add book"}
            </button>
          </div>
        </div>
      }
    >
      <form id="book-form" onSubmit={submit} noValidate className="flex flex-col gap-4 px-6 py-5 text-[13px]">
        <FormSection title="Book details">
          <Field label="Book Title" error={err("title")}>
            <input ref={firstRef} type="text" placeholder="Enter a Book Title" {...bind("title")} />
          </Field>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <Field label="Author Name" error={err("author")}>
              <input type="text" placeholder="Enter an Author Name" {...bind("author")} />
            </Field>
            <Field label="Publisher" error={err("publisher")}>
              <input type="text" placeholder="Enter a Publisher Name" {...bind("publisher")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Catalog information">
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <Field label="ISBN" error={err("isbn")}>
              <input type="text" placeholder="e.g. 978-0-547-92822-7" {...bind("isbn")} />
            </Field>
            <Field label="Number of Pages" error={err("pages")}>
              <input type="number" min="1" max="10000" placeholder="e.g. 310" {...bind("pages")} />
            </Field>
          </div>
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <Field label="Category" error={err("category")}>
              <select
                {...bind("category")}
                onChange={(e) => setForm({ ...form, category: e.target.value, subcategory: "" })}
              >
                <option value="" disabled>Choose a Category</option>
                {CATEGORIES.map((c) => <option key={c} className="text-[#1b1b1b]">{c}</option>)}
              </select>
            </Field>
            <Field label="Date Published" error={err("published")}>
              <input type="date" max={todayISO()} {...bind("published")} />
            </Field>
          </div>
          <Field label="Subcategory (optional)" error={err("subcategory")}>
            <SubcategoryPicker
              disabled={!form.category}
              placeholder={form.category ? "Pick one or type a new one" : "Choose a category first"}
              options={[...new Set(
                books
                  .filter((b) => b.category === form.category && b.subcategory)
                  .map((b) => b.subcategory)
              )].sort()}
              {...bind("subcategory")}
            />
          </Field>
        </FormSection>

        <FormSection title="Description">
          <Field
            label="Short summary (optional)"
            error={err("description")}
            counter={
              <span className={`ml-auto whitespace-nowrap text-[11.5px] ${full ? "font-bold text-[#c0121f]" : "font-normal text-gray-500"}`}>
                {form.description.length}/{DESC_MAX}
              </span>
            }
          >
            <textarea
              placeholder="Enter a short description..."
              maxLength={DESC_MAX}
              {...bind("description")}
              className={`${bind("description").className} min-h-[110px] resize-y`}
            />
          </Field>
        </FormSection>

        <FormSection title="Inventory">
          <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
            <Field label="Total Copies" error={err("copies")}>
              <input type="number" min="1" max="99" placeholder="e.g. 3" {...bind("copies")} />
            </Field>
            <Field label="Shelf / Location (optional)" error={err("shelf")}>
              <input type="text" maxLength={40} placeholder="e.g. Aisle 3, Shelf B" {...bind("shelf")} />
            </Field>
          </div>
        </FormSection>

        <FormSection title="Cover image">
          <Field label="Image link or upload" error={fileError || err("image")}>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Image Link"
                {...bind("image")}
                className={`${bind("image").className} min-w-0 flex-1`}
                value={upload ? upload.name : form.image}
                readOnly={!!upload}
              />
              {upload ? (
                <button type="button" className={btnSmall} onClick={clearUpload}>Remove</button>
              ) : (
                <button type="button" className={btnBrowse} onClick={() => fileRef.current?.click()}>Browse</button>
              )}
            </div>
          </Field>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
          {previewSrc && (
            <p className={`text-[11.5px] ${imgOk === false ? "text-[#c0121f]" : "text-[#0c7a43]"}`}>
              {imgOk === false
                ? "Couldn't load this image. Use a direct image link (ends in .jpg or .png), or browse a file."
                : imgOk ? "Image loaded. See the preview at the top." : "Loading preview..."}
            </p>
          )}
        </FormSection>
      </form>
    </ModalFrame>
  );
}

function ConfirmDeleteModal({ book, onCancel, onConfirm }) {
  const cancelRef = useRef(null);

  useEffect(() => { cancelRef.current?.focus(); }, []);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <Modal title="Delete Book" titleId="delete-title" describedBy="delete-desc" role="alertdialog" small onClose={onCancel}>
      <div className="px-6 pt-[22px] pb-[26px]">
        <p id="delete-desc" className="mb-[18px] text-sm leading-normal">
          Delete <strong>{book.title}</strong> from the catalog? This can't be undone.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" className={btnSecondary} ref={cancelRef} onClick={onCancel}>Cancel</button>
          <button type="button" className={btnDanger} onClick={onConfirm}>Delete</button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Helpers ----------
const normUser = (u) =>
  u && { ...u, phone: u.phone_number ?? u.phone ?? "", fullName: `${u.firstName ?? ""} ${u.lastName ?? ""}`.trim() };
const peso = (n) => `₱${Number(n || 0).toFixed(2)}`;
const greeting = () => { const h = new Date().getHours(); return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; };
const localISO = () => new Date().toISOString().slice(0, 10); // server dates are UTC days
const isToday = (iso) => !!iso && String(iso).slice(0, 10) === localISO();
const copiesLeft = (b) => b.copiesAvailable ?? (b.status === "Available" ? 1 : 0);
const isReturned = (t) => t.status === "Returned";
const loanTone = (count) =>
  count >= MAX_LOANS ? "bg-[#c0121f]" : count > MAX_LOANS / 2 ? "bg-[#eea51c]" : "bg-[#0c7a43]";
const TABS = [["overview", "Overview"], ["analytics", "Analytics"], ["books", "Books"], ["borrowers", "Borrowers"], ["requests", "Requests"]];
const TONES = { red: "#c0121f", amber: "#eea51c", maroon: "#4a1f1f", green: "#0c7a43" };

const eligibility = (student, book, transactions) => {
  const mine = transactions.filter((t) => t.borrowerEmail === student.email);
  const active = mine.filter((t) => !isReturned(t));
  if (active.some((t) => t.overdue)) return "This student has overdue books.";
  if (mine.some((t) => t.fine > 0 && !t.finePaid)) return "This student has unpaid fines.";
  if (active.length >= MAX_LOANS) return `Borrowing limit reached (${MAX_LOANS} books).`;
  if (book) {
    if (copiesLeft(book) < 1) return "No copies of this book are left.";
    if (active.some((t) => t.bookId === book.id)) return "This student already borrowed this book.";
  }
  return null;
};

const buildNotifications = (transactions, books, requests = []) => {
  const out = [];
  const now = Date.now();
  for (const t of transactions) {
    if (t.overdue) {
      out.push({ tone: "red", bookId: t.bookId, title: `Overdue: ${t.title}`, sub: `${t.borrower} · ${t.daysOverdue} ${t.daysOverdue === 1 ? "day" : "days"} late` });
    } else if (!isReturned(t) && t.due && (new Date(t.due + "T00:00:00") - now) / 86400000 < 2) {
      out.push({ tone: "amber", bookId: t.bookId, title: `Due soon: ${t.title}`, sub: `${t.borrower} · due ${fmt(t.due)}` });
    }
    if (isReturned(t) && t.fine > 0 && !t.finePaid) {
      out.push({ tone: "red", bookId: t.bookId, title: `Unpaid fine: ${peso(t.fine)}`, sub: `${t.borrower} · ${t.title}` });
    }
  }
  for (const r of requests) {
    out.push({ tone: "amber", bookId: r.bookId, title: `Borrow request: ${r.title}`, sub: `${r.borrower} is waiting for approval.` });
  }
  for (const t of transactions) {
    if (t.pendingReturn) {
      out.push({ tone: "amber", bookId: t.bookId, title: `Return request: ${t.title}`, sub: `${t.borrower} is waiting for return verification.` });
    }
  }
  for (const b of books) {
    if (copiesLeft(b) === 0) out.push({ tone: "maroon", bookId: b.id, title: `No copies left: ${b.title}`, sub: `All ${b.totalCopies ?? 1} copies are borrowed.` });
  }
  return out;
};

// ---------- CSV import ----------
const CSV_TEMPLATE = `title,author,isbn,publisher,category,published,copies,pages,description,image,subcategory,shelf
The Hobbit,J.R.R. Tolkien,9780547928227,Allen & Unwin,Fiction,09/21/1937,3,310,A hobbit goes on an unexpected adventure.,,Fantasy,Aisle 1
A Brief History of Time,Stephen Hawking,9780553380163,Bantam Books,Non-Fiction,04/01/1988,2,212,An introduction to cosmology for general readers.,https://example.com/cover.jpg,Cosmology,Aisle 4
`;
const REQUIRED_COLS = ["title", "author", "isbn", "publisher", "category", "published", "pages"];
const MAX_IMPORT_ROWS = 500;

const parseCsv = (input) => {
  const rows = [];
  let row = [], cell = "", q = false;
  const endRow = () => { row.push(cell); cell = ""; if (row.some((c) => c.trim())) rows.push(row); row = []; };
  for (let i = 0; i < input.length; i++) {
    const c = input[i];
    if (q) {
      if (c === '"') { if (input[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && input[i + 1] === "\n") i++; endRow(); }
    else cell += c;
  }
  endRow();
  return rows;
};

const cleanIsbn = (s) => String(s ?? "").replace(/[\s-]/g, "").toUpperCase();

// MM/DD/YYYY (or M/D/YYYY, also with dashes) -> YYYY-MM-DD, or "" if invalid
const toIsoDate = (s) => {
  const m = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/.exec(String(s ?? "").trim());
  if (!m) return "";
  const [, mo, d, y] = m;
  const iso = `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  const dt = new Date(iso + "T00:00:00Z");
  return dt.getUTCFullYear() === +y && dt.getUTCMonth() + 1 === +mo && dt.getUTCDate() === +d ? iso : "";
};
const keyOf = (t, a) => `${t.toLowerCase()}|${a.toLowerCase()}`;

const readImport = (text, existing, activeFor = () => 0) => {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length < 2) return { rows: [], error: "The file needs a header row and at least one book." };
  const head = {};
  table[0].forEach((h, i) => {
    let k = h.trim().toLowerCase().replace(/ /g, "");
    if (k === "totalcopies" || k === "numberofcopies") k = "copies";
    if (k === "imageurl" || k === "imagelink") k = "image";
    if (k === "datepublished") k = "published";
    if (k === "numberofpages") k = "pages";
    if (k === "shelf/location" || k === "location") k = "shelf";
    head[k] = i;
  });
  const missing = REQUIRED_COLS.filter((k) => !(k in head));
  if (missing.length) return { rows: [], error: `Missing column(s): ${missing.join(", ")}.` };

  const cell = (r, k) => (head[k] === undefined ? "" : (r[head[k]] ?? "").trim());

  const byIsbn = new Map();
  const byTitle = new Map();
  existing.forEach((b) => {
    const i = cleanIsbn(b.isbn);
    if (i) byIsbn.set(i, b);
    byTitle.set(keyOf(b.title, b.author), b);
  });
  const fileSeen = new Map(); // key -> row number

  const COMPARE = [
    ["title", "Title"], ["author", "Author"], ["isbn", "ISBN"], ["publisher", "Publisher"],
    ["category", "Category"], ["subcategory", "Subcategory"], ["published", "Published date"],
    ["pages", "Pages"], ["copies", "Copies"], ["description", "Description"],
    ["image", "Image"], ["shelf", "Shelf"],
  ];

  const rows = table.slice(1, MAX_IMPORT_ROWS + 1).map((r, i) => {
    const cat = CATEGORIES.find((c) => c.toLowerCase() === cell(r, "category").toLowerCase());
    const form = {
      title: cell(r, "title"), author: cell(r, "author"), publisher: cell(r, "publisher"),
      category: cat || "", subcategory: cell(r, "subcategory"), published: toIsoDate(cell(r, "published")), 
      description: cell(r, "description"), image: cell(r, "image"), copies: cell(r, "copies") || "1",
      isbn: cell(r, "isbn"), pages: cell(r, "pages"), shelf: cell(r, "shelf"),
    };
    const e = validate(form);
    if (!cat) e.category = `Category must be one of: ${CATEGORIES.join(", ")}.`;
    if (!form.published) e.published = "Use the date format MM/DD/YYYY (e.g. 09/21/1937).";
    const errors = Object.values(e);
    const row = { line: i + 2, label: form.title || "(no title)", form, errors, status: "invalid", match: null, changes: [], note: "" };
    if (errors.length) return row;

    const isbn = cleanIsbn(form.isbn);
    const tKey = keyOf(form.title, form.author);

    const prior = fileSeen.get(isbn) ?? fileSeen.get(tKey);
    if (prior) {
      row.status = "duplicate";
      row.note = `Same book as row ${prior} in this file.`;
      return row;
    }

    const byI = byIsbn.get(isbn);
    const byT = byTitle.get(tKey);
    if (byI && byT && byI.id !== byT.id) {
      errors.push("The ISBN matches one catalog book but the title and author match another.");
      return row;
    }
    const match = byI || byT;
    fileSeen.set(isbn, row.line);
    fileSeen.set(tKey, row.line);

    if (!match) {
      row.status = "new";
      form.isbn = isbn;
      return row;
    }

    // Existing book: blank optional cells keep the current value.
    const keep = (k) => (form[k] === "" ? String(match[k] ?? "") : form[k]);
    form.subcategory = keep("subcategory");
    form.description = keep("description");
    form.shelf = keep("shelf");
    form.image = keep("image");
    const oldCopies = match.copies ?? match.totalCopies ?? 1;
    if (!cell(r, "copies")) form.copies = String(oldCopies);
    form.isbn = isbn;

    if (Number(form.copies) < activeFor(match.id)) {
      errors.push(`${activeFor(match.id)} copies are currently borrowed. Total copies can't be lower than that.`);
      return row;
    }

    const oldVal = (k) =>
      k === "isbn" ? cleanIsbn(match.isbn) : k === "copies" ? oldCopies : match[k] ?? "";
    row.changes = COMPARE.filter(([k]) => String(form[k]).trim() !== String(oldVal(k)).trim()).map(([, label]) => label);
    row.match = match;
    if (row.changes.length) row.status = "update";
    else {
      row.status = "duplicate";
      row.note = "Already in the catalog with the same details.";
    }
    return row;
  });
  return { rows, error: table.length - 1 > MAX_IMPORT_ROWS ? `Only the first ${MAX_IMPORT_ROWS} rows were read.` : "" };
};

const IMPORT_STATUS = {
  new: { label: "New", color: "#0c7a43" },
  update: { label: "Update", color: "#0b4a8b" },
  duplicate: { label: "Duplicate", color: "#8a5a00" },
  invalid: { label: "Invalid", color: "#c0121f" },
};

function ImportModal({ books, activeFor, ask, onClose, onDone }) {
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [rows, setRows] = useState([]);
  const [view, setView] = useState("all");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  const of = (s) => rows.filter((r) => r.status === s);
  const fresh = of("new");
  const upd = of("update");
  const dups = of("duplicate");
  const invalid = of("invalid");
  const shown = (view === "all" ? rows : of(view));

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    const res = readImport(await file.text(), books, activeFor);
    setRows(res.rows);
    setFileError(res.error);
    setView("all");
  };
  const template = () => {
    const url = URL.createObjectURL(new Blob(["\uFEFF" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "books_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  const run = async () => {
    setBusy(true);
    let added = 0, updated = 0, failed = 0;
    for (const r of [...fresh, ...upd]) {
      const { copies, pages, ...rest } = r.form;
      const body = JSON.stringify({ ...rest, isbn: cleanIsbn(rest.isbn), copies: Number(copies), pages: Number(pages) });
      try {
        if (r.status === "update") { await api(`/${r.match.id}`, { method: "PUT", body }); updated++; }
        else { await api("", { method: "POST", body }); added++; }
      } catch { failed++; }
    }
    onDone(
      `Imported: ${added} added, ${updated} updated, ${dups.length} duplicates skipped, ${invalid.length} invalid skipped` +
      `${failed ? `, ${failed} failed` : ""}.`
    );
  };

  const detail = (r) =>
    r.status === "invalid" ? r.errors.join(" ")
    : r.status === "update" ? `Will change: ${r.changes.join(", ")}.`
    : r.status === "duplicate" ? r.note
    : "Will be added to the catalog.";
  const total = fresh.length + upd.length;

  return (
    <Modal title="Bulk Import" titleId="import-title" onClose={onClose}>
      <div className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px] text-[13px]">
        <p><strong>1.</strong> Download the template (.csv) and open it in Excel or Google Sheets.</p>
        <button type="button" className={btnSecondary} onClick={template}>Download template (.csv)</button>
        <p>
          <strong>2.</strong> One book per row. Keep the header row. Categories: {CATEGORIES.join(", ")}. Date format: MM/DD/YYYY.
          Max {MAX_IMPORT_ROWS} rows. A row that matches a catalog book by ISBN (or title + author) <strong>updates</strong> it;
          blank optional cells keep the current value. Identical rows are skipped as duplicates.
        </p>
        <p><strong>3.</strong> Upload your file.</p>
        <button type="button" className={`${btnSecondary} py-5`} onClick={() => fileRef.current?.click()}>
          {fileName || "Choose a .csv file"}
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={pick} />
        {fileError && <p className="font-semibold text-[#c0121f]" role="alert">{fileError}</p>}

        {rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(IMPORT_STATUS).map(([k, m]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setView(view === k ? "all" : k)}
                  className="cursor-pointer rounded-xl border p-3 text-left transition"
                  style={{
                    borderColor: m.color + "66",
                    background: m.color + "14",
                    opacity: view === "all" || view === k ? 1 : 0.45,
                  }}
                >
                  <strong className="block text-2xl" style={{ color: m.color }}>{of(k).length}</strong>
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">Select a box to filter the list.</p>

            <div className="max-h-56 overflow-y-auto rounded-lg border border-[#4a1f1f]/20">
              {shown.slice(0, 50).map((r) => {
                const m = IMPORT_STATUS[r.status];
                return (
                  <div key={r.line} className="border-b border-[#4a1f1f]/10 p-2.5 last:border-b-0">
                    <div className="flex items-center gap-2">
                      <span className="rounded-full px-2 py-0.5 text-[10.5px] font-bold text-white" style={{ background: m.color }}>{m.label}</span>
                      <span className="min-w-0 flex-1 truncate font-bold">Row {r.line} · {r.label}</span>
                    </div>
                    <div className="mt-1 text-xs text-gray-700">{detail(r)}</div>
                  </div>
                );
              })}
              {shown.length > 50 && <p className="p-2.5 text-xs text-gray-500">...and {shown.length - 50} more.</p>}
            </div>

            {invalid.length > 0 && <p className="text-xs font-semibold text-[#c0121f]">Fix the invalid rows and upload again to include them.</p>}

            <button
              type="button"
              className={btnPrimary}
              disabled={!total || busy}
              onClick={() =>
                ask(
                  "Import Books",
                  `Add ${fresh.length} new and update ${upd.length} existing ${upd.length === 1 ? "book" : "books"}? ${dups.length + invalid.length} rows will be skipped.`,
                  "Yes, import",
                  run
                )
              }
            >
              {busy ? "Importing..." : total ? `Import (${fresh.length} new, ${upd.length} updates)` : "Nothing to import"}
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------- Book info card (shared by Issue and Return) ----------
function BookInfoCard({ book }) {
  return (
    <div className="flex gap-3 rounded-xl border border-[#4a1f1f]/20 bg-[#faf6f0] p-3 text-[13px]">
      <div className="shrink-0"><Cover colors={book.cover} image={book.image} /></div>
      <div className="min-w-0 flex-1">
        <strong className="block">{book.title}</strong>
        <span className="block text-gray-600">by {book.author}</span>
        <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {[
            ["Category", `${book.category}${book.subcategory ? ` · ${book.subcategory}` : ""}`],
            ["Publisher", book.publisher],
            ["ISBN", book.isbn],
            ["Pages", book.pages],
            ["Shelf / Location", book.shelf],
            ["Available", `${copiesLeft(book)} of ${book.totalCopies ?? 1}`],
          ]
            .filter(([, value]) => value !== "" && value != null)
            .map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-gray-500">{label}</dt>
                <dd className="break-words font-semibold">{value}</dd>
              </div>
            ))}
        </dl>
        {book.description && <p className="mt-2 text-xs leading-relaxed text-gray-700">{book.description}</p>}
      </div>
    </div>
  );
}

// ---------- Custom book dropdown ----------
function BookPicker({ books, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef(null);
  const selected = books.find((b) => String(b.id) === String(value));
  const year = (b) => (b.published ? String(b.published).slice(0, 4) : "");

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const term = q.trim().toLowerCase();
  const list = books.filter(
    (b) => !term || [b.title, b.author, b.publisher].some((f) => (f || "").toLowerCase().includes(term))
  );

  const pick = (b) => {
    onChange(String(b.id));
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={boxRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[#4a1f1f]/25 bg-white px-3 py-2 text-left text-[13px] focus:border-[#4a1f1f] focus:outline-none focus:ring-2 focus:ring-[#eea51c]/50"
      >
        {selected ? (
          <>
            <div className="shrink-0"><Cover colors={selected.cover} image={selected.image} /></div>
            <span className="min-w-0 flex-1">
              <strong className="block truncate">{selected.title}</strong>
              <span className="block truncate text-xs text-gray-600">by {selected.author}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 py-1.5 text-gray-400">Choose a book</span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 text-[#4a1f1f] transition ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[#4a1f1f]/20 bg-white shadow-sm">
          <div className="border-b border-[#4a1f1f]/10 p-2">
            <SearchInput
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by title, author, or publisher"
            />
          </div>
          <ul role="listbox" className="hover-scroll max-h-64 overflow-y-auto">
            {list.length === 0 && <li className="p-4 text-center text-xs text-gray-500">No books match.</li>}
            {list.map((b) => {
              const left = copiesLeft(b);
              const active = String(b.id) === String(value);
              return (
                <li key={b.id} className="border-b border-[#4a1f1f]/10 last:border-b-0">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(b)}
                    className={`flex w-full cursor-pointer items-center gap-3 border-0 px-3 py-2.5 text-left transition hover:bg-[#faf6f0] ${active ? "bg-[#faf6f0]" : "bg-transparent"} ${left < 1 ? "opacity-70" : ""}`}
                  >
                    <div className="shrink-0"><Cover colors={b.cover} image={b.image} /></div>
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px]">{b.title}</strong>
                      <span className="block truncate text-xs text-gray-600">by {b.author}</span>
                      <span className="block truncate text-xs text-gray-500">
                        {[b.publisher, year(b)].filter(Boolean).join(" · ")}
                      </span>
                    </span>
                    <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${left > 0 ? BADGE_COLORS.available : BADGE_COLORS.overdue}`}>
                      {left > 0 ? `${left} left` : "No copies"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Custom student dropdown ----------
function StudentPicker({ students, transactions, value, onChange }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const boxRef = useRef(null);
  const selected = students.find((s) => s.email === value);

  const activeCount = (s) => transactions.filter((t) => t.borrowerEmail === s.email && !isReturned(t)).length;
  const hasOverdue = (s) => transactions.some((t) => t.borrowerEmail === s.email && !isReturned(t) && t.overdue);
  const detail = (s) =>
    s.role === "professor"
      ? s.department
      : [s.course, s.yearLevel].filter(Boolean).join(" · ");

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!boxRef.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const term = q.trim().toLowerCase();
  const list = students.filter(
    (s) =>
      !term ||
      [s.fullName, s.email, s.phone, s.idNumber].some((f) => String(f || "").toLowerCase().includes(term))
  );

  const pick = (s) => {
    onChange(s.email);
    setOpen(false);
    setQ("");
  };

  return (
    <div ref={boxRef}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center gap-3 rounded-lg border border-[#4a1f1f]/25 bg-white px-3 py-2 text-left text-[13px] focus:border-[#4a1f1f] focus:outline-none focus:ring-2 focus:ring-[#eea51c]/50"
      >
        {selected ? (
          <>
            <Avatar src={selected.avatar} name={selected.fullName} className="h-9 w-9" />
            <span className="min-w-0 flex-1">
              <strong className="block truncate">{selected.fullName}</strong>
              <span className="block truncate text-xs text-gray-600">{selected.email}</span>
            </span>
          </>
        ) : (
          <span className="flex-1 py-1.5 text-gray-400">Choose a student</span>
        )}
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 text-[#4a1f1f] transition ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 overflow-hidden rounded-xl border border-[#4a1f1f]/20 bg-white shadow-sm">
          <div className="border-b border-[#4a1f1f]/10 p-2">
            <SearchInput
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by name, email, phone, or ID"
            />
          </div>
          <ul role="listbox" className="hover-scroll max-h-64 overflow-y-auto">
            {list.length === 0 && <li className="p-4 text-center text-xs text-gray-500">No students found.</li>}
            {list.map((s) => {
              const count = activeCount(s);
              const active = s.email === value;
              return (
                <li key={s.email} className="border-b border-[#4a1f1f]/10 last:border-b-0">
                  <button
                    type="button"
                    role="option"
                    aria-selected={active}
                    onClick={() => pick(s)}
                    className={`flex w-full cursor-pointer items-center gap-3 border-0 px-3 py-2.5 text-left transition hover:bg-[#faf6f0] ${active ? "bg-[#faf6f0]" : "bg-transparent"}`}
                  >
                    <Avatar src={s.avatar} name={s.fullName} className="h-10 w-10" />
                    <span className="min-w-0 flex-1">
                      <strong className="block truncate text-[13px]">{s.fullName}</strong>
                      <span className="block truncate text-xs text-gray-600">{s.email}</span>
                      {detail(s) && <span className="block truncate text-xs text-gray-500">{detail(s)}</span>}
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      <span className={`rounded-full ${loanTone(count)} px-2.5 py-[3px] text-[11px] font-bold text-white`}>
                        {count}/{MAX_LOANS} books
                      </span>
                      {hasOverdue(s) && (
                        <span className="rounded-full bg-[#c0121f] px-2.5 py-[3px] text-[11px] font-bold text-white">Overdue</span>
                      )}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ---------- Issue book ----------
function IssueModal({ students, books, transactions, initial, onClose, onIssue }) {
  const [email, setEmail] = useState(initial?.student?.email || "");
  const [bookId, setBookId] = useState(initial?.book?.id != null ? String(initial.book.id) : "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const student = students.find((s) => s.email === email);
  const book = books.find((b) => String(b.id) === bookId);
  const problem = student && book ? eligibility(student, book, transactions) : null;
  const ready = student && book && !problem;
  const due = new Date(Date.now() + LOAN_DAYS * 86400000).toISOString().slice(0, 10);
  const activeCount = student ? transactions.filter((t) => t.borrowerEmail === student.email && !isReturned(t)).length : 0;

  const confirm = async () => {
    setBusy(true);
    setError("");
    try { await onIssue(book, student); } catch (e) { setError(e.message); setBusy(false); }
  };

  return (
    <Modal title="Issue Book" titleId="issue-title" onClose={onClose}>
      <div className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px]">
        <div>
          <span className="block text-[13px] font-bold">Student</span>
          <div className="mt-1.5">
            <StudentPicker students={students} transactions={transactions} value={email} onChange={setEmail} />
          </div>
        </div>
        <div>
          <span className="block text-[13px] font-bold">Book</span>
          <div className="mt-1.5">
            <BookPicker books={books} value={bookId} onChange={setBookId} />
          </div>
        </div>
        {book && (
          <div className="flex gap-3 rounded-xl border border-[#4a1f1f]/20 bg-[#faf6f0] p-3 text-[13px]">
            <div className="shrink-0"><Cover colors={book.cover} image={book.image} /></div>
            <div className="min-w-0 flex-1">
              <strong className="block">{book.title}</strong>
              <span className="block text-gray-600">by {book.author}</span>
              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
                {[
                  ["Category", `${book.category}${book.subcategory ? ` · ${book.subcategory}` : ""}`],
                  ["Publisher", book.publisher],
                  ["ISBN", book.isbn],
                  ["Pages", book.pages],
                  ["Shelf / Location", book.shelf],
                  ["Available", `${copiesLeft(book)} of ${book.totalCopies ?? 1}`],
                ]
                  .filter(([, value]) => value !== "" && value != null)
                  .map(([label, value]) => (
                    <div key={label} className="min-w-0">
                      <dt className="text-gray-500">{label}</dt>
                      <dd className="break-words font-semibold">{value}</dd>
                    </div>
                  ))}
              </dl>
              {book.description && <p className="mt-2 text-xs leading-relaxed text-gray-700">{book.description}</p>}
            </div>
          </div>
        )}
        {student && <p className="text-[13px] font-semibold">Borrowing limit: {activeCount}/{MAX_LOANS} books</p>}
        {problem && <p className="text-[13px] font-semibold text-[#c0121f]">{problem}</p>}
        {ready && (
          <p className="text-[13px] font-semibold text-[#0c7a43]">
            Eligible. Due date will be {fmt(due)} ({LOAN_DAYS} days). Late fine: ₱{FINE_PER_DAY}/day.
          </p>
        )}
        {error && <p className="text-[12.5px] font-semibold text-[#c0121f]" role="alert">{error}</p>}
        <button type="button" className={btnPrimary} disabled={!ready || busy} onClick={confirm}>
          {busy ? "Issuing..." : "Confirm borrow"}
        </button>
      </div>
    </Modal>
  );
}

// ---------- Transaction row actions ----------
const TxActions = ({ t, onReturn, onPayFine }) => (
  <span className="inline-flex gap-2">
    {!isReturned(t) && <button className={btnReturn} onClick={() => onReturn(t)}>Mark returned</button>}
    {isReturned(t) && t.fine > 0 && !t.finePaid && <button className={`${btnSmall} py-1.5`} onClick={() => onPayFine(t)}>Mark fine paid</button>}
  </span>
);

// ---------- Collapsible borrowing record ----------
function RecordCard({ t, book, onReturn, onPayFine }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border ${t.overdue ? "border-[#c0121f]/60" : "border-[#2b2b2b]/30"}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent p-3 text-left"
      >
        <div className="shrink-0"><Cover colors={book?.cover} image={book?.image} /></div>
        <div className="min-w-0 flex-1">
          <strong className="block truncate">{t.title}</strong>
          <span className="block text-xs text-gray-500">Borrowed {fmtStamp(t.borrowedAt ?? t.borrowedOn)}</span>
        </div>
        <Badge status={t.status} overdue={t.overdue} />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`shrink-0 text-[#4a1f1f] transition ${open ? "rotate-180" : ""}`}>
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-[#4a1f1f]/10 px-3 pb-3 pt-2.5 text-xs">
          <dl className="grid grid-cols-1 gap-y-1.5">
            <div>
              <dt className="text-gray-500">Borrowed</dt>
              <dd className="font-semibold">{fmtStamp(t.borrowedAt ?? t.borrowedOn)}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Due</dt>
              <dd className="font-semibold">{fmtStamp(t.dueAt ?? t.due)}</dd>
            </div>
            {isReturned(t) && (
              <div>
                <dt className="text-gray-500">Returned</dt>
                <dd className="font-semibold">{fmtStamp(t.returnedAt ?? t.returned)}</dd>
              </div>
            )}
          </dl>
          {t.fine > 0 && (
            <div className={`mt-2 text-[13px] font-bold ${t.finePaid ? "text-[#0c7a43]" : "text-[#c0121f]"}`}>
              Fine: {peso(t.fine)} ({t.daysOverdue} {t.daysOverdue === 1 ? "day" : "days"} late){t.finePaid ? " · PAID" : ""}
            </div>
          )}
          <div className="mt-2 text-right"><TxActions t={t} onReturn={onReturn} onPayFine={onPayFine} /></div>
        </div>
      )}
    </div>
  );
}

// ---------- Student detail ----------
function StudentModal({ student, transactions, books = [], onClose, onIssue, onReturn, onPayFine }) {
  const [page, setPage] = useState(1);
  const records = transactions.filter((t) => t.borrowerEmail === student.email);
  const active = records.filter((t) => !isReturned(t));
  const problem = eligibility(student, null, transactions);
  const fines = records.filter((t) => t.fine > 0 && !t.finePaid).reduce((s, t) => s + t.fine, 0);
  const size = 5;
  const pages = Math.max(1, Math.ceil(records.length / size));
  const cur = Math.min(page, pages);
  const shown = records.slice((cur - 1) * size, cur * size);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="student-title"
        className="relative w-full max-w-[430px] overflow-hidden rounded-2xl bg-white shadow-2xl"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 cursor-pointer rounded-full border-0 bg-black/5 p-1.5 text-gray-700 transition hover:bg-black/10"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="max-h-[90vh] overflow-y-auto">
      <div className="flex flex-col gap-3 px-6 pt-6 pb-[26px] text-[13px]">
        <div className="flex items-center gap-4 pr-9">
          <Avatar src={student.avatar} name={student.fullName} className="h-20 w-20 text-3xl" />
          <div className="min-w-0">
            <h2 id="student-title" className="break-words text-xl font-bold leading-tight text-[#4a1f1f]">{student.fullName}</h2>
            <span className="mt-1 inline-block rounded-full bg-[#4a1f1f]/10 px-3 py-0.5 text-xs font-semibold capitalize text-[#4a1f1f]">{student.role}</span>
            <p className="mt-1 break-words text-gray-500">{student.email}</p>
          </div>
        </div>
        <div className="rounded-xl border border-[#4a1f1f]/20">
          {[
            ["ID number", student.idNumber],
            ["Phone number", student.phone],
            ...(student.role === "professor"
              ? [["Department", student.department]]
              : [["Course", student.course], ["Year level", student.yearLevel]]),
          ].map(([label, value]) => (
            <div key={label} className="border-b border-[#4a1f1f]/10 px-4 py-2.5 last:border-b-0">
              <div className="text-xs text-gray-500">{label}</div>
              <div className="font-semibold">{value || "-"}</div>
            </div>
          ))}
        </div>
        <div className={`rounded-lg p-3 font-semibold ${problem ? "bg-[#c0121f]/10 text-[#c0121f]" : "bg-[#0c7a43]/10 text-[#0c7a43]"}`}>
          {problem || "Eligible to borrow"}
        </div>
        <p className="font-semibold">
          Borrowing limit:{" "}
          <span className={`rounded-full ${loanTone(active.length)} px-2.5 py-[3px] text-[11px] font-bold text-white`}>
            {active.length}/{MAX_LOANS} books
          </span>
        </p>
        {fines > 0 && <p className="font-bold text-[#c0121f]">Outstanding fines: {peso(fines)}</p>}
        <button type="button" className={btnPrimary} onClick={() => onIssue(student)}>+ Issue a book</button>

        <h3 className="mt-2 text-base font-bold">Borrowing records</h3>
        {records.length === 0 ? (
          <p className="text-gray-500">No borrowing records yet.</p>
        ) : (
          <>
            {shown.map((t) => (
              <RecordCard
                key={t.id}
                t={t}
                book={books.find((b) => b.id === t.bookId)}
                onReturn={onReturn}
                onPayFine={onPayFine}
              />
            ))}
            <Pagination page={cur} totalPages={pages} onChange={setPage} />
          </>
        )}
        </div>
        </div>
      </div>
    </div>
  );
}

// ---------- Notifications ----------
function NotificationsModal({ notes, books, times, onClear, onClose }) {
  const [page, setPage] = useState(1);
  const size = 6;
  const pages = Math.max(1, Math.ceil(notes.length / size));
  const cur = Math.min(page, pages);
  return (
    <Modal title="Notifications" titleId="notes-title" onClose={onClose}>
      <div className="flex flex-col gap-3 px-6 pt-[22px] pb-[26px] text-[13px]">
        <div className="flex items-center justify-between gap-3">
          <p className="text-gray-500">
            {notes.length === 0 ? "Nothing needs your attention." : `${notes.length} ${notes.length === 1 ? "notification" : "notifications"}`}
          </p>
          {notes.length > 0 && (
            <button type="button" className={btnSmall} onClick={onClear}>Clear all</button>
          )}
        </div>
        {notes.length === 0 && <p className="rounded-xl bg-[#faf6f0] p-4 font-semibold text-[#0c7a43]">You're all caught up.</p>}
        {notes.slice((cur - 1) * size, cur * size).map((n) => {
          const book = books.find((b) => b.id === n.bookId);
          const when = times[`${n.title}|${n.sub}`];
          return (
            <div key={`${n.title}|${n.sub}`} className="flex items-start gap-3 rounded-xl border border-[#2b2b2b]/20 p-3">
              <div className="shrink-0"><Cover colors={book?.cover} image={book?.image} /></div>
              <div className="min-w-0 flex-1">
                <div className="font-bold">{n.title}</div>
                <div className="text-gray-600">{n.sub}</div>
                {when && <div className="mt-1 text-xs text-gray-400">{fmtWhen(when)}</div>}
              </div>
            </div>
          );
        })}
        {notes.length > size && <Pagination page={cur} totalPages={pages} onChange={setPage} />}
      </div>
    </Modal>
  );
}

// ---------- Overview ----------
const sectionTitle = "mb-4 text-lg font-bold tracking-tight text-[#4a1f1f]";

const AXIS_TICK = { fill: "#6B7280", fontSize: 11, fontFamily: "inherit" };
const AXIS_TICK_SM = { fill: "#9CA3AF", fontSize: 10, fontFamily: "inherit" };
const GRID_PROPS = { stroke: "#F3F4F6", strokeDasharray: "4 4", vertical: false };

function ChartTooltip({ active, payload, label, suffix = "", unit = "" }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.10)", minWidth: 130 }}>
      <p style={{ margin: "0 0 6px", fontWeight: 700, color: "#111827", fontSize: 12 }}>{label ?? row.label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: "2px 0", color: p.color || "#4a1f1f", fontSize: 11 }}>
          {p.name === "value" ? (
            <>
              <strong>{p.value}{suffix}</strong> {unit}
              {row.sub && <span style={{ color: "#9CA3AF", marginLeft: 6 }}>{row.sub}</span>}
            </>
          ) : (
            <>{p.name}: <strong>{p.value}</strong></>
          )}
        </p>
      ))}
    </div>
  );
}

function LineChart({ gid, labels, series, height = 240, showAvg = false, showLegend = true }) {
  const data = labels.map((label, i) => {
    const row = { label };
    series.forEach((s) => { row[s.name] = s.values[i]; });
    return row;
  });
  const first = series[0];
  const avg = showAvg && first && first.values.length ? first.values.reduce((a, b) => a + b, 0) / first.values.length : null;

  return (
    <ResponsiveContainer debounce={200} width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 12, right: 8, left: -20, bottom: 0 }}>
        <defs>
          {series.map((s, k) => (
            <linearGradient key={s.name} id={`${gid}-${k}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color} stopOpacity={0.12} />
              <stop offset="100%" stopColor={s.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" tick={AXIS_TICK_SM} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={AXIS_TICK_SM} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }} />
        {showLegend && series.length > 1 && (
          <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, color: "#6B7280", paddingTop: 8 }} />
        )}
        {avg !== null && (
          <ReferenceLine
            y={avg} stroke="#7C3AED" strokeDasharray="5 4" strokeWidth={1.5}
            label={{ value: "avg", fill: "#7C3AED", fontSize: 10, position: "insideTopRight" }}
          />
        )}
        {series.map((s, k) => (
          <Area
            key={s.name} type="monotone" dataKey={s.name} name={s.name}
            stroke={s.color} strokeWidth={2.5} fill={`url(#${gid}-${k})`} dot={false}
            activeDot={{ r: 5, fill: s.color, stroke: "#fff", strokeWidth: 2 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

function BorrowChart({ transactions, requests = [] }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const iso = new Date(Date.now() - (6 - i) * 86400000).toISOString().slice(0, 10);
    return {
      iso,
      label: new Date(iso + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
      borrowed: transactions.filter((t) => t.borrowedOn === iso).length,
      returned: transactions.filter((t) => t.returned === iso).length,
      pending: requests.filter((r) => String(r.requestedOn).slice(0, 10) === iso).length,
      overdue: transactions.filter((t) => String(t.due).slice(0, 10) === iso && (t.overdue || t.fine > 0)).length,
    };
  });
  const totalB = days.reduce((s, d) => s + d.borrowed, 0);
  const totalR = days.reduce((s, d) => s + d.returned, 0);
  const totalP = days.reduce((s, d) => s + d.pending, 0);
  const totalO = days.reduce((s, d) => s + d.overdue, 0);
  const rangeLabel = `${new Date(days[0].iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(days[6].iso + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
  const todayLabel = new Date().toLocaleString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

  const Stat = ({ color, label, value }) => (
    <div className="rounded-xl border-2 bg-white px-4 py-2" style={{ borderColor: color }}>
      <div className="text-xs font-semibold" style={{ color }}>{label}</div>
      <strong className="text-2xl tabular-nums text-[#1b1b1b]">{value}</strong>
    </div>
  );

  return (
    <div className="rounded-2xl border border-[#4a1f1f]/15 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <Stat color="#433429" label="Borrowed" value={totalB} />
          <Stat color="#0c7a43" label="Returned" value={totalR} />
          <Stat color="#eab308" label="Pending" value={totalP} />
          <Stat color="#c0121f" label="Overdue" value={totalO} />
        </div>
        <span className="rounded-full bg-[#faf6f0] px-3 py-1 text-xs font-semibold text-[#4a1f1f]">Last 7 days</span>
      </div>
      <LineChart
        gid="week"
        labels={days.map((d) => d.label)}
        showLegend={false}
        series={[
          { name: "Borrowed", color: "#433429", values: days.map((d) => d.borrowed) },
          { name: "Returned", color: "#0c7a43", values: days.map((d) => d.returned) },
          { name: "Pending", color: "#eab308", values: days.map((d) => d.pending) },
          { name: "Overdue", color: "#c0121f", values: days.map((d) => d.overdue) },
        ]}
      />
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#4a1f1f]/10 pt-3 text-xs text-gray-500">
        <span>Showing: <strong className="text-[#4a1f1f]">{rangeLabel}</strong></span>
        <span>Today: <strong className="text-[#4a1f1f]">{todayLabel}</strong></span>
      </div>
    </div>
  );
}

function Overview({ books, transactions, requests, onAction, onStat }) {
  const active = transactions.filter((t) => !isReturned(t));
  const overdue = active.filter((t) => t.overdue).sort((a, b) => b.daysOverdue - a.daysOverdue);
  const dueToday = active.filter((t) => isToday(t.due)).length;
  const pendingReturns = active.filter((t) => t.pendingReturn).length;

  const stats = [
    ["Total Book Copies", books.reduce((s, b) => s + (b.totalCopies ?? 1), 0), "bg-[#e4f1ee]"],
    ["Available Copies", books.reduce((s, b) => s + copiesLeft(b), 0), "bg-[#ffd6a5]"],
    ["Currently Borrowed", active.length, "bg-[#dedaf4]"],
    ["Overdue Books", overdue.length, "bg-[#ffadad]"],
    ["Pending Requests", requests.length, "bg-[#fff1c2]"],
    ["Due Today", dueToday, "bg-[#d7ecff]"],
  ];

  const actions = [
    ["issue", "Borrowing", "Issue a book to a student", "M4 19.5A2.5 2.5 0 0 1 6.5 17H20M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2zM12 7v6M9 10h6"],
    ["returns", "Returns", "Mark books as returned", "M9 14 4 9l5-5M20 20v-7a4 4 0 0 0-4-4H4"],
    ["catalog", "Catalog", "Add and manage books", "M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"],
    ["history", "History", "View all transactions", "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20zM12 6v6l4 2"],
  ];

  return (
    <>
      <h2 className={sectionTitle}>Quick Actions</h2>
      <div className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {actions.map(([k, label, sub, icon]) => (
          <button
            key={k}
            onClick={() => onAction(k)}
            className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-[#4a1f1f]/15 bg-[#faf6f0] p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-[#eea51c] hover:shadow-md"
          >
            <span className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-[#4a1f1f] text-[#eea51c] transition group-hover:bg-[#eea51c] group-hover:text-[#4a1f1f]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d={icon} />
              </svg>
              {k === "returns" && pendingReturns > 0 && (
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c0121f] px-1 text-[11px] font-bold text-white ring-2 ring-white">
                  {pendingReturns}
                </span>
              )}
            </span>
            <span className="min-w-0 flex-1">
              <strong className="block text-sm text-[#4a1f1f]">{label}</strong>
              <span className="block truncate text-xs text-gray-600">{sub}</span>
            </span>
            <span className="text-xl leading-none text-[#4a1f1f]/40 transition group-hover:translate-x-0.5 group-hover:text-[#4a1f1f]" aria-hidden="true">›</span>
          </button>
        ))}
      </div>

      <h2 className={sectionTitle}>Library at a Glance</h2>
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map(([label, value, bg]) => (
          <button key={label} onClick={() => onStat(label)} className={`flex cursor-pointer flex-col gap-1 rounded-2xl border border-black/5 px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${bg}`}>
            <span className="text-xs font-semibold uppercase tracking-wide text-[#1b1b1b]/70">{label}</span>
            <strong className="text-3xl font-bold tabular-nums">{value}</strong>
          </button>
        ))}
      </section>

      <div className="mb-4 flex items-end justify-between">
        <h2 className="text-lg font-bold tracking-tight text-[#4a1f1f]">Borrowing Activity</h2>
        <button onClick={() => onAction("analytics")} className="cursor-pointer border-0 bg-transparent text-xs font-bold text-[#0b4a8b] hover:underline">View analytics</button>
      </div>
      <div className="mb-8"><BorrowChart transactions={transactions} requests={requests} /></div>

      <div className="mb-8 grid gap-8 md:grid-cols-2">
        <section>
          <div className="mb-3 flex items-end justify-between border-b border-[#eea51c]/60 pb-1">
            <h2 className="text-lg font-bold tracking-tight text-[#4a1f1f]">Pending Requests</h2>
            {requests.length > 0 && (
              <button onClick={() => onAction("requests")} className="cursor-pointer border-0 bg-transparent text-xs font-bold text-[#0b4a8b] hover:underline">View all</button>
            )}
          </div>
          {requests.length === 0 ? (
            <p className="rounded-xl bg-[#faf6f0] p-4 text-sm font-semibold text-[#0c7a43]">No requests waiting for approval.</p>
          ) : (
            <div className="rounded-xl border border-[#4a1f1f]/20">
              {requests.slice(0, 4).map((r) => (
                <div key={r.id} className="flex items-center gap-3 border-b border-[#4a1f1f]/10 px-4 py-3 last:border-b-0">
                  <div className="shrink-0"><Cover colors={r.cover} image={books.find((b) => b.id === r.bookId)?.image} /></div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{r.title}</div>
                    <div className="truncate text-xs text-gray-600">{r.borrower} · {fmt(r.requestedOn)}</div>
                  </div>
                  <button className={`${btnSmall} py-1.5`} onClick={() => onAction("requests")}>Review</button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-3 flex items-end justify-between border-b border-[#eea51c]/60 pb-1">
            <h2 className="text-lg font-bold tracking-tight text-[#4a1f1f]">Overdue Books</h2>
            {overdue.length > 0 && (
              <button onClick={() => onAction("overdue")} className="cursor-pointer border-0 bg-transparent text-xs font-bold text-[#0b4a8b] hover:underline">View all</button>
            )}
          </div>
          {overdue.length === 0 ? (
            <p className="rounded-xl bg-[#faf6f0] p-4 text-sm font-semibold text-[#0c7a43]">Nothing is overdue.</p>
          ) : (
            <div className="rounded-xl border border-[#4a1f1f]/20">
              {overdue.slice(0, 4).map((t) => (
                <div key={t.id} className="flex items-center gap-3 border-b border-[#4a1f1f]/10 px-4 py-3 last:border-b-0">
                  <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: TONES.red }} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-bold">{t.title}</div>
                    <div className="truncate text-xs text-gray-600">{t.borrower} · {t.daysOverdue} {t.daysOverdue === 1 ? "day" : "days"} late</div>
                  </div>
                  <span className="text-xs font-bold text-[#c0121f]">{peso(t.fine)}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

    </>
  );
}

// ---------- Analytics ----------
const RANGES = [["day", "Today"], ["week", "Last 7 days"], ["month", "Last 30 days"], ["year", "Last 12 months"], ["custom", "Custom"]];
const SERIES_COLORS = ["#4a1f1f", "#eea51c", "#0c7a43", "#0b4a8b"];
const isoMs = (iso) => Date.parse(iso + "T00:00:00Z");
const addDays = (iso, n) => new Date(isoMs(iso) + n * 86400000).toISOString().slice(0, 10);
const shortDate = (iso, opts) => new Date(isoMs(iso)).toLocaleDateString("en-US", { timeZone: "UTC", ...opts });
// Students are grouped by course, faculty by department. Change this one function if your data differs.
const deptOf = (u) => (u ? (u.role === "professor" ? u.department : u.course) : "") || "Unassigned";

const resolveRange = (range, from, to) => {
  const today = localISO();
  let start = today, end = today;
  if (range === "week") start = addDays(today, -6);
  else if (range === "month") start = addDays(today, -29);
  else if (range === "year") start = addDays(today, -364);
  else if (range === "custom") { start = from || addDays(today, -29); end = to || today; }
  return start <= end ? { start, end } : { start: end, end: start };
};

const buildBuckets = (start, end) => {
  const span = Math.round((isoMs(end) - isoMs(start)) / 86400000) + 1;
  const out = [];
  if (span <= 31) {
    for (let i = 0; i < span; i++) {
      const d = addDays(start, i);
      out.push({ start: d, end: d, label: shortDate(d, { month: "short", day: "numeric" }) });
    }
    return { buckets: out, unit: "Daily" };
  }
  if (span <= 120) {
    for (let s = start; s <= end; s = addDays(s, 7)) {
      const e = addDays(s, 6);
      out.push({ start: s, end: e > end ? end : e, label: shortDate(s, { month: "short", day: "numeric" }) });
    }
    return { buckets: out, unit: "Weekly" };
  }
  let y = +start.slice(0, 4), m = +start.slice(5, 7);
  for (let guard = 0; guard < 240; guard++) {
    const first = `${y}-${String(m).padStart(2, "0")}-01`;
    if (first > end) break;
    const ny = m === 12 ? y + 1 : y;
    const nm = m === 12 ? 1 : m + 1;
    const last = addDays(`${ny}-${String(nm).padStart(2, "0")}-01`, -1);
    out.push({
      start: first < start ? start : first,
      end: last > end ? end : last,
      label: shortDate(first, { month: "short", year: "2-digit" }),
    });
    y = ny;
    m = nm;
  }
  return { buckets: out, unit: "Monthly" };
};

const tally = (list, keyFn) => {
  const m = new Map();
  list.forEach((r) => {
    const k = keyFn(r);
    if (k) m.set(k, (m.get(k) || 0) + 1);
  });
  return [...m]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
};

function EmptyChart({ text }) {
  return (
    <div className="flex h-40 items-center justify-center rounded-xl bg-[#faf6f0] px-4 text-center text-sm text-gray-500">
      {text || "No borrowing records match the selected filters."}
    </div>
  );
}

function ChartCard({ title, purpose, controls, wide, children }) {
  return (
    <section className={`rounded-2xl border border-[#4a1f1f]/15 bg-white p-5 shadow-sm ${wide ? "lg:col-span-2" : ""}`}>
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base font-bold tracking-tight text-[#4a1f1f]">{title}</h3>
          <p className="mt-0.5 text-xs text-gray-500">{purpose}</p>
        </div>
        {controls && <div className="flex flex-wrap items-center gap-2">{controls}</div>}
      </div>
      {children}
    </section>
  );
}

const DONUT_COLORS = ["#4a1f1f", "#eea51c", "#0c7a43", "#0b4a8b", "#c0121f", "#7C3AED", "#0e7490", "#9CA3AF"];

const cutLabel = (s, n = 22) => (String(s).length > n ? `${String(s).slice(0, n - 1)}…` : s);

// Hover card for Top Borrowed Books: cover, title, author, genre
function BookTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { label, value, book } = payload[0].payload;
  const genre = book?.category
    ? `${book.category}${book.subcategory ? ` · ${book.subcategory}` : ""}`
    : "-";
  return (
    <div className="flex w-[250px] gap-3 rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg">
      <div className="shrink-0"><Cover colors={book?.cover} image={book?.image} size="lg" /></div>
      <div className="min-w-0 text-xs">
        <strong className="block break-words text-[13px] leading-tight text-[#4a1f1f]">{book?.title || label}</strong>
        <span className="mt-0.5 block text-gray-600">by {book?.author || "-"}</span>
        <span className="mt-1 block text-gray-500">{genre}</span>
        <span className="mt-1.5 block font-bold text-[#4a1f1f]">{value} {value === 1 ? "borrow" : "borrows"}</span>
      </div>
    </div>
  );
}

// Horizontal bars with a soft gradient and a light track behind each bar
function HBars({ rows, color = "#4a1f1f", suffix = "", unit = "transactions", max: fixedMax, empty, tooltip }) {
  if (!rows.length) return <EmptyChart text={empty} />;
  const top = Math.max(...rows.map((r) => r.value), 1);
  const gid = `hb-${color.replace("#", "")}`;

  return (
    <ResponsiveContainer debounce={200} width="100%" height={rows.length * 46 + 28}>
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 64, left: 0, bottom: 0 }} barCategoryGap="24%">
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={color} stopOpacity={0.55} />
            <stop offset="100%" stopColor={color} stopOpacity={1} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="#F3F4F6" strokeDasharray="4 4" horizontal={false} />
        <XAxis
          type="number" domain={[0, fixedMax || Math.ceil(top * 1.1)]}
          tick={AXIS_TICK_SM} axisLine={false} tickLine={false} allowDecimals={false}
          tickFormatter={(v) => `${v}${suffix}`}
        />
        <YAxis type="category" dataKey="label" width={130} tick={AXIS_TICK} tickFormatter={(s) => cutLabel(s)} axisLine={false} tickLine={false} />
        <Tooltip
          content={tooltip || <ChartTooltip suffix={suffix} unit={unit} />}
          cursor={{ fill: "rgba(0,0,0,0.03)" }}
          wrapperStyle={{ zIndex: 50 }}
          allowEscapeViewBox={{ x: false, y: true }}
        />
        <Bar dataKey="value" fill={`url(#${gid})`} radius={[0, 8, 8, 0]} maxBarSize={22} background={{ fill: "#faf6f0", radius: 8 }}>
          <LabelList
            dataKey="value" position="right"
            formatter={(v) => `${v}${suffix}`}
            style={{ fontSize: 11, fontWeight: 700, fill: "#4a1f1f" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

// Vertical bars. Pass `color` for a single color, or omit it for a multi-color palette.
function VBars({ rows, color, suffix = "", unit = "transactions", max: fixedMax, empty }) {
  if (!rows.length) return <EmptyChart text={empty} />;
  const crowded = rows.length > 4;

  return (
    <ResponsiveContainer debounce={200} width="100%" height={crowded ? 300 : 260}>
      <BarChart data={rows} margin={{ top: 22, right: 8, left: -16, bottom: 0 }} barCategoryGap="26%">
        <defs>
          {(color ? [color] : DONUT_COLORS).map((c) => (
            <linearGradient key={c} id={`vb-${c.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c} stopOpacity={1} />
              <stop offset="100%" stopColor={c} stopOpacity={0.55} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis
          dataKey="label" tick={AXIS_TICK} axisLine={false} tickLine={false} interval={0}
          tickFormatter={(s) => cutLabel(s, crowded ? 14 : 22)}
          angle={crowded ? -25 : 0} textAnchor={crowded ? "end" : "middle"} height={crowded ? 64 : 30}
        />
        <YAxis
          domain={[0, fixedMax || "auto"]} tick={AXIS_TICK_SM} axisLine={false} tickLine={false} allowDecimals={false}
          tickFormatter={(v) => `${v}${suffix}`}
        />
        <Tooltip content={<ChartTooltip suffix={suffix} unit={unit} />} cursor={{ fill: "rgba(0,0,0,0.03)" }} />
        <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={52} background={{ fill: "#faf6f0", radius: 8 }}>
          {rows.map((r, i) => {
            const c = color || DONUT_COLORS[i % DONUT_COLORS.length];
            return <Cell key={r.label} fill={`url(#vb-${c.replace("#", "")})`} />;
          })}
          <LabelList
            dataKey="value" position="top"
            formatter={(v) => `${v}${suffix}`}
            style={{ fontSize: 11, fontWeight: 700, fill: "#4a1f1f" }}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

function DonutTooltip({ active, payload, total, unit }) {
  if (!active || !payload?.length) return null;
  const { label, value } = payload[0].payload;
  return (
    <div style={{ background: "#fff", border: "1px solid #E5E7EB", borderRadius: 10, padding: "10px 14px", fontSize: 12, boxShadow: "0 4px 16px rgba(0,0,0,0.10)" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 700, color: "#111827" }}>{label}</p>
      <p style={{ margin: 0, color: "#4a1f1f", fontSize: 11 }}>
        <strong>{value}</strong> {unit} · {Math.round((value / total) * 100)}%
      </p>
    </div>
  );
}

// Doughnut with the total in the center and a legend on the side
function Donut({ rows, unit = "transactions", empty }) {
  if (!rows.length) return <EmptyChart text={empty} />;
  const MAX = 7;
  const data = rows.length > MAX
    ? [...rows.slice(0, MAX), { label: "Others", value: rows.slice(MAX).reduce((s, r) => s + r.value, 0) }]
    : rows;
  const total = data.reduce((s, r) => s + r.value, 0);

  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row">
      <div className="relative h-[220px] w-full shrink-0 sm:w-[220px]">
        <ResponsiveContainer debounce={200} width="100%" height="100%">
          <PieChart>
            <Pie
              data={data} dataKey="value" nameKey="label"
              innerRadius="62%" outerRadius="94%" paddingAngle={3} cornerRadius={6} stroke="none"
            >
              {data.map((r, i) => <Cell key={r.label} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
            </Pie>
            <Tooltip content={<DonutTooltip total={total} unit={unit} />} wrapperStyle={{ zIndex: 50 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <strong className="text-3xl font-bold tabular-nums text-[#4a1f1f]">{total}</strong>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">{unit}</span>
        </div>
      </div>

      <ul className="w-full min-w-0 flex-1 space-y-1.5">
        {data.map((r, i) => (
          <li key={r.label} className="flex items-center gap-2.5 rounded-lg bg-[#faf6f0] px-3 py-1.5 text-[13px]">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
            <span className="min-w-0 flex-1 truncate font-semibold">{r.label}</span>
            <span className="font-bold tabular-nums text-[#4a1f1f]">{r.value}</span>
            <span className="w-9 text-right text-xs tabular-nums text-gray-500">{Math.round((r.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Real line chart (the Overview keeps its area chart)
function TrendLine({ labels, values, height = 260 }) {
  const data = labels.map((label, i) => ({ label, value: values[i] }));
  const avg = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  const dots = data.length <= 31;

  return (
    <ResponsiveContainer debounce={200} width="100%" height={height}>
      <RLineChart data={data} margin={{ top: 12, right: 12, left: -20, bottom: 0 }}>
        <CartesianGrid {...GRID_PROPS} />
        <XAxis dataKey="label" tick={AXIS_TICK_SM} axisLine={false} tickLine={false} interval="preserveStartEnd" />
        <YAxis tick={AXIS_TICK_SM} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip unit="borrowings" />} cursor={{ stroke: "#E5E7EB", strokeWidth: 1 }} />
        <ReferenceLine
          y={avg} stroke="#7C3AED" strokeDasharray="5 4" strokeWidth={1.5}
          label={{ value: "avg", fill: "#7C3AED", fontSize: 10, position: "insideTopRight" }}
        />
        <Line
          type="monotone" dataKey="value" stroke="#4a1f1f" strokeWidth={3}
          dot={dots ? { r: 3.5, fill: "#fff", stroke: "#4a1f1f", strokeWidth: 2 } : false}
          activeDot={{ r: 6, fill: "#eea51c", stroke: "#4a1f1f", strokeWidth: 2 }}
        />
      </RLineChart>
    </ResponsiveContainer>
  );
}

const CatSelect = ({ value, onChange }) => (
  <select className={`${selectSm} max-w-[150px]`} aria-label="Filter by category" value={value} onChange={(e) => onChange(e.target.value)}>
    <option value="All">All categories</option>
    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
  </select>
);

const TopSelect = ({ value, onChange }) => (
  <select className={selectSm} aria-label="Number of results" value={value} onChange={(e) => onChange(+e.target.value)}>
    <option value={5}>Top 5</option>
    <option value={10}>Top 10</option>
  </select>
);

function Analytics({ books, transactions, students }) {
  const [range, setRange] = useState("month");
  const [from, setFrom] = useState(() => addDays(localISO(), -29));
  const [to, setTo] = useState(() => localISO());
  const [bookTop, setBookTop] = useState(5);
  const [bookCat, setBookCat] = useState("All");
  const [bookSub, setBookSub] = useState("All");
  const [subTop, setSubTop] = useState(5);
  const [subCat, setSubCat] = useState("All");
  const [trendCat, setTrendCat] = useState("All");
  const [trendDept, setTrendDept] = useState("All");
  const [deptCat, setDeptCat] = useState("All");
  const [role, setRole] = useState("all");

  const { start, end } = resolveRange(range, from, to);
  const booksById = new Map(books.map((b) => [b.id, b]));
  const usersByEmail = new Map(students.map((s) => [s.email, s]));

  // One row per approved borrowing transaction (returned loans included, so history is kept).
  const rows = transactions.map((t) => {
    const b = booksById.get(t.bookId);
    const u = usersByEmail.get(t.borrowerEmail);
    return {
      date: String(t.borrowedOn || "").slice(0, 10),
      bookId: t.bookId,
      title: t.title,
      category: b?.category || "Uncategorized",
      subcategory: b?.subcategory || "",
      email: t.borrowerEmail,
      dept: deptOf(u),
      role: u?.role === "professor" ? "faculty" : "student",
    };
  });
  const scoped = rows.filter((r) => r.date && r.date >= start && r.date <= end);

  const subsOf = (cat) =>
    [...new Set(books.filter((b) => cat === "All" || b.category === cat).map((b) => b.subcategory).filter(Boolean))].sort();
  const allDepts = [...new Set(rows.map((r) => r.dept))].sort();

  // 1. Top borrowed books
  const topBooks = tally(
    scoped.filter((r) => (bookCat === "All" || r.category === bookCat) && (bookSub === "All" || r.subcategory === bookSub)),
    (r) => r.title
  ).slice(0, bookTop).map((r) => ({ ...r, book: books.find((b) => b.title === r.label) }));

  // 2. Category
  const byCategory = tally(scoped, (r) => r.category);

  // 3. Subcategory
  const bySub = tally(scoped.filter((r) => subCat === "All" || r.category === subCat), (r) => r.subcategory).slice(0, subTop);

  // 4. Trend
  const { buckets, unit } = buildBuckets(start, end);
  const trendRows = scoped.filter((r) => (trendCat === "All" || r.category === trendCat) && (trendDept === "All" || r.dept === trendDept));
  const trendValues = buckets.map((b) => trendRows.filter((r) => r.date >= b.start && r.date <= b.end).length);
  const trendTotal = trendValues.reduce((s, v) => s + v, 0);

  // 5. Department borrowing
  const byDept = tally(scoped.filter((r) => deptCat === "All" || r.category === deptCat), (r) => r.dept);

  // 6. Unique borrowers by department
  const uniq = new Map();
  scoped.forEach((r) => {
    if (!uniq.has(r.dept)) uniq.set(r.dept, new Set());
    uniq.get(r.dept).add(r.email);
  });
  const uniqueByDept = [...uniq]
    .map(([label, set]) => ({ label, value: set.size }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  // 7. Engagement: unique borrowers / registered users in the department
  const roleOk = (rl) => role === "all" || rl === role;
  const eligible = new Map();
  students.forEach((s) => {
    if (!roleOk(s.role === "professor" ? "faculty" : "student")) return;
    const d = deptOf(s);
    if (d !== "Unassigned") eligible.set(d, (eligible.get(d) || 0) + 1);
  });
  const borrowersIn = new Map();
  scoped.filter((r) => roleOk(r.role)).forEach((r) => {
    if (!borrowersIn.has(r.dept)) borrowersIn.set(r.dept, new Set());
    borrowersIn.get(r.dept).add(r.email);
  });
  const engagement = [...eligible]
    .map(([label, total]) => {
      const b = borrowersIn.get(label)?.size || 0;
      return { label, value: Math.round((b / total) * 1000) / 10, sub: `(${b} of ${total})` };
    })
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));

  const pill = (on) =>
    `cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold transition ${
      on ? "border-[#4a1f1f] bg-[#4a1f1f] text-white" : "border-[#4a1f1f]/25 bg-white text-[#4a1f1f] hover:bg-[#faf6f0]"
    }`;

  const kpis = [
    ["Borrowing transactions", scoped.length],
    ["Unique borrowers", new Set(scoped.map((r) => r.email)).size],
    ["Different books borrowed", new Set(scoped.map((r) => r.bookId)).size],
  ];

  return (
    <section className="mb-10">
      <h2 className="mb-0.5 text-xl font-bold">Analytics</h2>
      <p className="mb-4 text-[13px] text-gray-500">
        {fmt(start)}{start !== end ? ` to ${fmt(end)}` : ""}
      </p>

      <div className="mb-5 rounded-2xl border border-[#4a1f1f]/15 bg-[#faf6f0] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {RANGES.map(([k, label]) => (
            <button key={k} type="button" className={pill(range === k)} onClick={() => setRange(k)}>{label}</button>
          ))}
          {range === "custom" && (
            <div className="flex flex-wrap items-center gap-2 text-[13px]">
              <input type="date" className={selectSm} max={localISO()} value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
              <span>to</span>
              <input type="date" className={selectSm} max={localISO()} value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-gray-500">The date range applies to every chart below and uses the borrow date.</p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-2xl border border-black/5 bg-[#e4f1ee] px-5 py-4 shadow-sm">
            <span className="block text-xs font-semibold uppercase tracking-wide text-[#1b1b1b]/70">{label}</span>
            <strong className="text-3xl font-bold tabular-nums">{value}</strong>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ChartCard
          wide
          title="Borrowing Trends Over Time"
          purpose={`${unit} borrowing transactions. Shows patterns, seasonal demand and busy periods.`}
          controls={
            <>
              <CatSelect value={trendCat} onChange={setTrendCat} />
              <select className={`${selectSm} max-w-[170px]`} aria-label="Filter by department" value={trendDept} onChange={(e) => setTrendDept(e.target.value)}>
                <option value="All">All departments</option>
                {allDepts.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </>
          }
        >
          {trendTotal === 0 ? (
            <EmptyChart />
          ) : (
            <TrendLine labels={buckets.map((b) => b.label)} values={trendValues} />
          )}
        </ChartCard>

        <ChartCard
          title="Top Borrowed Books"
          purpose="Popular titles. Helps decide which books need more copies."
          controls={
            <>
              <CatSelect value={bookCat} onChange={(v) => { setBookCat(v); setBookSub("All"); }} />
              <select className={`${selectSm} max-w-[150px]`} aria-label="Filter by subcategory" value={bookSub} onChange={(e) => setBookSub(e.target.value)}>
                <option value="All">All subcategories</option>
                {subsOf(bookCat).map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <TopSelect value={bookTop} onChange={setBookTop} />
            </>
          }
        >
          <HBars rows={topBooks} color="#4a1f1f" tooltip={<BookTooltip />} />
        </ChartCard>

        <ChartCard title="Borrowing by Category" purpose="Most borrowed subject areas, highest to lowest. Guides collection development.">
          <Donut rows={byCategory} />
        </ChartCard>

        <ChartCard
          title="Borrowing by Subcategory"
          purpose="Specific subjects in high demand. Books without a subcategory are not counted."
          controls={
            <>
              <CatSelect value={subCat} onChange={setSubCat} />
              <TopSelect value={subTop} onChange={setSubTop} />
            </>
          }
        >
          <HBars rows={bySub} color="#eea51c" />
        </ChartCard>

        <ChartCard
          title="Borrowing by Academic Department"
          purpose="Which departments generate the most borrowing transactions."
          controls={<CatSelect value={deptCat} onChange={setDeptCat} />}
        >
          <Donut rows={byDept} />
        </ChartCard>

        <ChartCard title="Unique Borrowers by Department" purpose="Distinct people who borrowed at least once. Repeat loans count once.">
          <VBars rows={uniqueByDept} color="#0c7a43" unit="borrowers" />
        </ChartCard>

        <ChartCard
          wide
          title="Borrowing Engagement by Department"
          purpose="Share of registered users in each department who borrowed at least one book."
          controls={
            <select className={selectSm} aria-label="Filter by user role" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="all">All users</option>
              <option value="student">Students</option>
              <option value="faculty">Faculty</option>
            </select>
          }
        >
          <VBars rows={engagement} color="#4a1f1f" suffix="%" unit="engagement" max={100} empty="No registered users with a department match these filters." />
        </ChartCard>
      </div>
    </section>
  );
}

// ---------- Profile ----------
function EditProfileModal({ profile, onClose, onSaved }) {
  const [f, setF] = useState({ firstName: profile.firstName || "", lastName: profile.lastName || "", phone: profile.phone || "" });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const phone = f.phone.replace(/[\s-]/g, "");
  const changed =
    f.firstName.trim() !== (profile.firstName || "").trim() ||
    f.lastName.trim() !== (profile.lastName || "").trim() ||
    phone !== (profile.phone || "").replace(/[\s-]/g, "");
  const errors = {
    firstName: !f.firstName.trim() && "Required",
    lastName: !f.lastName.trim() && "Required",
    phone: phone && !/^\+?\d{7,15}$/.test(phone) && "Enter a valid phone number.",
  };
  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    try {
      await api("/me", { method: "PUT", body: JSON.stringify({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), phone }) }, AUTH_API);
      onSaved({ ...profile, firstName: f.firstName.trim(), lastName: f.lastName.trim(), fullName: `${f.firstName.trim()} ${f.lastName.trim()}`, phone });
    } catch (err) { setError(err.message); }
  };
  const bind = (k) => ({
    value: f[k],
    onChange: (e) => setF({ ...f, [k]: e.target.value }),
    className: `${inputBase} ${touched && errors[k] ? "border-[#c0121f]" : "border-[#4a1f1f]/25 focus:border-[#4a1f1f]"}`,
  });
  return (
    <Modal title="Edit Profile" titleId="edit-profile-title" onClose={onClose} small>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px]">
        <Field label="First name" error={touched && errors.firstName}><input type="text" {...bind("firstName")} /></Field>
        <Field label="Last name" error={touched && errors.lastName}><input type="text" {...bind("lastName")} /></Field>
        <Field label="Phone" error={touched && errors.phone}><input type="tel" {...bind("phone")} /></Field>
        {error && <p className="text-[12.5px] font-semibold text-[#c0121f]" role="alert">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
          <button
            type="submit"
            className={btnPrimary}
            disabled={!changed}
            title={!changed ? "No changes to save" : undefined}
          >
            Save
          </button>
        </div>
      </form>
    </Modal>
  );
}

function PasswordModal({ onClose, onDone }) {
  const [f, setF] = useState({ cur: "", next: "", conf: "" });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const errors = {
    cur: !f.cur && "Required",
    next: f.next.length < 8 ? "At least 8 characters"
      : !/[A-Za-z]/.test(f.next) || !/[0-9]/.test(f.next) ? "Use letters and numbers"
      : f.next === f.cur ? "Must differ from current" : false,
    conf: f.conf !== f.next && "Passwords don't match",
  };
  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    try {
      await api("/password", { method: "PUT", body: JSON.stringify({ currentPassword: f.cur, newPassword: f.next }) }, AUTH_API);
      onDone();
    } catch (err) { setError(err.message); }
  };
  const bind = (k) => ({
    type: "password",
    value: f[k],
    onChange: (e) => setF({ ...f, [k]: e.target.value }),
    className: `${inputBase} ${touched && errors[k] ? "border-[#c0121f]" : "border-[#4a1f1f]/25 focus:border-[#4a1f1f]"}`,
  });
  return (
    <Modal title="Change Password" titleId="password-title" onClose={onClose} small>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px]">
        <Field label="Current password" error={touched && errors.cur}><input {...bind("cur")} /></Field>
        <Field label="New password" error={touched && errors.next}><input {...bind("next")} /></Field>
        <Field label="Confirm new password" error={touched && errors.conf}><input {...bind("conf")} /></Field>
        {error && <p className="text-[12.5px] font-semibold text-[#c0121f]" role="alert">{error}</p>}
        <div className="grid grid-cols-2 gap-4">
          <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
          <button type="submit" className={btnPrimary} disabled={!f.cur && !f.next && !f.conf}>Update</button>
        </div>
      </form>
    </Modal>
  );
}

function ProfileTab({ profile: u, onChange, notify }) {
  const [modal, setModal] = useState(null);
  const fileRef = useRef(null);
  if (!u) return <p className="text-gray-500">Loading profile...</p>;

  const setAvatar = async (avatar) => {
    try {
      await api("/me", { method: "PUT", body: JSON.stringify({ avatar }) }, AUTH_API);
      onChange({ ...u, avatar });
      notify(avatar ? "Profile picture updated." : "Profile picture removed.");
    } catch (e) { notify(e.message); }
  };
  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return notify("Choose an image file.");
    try { await setAvatar(await resizeImage(file, 400)); } catch (err) { notify(err.message); }
  };
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("session");
    window.location.href = "/login";
  };
  const fullName = u.fullName || `${u.firstName || ""} ${u.lastName || ""}`.trim();
  const rows = [
    ["Full name", fullName],
    ["Employee ID", u.idNumber || u.employeeId || "-"],
    ["Faculty email", u.email],
    ["Phone number", u.phone],
    ["Assigned role", u.assignedRole || "Librarian"],
  ];

  return (
    <div className="mx-auto max-w-[480px]">
      <div className="mb-6 flex flex-col items-center gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} aria-label="Change profile photo" className="cursor-pointer rounded-full border-0 bg-[#4a1f1f] p-1">
          {u.avatar ? (
            <img src={u.avatar} alt="" className="h-[104px] w-[104px] rounded-full object-cover" />
          ) : (
            <span className="flex h-[104px] w-[104px] items-center justify-center rounded-full bg-[#faf6f0] text-[44px] font-bold text-[#4a1f1f]">
              {(u.firstName || fullName || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pick} />
        <div className="flex gap-3 text-xs">
          <button className="cursor-pointer border-0 bg-transparent font-semibold text-[#0b4a8b]" onClick={() => fileRef.current?.click()}>Change photo</button>
          {u.avatar && <button className="cursor-pointer border-0 bg-transparent font-semibold text-[#c0121f]" onClick={() => setAvatar(null)}>Remove photo</button>}
        </div>
        <h2 className="text-2xl font-bold text-[#4a1f1f]">{fullName}</h2>
        <span className="rounded-full bg-[#4a1f1f]/10 px-3.5 py-1 text-sm font-semibold text-[#4a1f1f]">Librarian</span>
      </div>

      <div className="mb-6 rounded-xl border border-[#4a1f1f]/20">
        {rows.map(([label, value]) => (
          <div key={label} className="border-b border-[#4a1f1f]/10 px-4 py-3 last:border-b-0">
            <div className="text-xs text-gray-500">{label}</div>
            <div className="text-[15px] font-semibold">{value || "-"}</div>
          </div>
        ))}
      </div>

      <div className="mb-3 grid grid-cols-2 gap-3">
        <button className={btnPrimary} onClick={() => setModal("edit")}>Edit profile</button>
        <button className={btnSecondary} onClick={() => setModal("password")}>Password</button>
      </div>
      <button className="w-full cursor-pointer rounded-sm border border-[#e00000] bg-white px-3 py-[11px] text-[13px] font-bold text-[#e00000] hover:bg-red-50" onClick={() => setModal("logout")}>Log out</button>

      {modal === "edit" && <EditProfileModal profile={u} onClose={() => setModal(null)} onSaved={(p) => { onChange(p); setModal(null); notify("Profile updated."); }} />}
      {modal === "password" && <PasswordModal onClose={() => setModal(null)} onDone={() => { setModal(null); notify("Password changed."); }} />}
      {modal === "logout" && (
        <Modal title="Log out?" titleId="logout-title" small onClose={() => setModal(null)}>
          <div className="px-6 pt-[22px] pb-[26px]">
            <p className="mb-[18px] text-sm">Are you sure you want to log out?</p>
            <div className="grid grid-cols-2 gap-4">
              <button className={btnSecondary} onClick={() => setModal(null)}>Cancel</button>
              <button className={btnDanger} onClick={logout}>Log out</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Footer({ onNavigate }) {
  return (
    <footer className="bg-[#4a1a1f] font-serif text-[#f3d9c0]">
      <div className="grid gap-8 px-[7%] py-10 md:grid-cols-[auto_auto_1fr] md:items-center">
        <div className="flex items-center gap-3">
          <img src={crest} alt="Hogwarts crest" className="h-16 w-16 object-contain" />
          <div>
            <p className="text-xl leading-tight">
              Hogwarts
              <br />
              Library
            </p>
            <p className="mt-1 text-xs font-semibold">Knowledge is the truest magic.</p>
          </div>
        </div>

        <ul className="space-y-1 text-xs md:border-x md:border-[#f3d9c0]/40 md:px-8">
          {TABS.map(([k, label]) => (
            <li key={k}>
              <button type="button" onClick={() => onNavigate(k)} className="hover:underline">
                {label}
              </button>
            </li>
          ))}
        </ul>

        <div className="text-xs md:pl-4">
          <p>
            This is an unofficial fan-made project for school compliance, not affiliated with
            J.K. Rowling, Warner Bros., or Wizarding World.
          </p>
          <p className="mt-3">Mischief Managed.</p>
        </div>
      </div>
    </footer>
  );
}

// ---------- Generic confirmation ----------
function ConfirmModal({ title, message, confirmLabel = "Yes", danger, run, onCancel }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      e.stopImmediatePropagation(); // don't also close the modal underneath
      if (!busy) onCancel();
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [onCancel, busy]);

  return (
    <Modal title={title} titleId="confirm-title" describedBy="confirm-desc" role="alertdialog" small onClose={() => !busy && onCancel()}>
      <div className="px-6 pt-[22px] pb-[26px]">
        <p id="confirm-desc" className="mb-[18px] text-sm leading-normal">{message}</p>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" className={btnSecondary} onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            type="button"
            className={danger ? btnDanger : btnPrimary}
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              try { await run(); } finally { onCancel(); }
            }}
          >
            {busy ? "Working..." : confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Return confirmation ----------
function ReturnModal({ tx, book, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && !busy && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel, busy]);

  return (
    <Modal title="Mark as Returned" titleId="return-title" describedBy="return-desc" role="alertdialog" onClose={onCancel}>
      <div className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px]">
        <p id="return-desc" className="text-sm leading-normal">
          Mark <strong>{tx.title}</strong> as returned by <strong>{tx.borrower}</strong>?
        </p>
        {book && <BookInfoCard book={book} />}
        <p className="text-xs text-gray-500">Borrowed {fmt(tx.borrowedOn)} · Due {fmt(tx.due)}</p>
        {tx.overdue && (
          <p className="rounded-lg bg-[#c0121f]/10 p-3 text-[13px] font-semibold text-[#c0121f]">
            This book is {tx.daysOverdue} {tx.daysOverdue === 1 ? "day" : "days"} late. A fine of {peso(tx.fine)} will be recorded.
          </p>
        )}
        <div className="mt-1.5 grid grid-cols-2 gap-4">
          <button type="button" className={btnSecondary} onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            type="button"
            className={btnPrimary}
            disabled={busy}
            onClick={async () => { setBusy(true); await onConfirm(); }}
          >
            {busy ? "Returning..." : "Yes, return"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Verify return (scan QR or type the number) ----------
function VerifyReturnModal({ books = [], onClose, onDone }) {
  const [mode, setMode] = useState("scan");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [camError, setCamError] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const busyRef = useRef(false);
  const lastScan = useRef({ text: "", at: 0 });

  const verify = async (value) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError("");
    try {
      const tx = await api("/verify-return", { method: "PUT", body: JSON.stringify({ code: value }) }, BORROW_API);
      setResult(tx);
      onDone(tx);
    } catch (e) {
      setError(e.message);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  useEffect(() => {
    if (mode !== "scan" || result) return;
    let scanner = null;
    let cancelled = false;
    setCamError("");
    const stop = (s) => s.stop().then(() => s.clear()).catch(() => {});
    (async () => {
      try {
        const s = new Html5Qrcode("qr-reader");
        await s.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 220, height: 220 } },
          (text) => {
            const now = Date.now();
            if (text === lastScan.current.text && now - lastScan.current.at < 3000) return;
            lastScan.current = { text, at: now };
            verify(text);
          },
          () => {}
        );
        scanner = s;
        if (cancelled) stop(s);
      } catch {
        if (!cancelled) setCamError("Couldn't open the camera. Allow camera access, or enter the number instead.");
      }
    })();
    return () => {
      cancelled = true;
      if (scanner) stop(scanner);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, result]);

  const submitManual = (e) => {
    e.preventDefault();
    const v = code.replace(/\s/g, "");
    if (!/^\d{8}$/.test(v)) return setError("Enter the 8-digit verification number.");
    verify(v);
  };

  const book = result ? books.find((b) => b.id === result.bookId) : null;

  const tab = (k, label) => (
    <button
      type="button"
      onClick={() => { setMode(k); setError(""); }}
      className={`flex-1 cursor-pointer rounded-md border-0 py-2 text-[13px] font-semibold ${mode === k ? "bg-[#4a1f1f] text-white" : "bg-[#faf6f0] text-[#4a1f1f]"}`}
    >
      {label}
    </button>
  );

  return (
    <Modal title="Verify Return" titleId="verify-return-title" onClose={onClose}>
      <div className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px] text-[13px]">
        {result ? (
          <>
            <div className="rounded-xl bg-[#0c7a43]/10 p-4 text-center text-[#0c7a43]">
              <strong className="block text-base">Return confirmed</strong>
              <span className="block">{result.title} was returned by {result.borrower}.</span>
            </div>

            {book && <BookInfoCard book={book} />}

            <div className="rounded-xl border border-[#4a1f1f]/20 bg-white p-3">
              <h4 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-400">Borrow details</h4>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-2 text-xs">
                {[
                  ["Returned by", result.borrower],
                  ["Email", result.borrowerEmail],
                  ["Borrowed on", fmtStamp(result.borrowedAt ?? result.borrowedOn)],
                  ["Due date", fmtStamp(result.dueAt ?? result.due)],
                  ["Returned on", fmtStamp(result.returnedAt ?? result.returned)],
                ].map(([label, value]) => (
                  <div key={label} className="min-w-0">
                    <dt className="text-gray-500">{label}</dt>
                    <dd className="break-words font-semibold">{value || "-"}</dd>
                  </div>
                ))}
              </dl>
            </div>

            <div className={`rounded-lg p-3 text-[13px] ${result.fine > 0 ? "bg-[#c0121f]/10" : "bg-[#0c7a43]/10"}`}>
              {result.fine > 0 ? (
                <>
                  <div className="font-bold text-[#c0121f]">Late return</div>
                  <div className="mt-1">
                    {result.daysOverdue} {result.daysOverdue === 1 ? "day" : "days"} late × ₱{FINE_PER_DAY.toFixed(2)}/day
                  </div>
                  <div className="mt-0.5 text-base font-extrabold text-[#c0121f]">Fine due: {peso(result.fine)}</div>
                </>
              ) : (
                <div className="font-bold text-[#0c7a43]">Returned on time. No fine.</div>
              )}
            </div>
            <button type="button" className={btnPrimary} onClick={() => { setResult(null); setCode(""); }}>Verify another</button>
            <button type="button" className={btnSecondary} onClick={onClose}>Done</button>
          </>
        ) : (
          <>
            <div className="flex gap-2">{tab("scan", "Scan QR code")}{tab("manual", "Enter number")}</div>
            {mode === "scan" ? (
              <>
                <div id="qr-reader" className="overflow-hidden rounded-xl bg-black/5" />
                {camError && <p className="font-semibold text-[#c0121f]" role="alert">{camError}</p>}
                <p className="text-gray-500">Point the camera at the borrower's QR code.</p>
              </>
            ) : (
              <form onSubmit={submitManual} noValidate className="flex flex-col gap-3">
                <Field label="Verification number">
                  <input
                    type="text"
                    inputMode="numeric"
                    autoFocus
                    maxLength={9}
                    placeholder="e.g. 1234 5678"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className={`${inputBase} border-[#4a1f1f]/25 font-mono text-base tracking-widest focus:border-[#4a1f1f]`}
                  />
                </Field>
                <button type="submit" className={btnPrimary} disabled={busy}>{busy ? "Verifying..." : "Verify"}</button>
              </form>
            )}
            {error && <p className="font-semibold text-[#c0121f]" role="alert">{error}</p>}
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------- Approve / decline confirmation ----------
function ApproveModal({ request, onCancel, onConfirm }) {
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <Modal title="Approve Request" titleId="approve-title" describedBy="approve-desc" role="alertdialog" small onClose={onCancel}>
      <div className="px-6 pt-[22px] pb-[26px]">
        <p id="approve-desc" className="mb-[18px] text-sm leading-normal">
          Are you sure you want to approve <strong>{request.title}</strong> for <strong>{request.borrower}</strong>?
          The loan starts today and is due in {LOAN_DAYS} days.
        </p>
        <div className="grid grid-cols-2 gap-4">
          <button type="button" className={btnSecondary} onClick={onCancel} disabled={busy}>Cancel</button>
          <button
            type="button"
            className={btnApprove}
            disabled={busy}
            onClick={async () => { setBusy(true); await onConfirm(); }}
          >
            {busy ? "Approving..." : "Yes, approve"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

const REASON_MAX = 300;
const OTHER_REASON = "Other";
const DECLINE_REASONS = [
  "You have an overdue book.",
  "You have an unpaid fine.",
  "You've reached the borrowing limit.",
  "This book is reserved for a class.",
  "No copies are available right now.",
  "This book is for restricted use only.",
  OTHER_REASON,
];

function DeclineModal({ request, onCancel, onConfirm }) {
  const [choice, setChoice] = useState("");
  const [reason, setReason] = useState("");
  const [touched, setTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const isOther = choice === OTHER_REASON;
  const trimmed = isOther ? reason.trim() : choice;
  const error = !choice
    ? "Choose a reason."
    : isOther && trimmed.length < 5
    ? "Please enter a reason (at least 5 characters)."
    : "";

  useEffect(() => { if (isOther) ref.current?.focus(); }, [isOther]);
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = async (e) => {
    e.preventDefault();
    setTouched(true);
    if (error) return;
    setBusy(true);
    await onConfirm(trimmed);
  };

  return (
    <Modal title="Decline Request" titleId="decline-title" onClose={onCancel}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px]">
        <p className="text-sm leading-normal">
          Decline <strong>{request.title}</strong> requested by <strong>{request.borrower}</strong>?
          The reason will be shown to the borrower.
        </p>
        <Field label="Reason for declining" error={touched && !choice && error}>
          <select
            value={choice}
            onChange={(e) => setChoice(e.target.value)}
            onBlur={() => setTouched(true)}
            className={`${inputBase} ${touched && !choice ? "border-[#c0121f]" : "border-[#4a1f1f]/25 focus:border-[#4a1f1f]"} ${choice ? "text-[#1b1b1b]" : "text-gray-400"}`}
          >
            <option value="" disabled>Choose a reason</option>
            {DECLINE_REASONS.map((r) => (
              <option key={r} value={r} className="text-[#1b1b1b]">{r}</option>
            ))}
          </select>
        </Field>
        {isOther && (
          <Field
            label="Details"
            error={touched && error}
            counter={
              <span className={`ml-auto whitespace-nowrap text-[11.5px] ${reason.length >= REASON_MAX ? "font-bold text-[#c0121f]" : "font-normal text-gray-500"}`}>
                {reason.length}/{REASON_MAX}
              </span>
            }
          >
            <textarea
              ref={ref}
              value={reason}
              maxLength={REASON_MAX}
              onChange={(e) => setReason(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="Write the reason for the borrower."
              className={`${inputBase} min-h-[100px] resize-y ${touched && error ? "border-[#c0121f]" : "border-[#4a1f1f]/25 focus:border-[#4a1f1f]"}`}
            />
          </Field>
        )}
        <div className="grid grid-cols-2 gap-4">
          <button type="button" className={btnSecondary} onClick={onCancel} disabled={busy}>Cancel</button>
          <button type="submit" className={btnDanger} disabled={busy}>{busy ? "Declining..." : "Decline"}</button>
        </div>
      </form>
    </Modal>
  );
}

// ---------- Book details (read-only) ----------
function BookDetailModal({ book, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const left = copiesLeft(book);
  const info = [
    ["Category", book.category ? `${book.category}${book.subcategory ? ` · ${book.subcategory}` : ""}` : ""],
    ["Publisher", book.publisher],
    ["ISBN", book.isbn],
    ["Pages", book.pages],
    ["Published", book.published ? fmt(book.published) : ""],
    ["Shelf / Location", book.shelf],
    ["Available", book.totalCopies != null ? `${left} of ${book.totalCopies}` : ""],
  ].filter(([, v]) => v !== "" && v != null);

  return (
    <Modal title="Book details" titleId="book-detail-title" onClose={onClose}>
      <div className="flex flex-col gap-4 px-6 py-5 text-[13px]">
        <div className="flex gap-4">
          {book.image ? (
            <img
              src={book.image}
              alt=""
              referrerPolicy="no-referrer"
              className="h-[120px] w-[84px] shrink-0 rounded-md object-cover shadow-md ring-1 ring-black/10"
            />
          ) : (
            <div className="relative h-[120px] w-[84px] shrink-0 overflow-hidden rounded-md bg-[#4a1f1f] shadow-md">
              <span className="absolute inset-x-2 bottom-5 h-2 rounded-sm bg-[#eea51c]" />
            </div>
          )}
          <div className="min-w-0">
            <h3 className="break-words text-lg font-bold leading-tight text-[#4a1f1f]">{book.title}</h3>
            {book.author && <p className="mt-1 text-gray-500">by {book.author}</p>}
            {book.totalCopies != null && (
              <span
                className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset ${
                  left > 0 ? BADGE_COLORS.available : BADGE_COLORS.overdue
                }`}
              >
                {left > 0 ? "Available" : "No copies left"}
              </span>
            )}
          </div>
        </div>

        {info.length > 0 && (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 rounded-xl border border-[#4a1f1f]/20 bg-[#faf6f0] p-3 text-xs">
            {info.map(([label, value]) => (
              <div key={label} className="min-w-0">
                <dt className="text-gray-500">{label}</dt>
                <dd className="break-words font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
        )}

        <div>
          <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">About this book</h4>
          <p className="mt-1.5 leading-relaxed text-gray-700">{book.description || "No description available."}</p>
        </div>
      </div>
    </Modal>
  );
}

// ---------- Borrow requests page ----------
function RequestsTab({ requests, books, students, onDecide, onViewBorrower, onViewBook }) {
  const [confirm, setConfirm] = useState(null); // { request, approve }
  const [page, setPage] = useState(1);
  const [busy, setBusy] = useState(() => new Set());
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const filtered = q
    ? requests.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.borrower.toLowerCase().includes(q) ||
          r.borrowerEmail.toLowerCase().includes(q)
      )
    : requests;
  const pages = Math.max(1, Math.ceil(filtered.length / ROWS_PER_PAGE));
  const cur = Math.min(page, pages);
  const shown = filtered.slice((cur - 1) * ROWS_PER_PAGE, cur * ROWS_PER_PAGE);

  const decide = async (r, approve, reason) => {
    if (busy.has(r.id)) return;
    setBusy((s) => new Set(s).add(r.id));
    await onDecide(r, approve, reason);
    setBusy((s) => { const n = new Set(s); n.delete(r.id); return n; });
    setConfirm(null);
  };

  return (
    <section className="mb-10">
      <h2 className="mb-1 text-xl font-bold">Borrow Requests</h2>
      <p className="mb-4 text-[13px] text-gray-500">
        {requests.length === 0
          ? "No requests waiting for approval."
          : q
          ? `${filtered.length} of ${requests.length} requests match`
          : `${requests.length} ${requests.length === 1 ? "request" : "requests"} waiting for approval`}
      </p>

      {requests.length > 0 && (
        <SearchInput
          className="mb-3 w-full md:w-80"
          placeholder="Search by book, name, or email"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setPage(1); }}
        />
      )}

      {requests.length === 0 ? (
        <p className="rounded-xl bg-[#faf6f0] p-4 text-sm font-semibold text-[#0c7a43]">You're all caught up.</p>
      ) : filtered.length === 0 ? (
        <p className="p-6 text-center text-gray-500">No requests match your search.</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((r) => {
            const isBusy = busy.has(r.id);
            const book = books.find((b) => b.id === r.bookId);
            return (
              <div key={r.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-[#4a1f1f]/20 bg-white p-3">
                <button
                  type="button"
                  onClick={() => onViewBook(book ?? { id: r.bookId, title: r.title })}
                  aria-label={`View ${r.title}`}
                  className="cursor-pointer rounded-[3px] border-0 bg-transparent p-0 transition hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#eea51c]/60"
                >
                  <Cover colors={r.cover} image={book?.image} />
                </button>
                <button type="button" onClick={() => onViewBorrower(r.borrowerEmail)} aria-label={`View ${r.borrower}`} className="cursor-pointer rounded-full border-0 bg-transparent p-0">
                  <Avatar src={students.find((s) => s.email === r.borrowerEmail)?.avatar} name={r.borrower} className="h-9 w-9" />
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onViewBook(book ?? { id: r.bookId, title: r.title })}
                    className="block cursor-pointer border-0 bg-transparent p-0 text-left font-bold hover:underline"
                  >
                    {r.title}
                  </button>
                  <button type="button" onClick={() => onViewBorrower(r.borrowerEmail)} className="block cursor-pointer border-0 bg-transparent p-0 text-left text-[13px] text-[#0b4a8b] hover:underline">
                    {r.borrower} ({r.borrowerEmail})
                  </button>
                  <span className="block text-xs text-gray-500">Requested {fmt(r.requestedOn)}</span>
                  {book && (
                    <span className={`block text-xs font-semibold ${copiesLeft(book) > 0 ? "text-[#0c7a43]" : "text-[#c0121f]"}`}>
                      {copiesLeft(book)} of {book.totalCopies ?? 1} copies available
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    disabled={isBusy}
                    onClick={() => setConfirm({ request: r, approve: false })}
                    className={btnDecline}
                  >
                    Decline
                  </button>
                  <button disabled={isBusy} onClick={() => setConfirm({ request: r, approve: true })} className={btnApprove}>
                    {isBusy ? "Working..." : "Approve"}
                  </button>
                </div>
              </div>
            );
          })}
          <p className="text-center text-xs text-gray-500">
            Showing {(cur - 1) * ROWS_PER_PAGE + 1}–{(cur - 1) * ROWS_PER_PAGE + shown.length} of {filtered.length}
          </p>
          <Pagination page={cur} totalPages={pages} onChange={setPage} />
        </div>
      )}

      {confirm?.approve && (
        <ApproveModal
          request={confirm.request}
          onCancel={() => setConfirm(null)}
          onConfirm={() => decide(confirm.request, true)}
        />
      )}
      {confirm && !confirm.approve && (
        <DeclineModal
          request={confirm.request}
          onCancel={() => setConfirm(null)}
          onConfirm={(reason) => decide(confirm.request, false, reason)}
        />
      )}
    </section>
  );
}

export default function HomeLibrarian() {
  const [books, setBooks] = useState([]);
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toReturn, setToReturn] = useState(null);
  const [confirmAct, setConfirmAct] = useState(null);
  const ask = (title, message, confirmLabel, run, danger = false) =>
    setConfirmAct({ title, message, confirmLabel, run, danger });
  const [toEdit, setToEdit] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [transactions, setTransactions] = useState([]);
  const [requests, setRequests] = useState([]);
  const [seenNotes, setSeenNotes] = useState(() => new Set());
  const [clearedNotes, setClearedNotes] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("clearedNotes:librarian") || "[]")); }
    catch { return new Set(); }
  });
  const [noteTimes, setNoteTimes] = useState(() => {
    try { return JSON.parse(localStorage.getItem("noteTimes:librarian") || "{}"); }
    catch { return {}; }
  });
  const returning = useRef(new Set());
  const [tab, setTab] = useState("overview");
  const [borrowerView, setBorrowerView] = useState("lookup");
  const [students, setStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [issueCtx, setIssueCtx] = useState(null);
  const [studentEmail, setStudentEmail] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showVerify, setShowVerify] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState("");
  const [bookSort, setBookSort] = useState({ key: "title", dir: "asc" });
  const [bookView, setBookView] = useState(null);
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [subFilter, setSubFilter] = useState("All");

  useEffect(() => {
    setQuery("");
    setStudentQuery("");
    setStudentPage(1);
  }, [tab, borrowerView]);

  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 3500);
  };

  const reload = () => {
    Promise.all([api(), api("", {}, BORROW_API).catch(() => [])])
      .then(([bookData, txData]) => {
        const all = Array.isArray(txData) ? txData : [];
        // pending / declined / cancelled rows are requests, not loans
        const txs = all.filter((t) => t.requestStatus === "approved");
        setRequests(
          all
            .filter((t) => t.requestStatus === "pending")
            .sort((a, b) => String(a.requestedOn).localeCompare(String(b.requestedOn)))
        );
        const out = {};
        txs.forEach((t) => { if (t.status !== "Returned") out[t.bookId] = (out[t.bookId] || 0) + 1; });
        setTransactions(txs);
        setBooks(
          (Array.isArray(bookData) ? bookData : []).map((b) => {
            const total = b.copies ?? 1;
            return { ...b, totalCopies: total, copiesAvailable: Math.max(0, total - (out[b.id] || 0)) };
          })
        );
      })
      .catch((e) => setApiError(e.message))
      .finally(() => setLoading(false));
    api("/borrowers", {}, BORROW_API)
      .then((data) =>
        setStudents(
          (Array.isArray(data) ? data : []).map((s) => ({
            ...s,
            fullName: `${s.firstName} ${s.lastName}`.trim() || s.email,
            phone: s.phone_number || "",
          }))
        )
      )
      .catch(() => {});
  };

  useEffect(() => {
    reload();
    api("/me", {}, AUTH_API).then((d) => setProfile(normUser(d.user))).catch(() => {});
    window.addEventListener("focus", reload);
    const poll = setInterval(reload, 10000);
    return () => {
      window.removeEventListener("focus", reload);
      clearInterval(poll);
    };
  }, []);

  const q = query.trim().toLowerCase();
  const subOptions = [...new Set(
    books
      .filter((b) => categoryFilter === "All" || b.category === categoryFilter)
      .map((b) => b.subcategory)
      .filter(Boolean)
  )].sort();
  const filteredBooks = books.filter(
    (b) =>
      (!q || [b.title, b.author, b.publisher, b.category, b.subcategory].some((f) => (f || "").toLowerCase().includes(q))) &&
      (categoryFilter === "All" || b.category === categoryFilter) &&
      (subFilter === "All" || b.subcategory === subFilter)
  );

  const activeFor = (id) => transactions.filter((t) => t.bookId === id && !isReturned(t)).length;
  const isDup = (f, ignoreId) =>
    books.some((b) => b.id !== ignoreId && b.title.toLowerCase() === f.title.toLowerCase() && b.author.toLowerCase() === f.author.toLowerCase());

  const addBook = async (f) => {
    if (isDup(f)) throw new Error("A book with this title and author already exists.");
    await api("", { method: "POST", body: JSON.stringify(f) });
    reload();
    setApiError("");
    setShowModal(false);
    notify("Book added.");
  };

  const saveEdit = async (f) => {
    const id = toEdit?.id;
    if (!id) return;
    if (isDup(f, id)) throw new Error("A book with this title and author already exists.");
    const borrowed = activeFor(id);
    if (f.copies < borrowed) throw new Error(`${borrowed} copies are currently borrowed. Total copies can't be lower than that.`);
    await api(`/${id}`, { method: "PUT", body: JSON.stringify(f) });
    reload();
    setApiError("");
    setToEdit(null);
    notify("Book updated.");
  };

  const requestDelete = (b) => {
    if (activeFor(b.id) > 0) return notify("This book is currently borrowed and can't be deleted.");
    setToDelete(b);
  };

  const issueBook = async (book, student) => {
    await api("", { method: "POST", body: JSON.stringify({ bookId: book.id, email: student.email }) }, BORROW_API);
    const due = new Date(Date.now() + LOAN_DAYS * 86400000).toISOString().slice(0, 10);
    setIssueCtx(null);
    reload();
    notify(`Issued "${book.title}" to ${student.fullName}. Due ${fmt(due)}.`);
  };

  const returnTx = async (t) => {
    if (returning.current.has(t.id)) return; // ignore double clicks
    returning.current.add(t.id);
    try {
      await api(`/${t.id}/return`, { method: "PUT" }, BORROW_API);
      notify(t.fine > 0 ? `Returned "${t.title}". Fine due: ${peso(t.fine)}.` : `Returned "${t.title}".`);
    } catch (e) { notify(e.message); }
    returning.current.delete(t.id);
    reload();
  };

  const decide = async (r, approve, reason) => {
    try {
      await api(
        `/${r.id}/${approve ? "approve" : "decline"}`,
        { method: "PUT", ...(approve ? {} : { body: JSON.stringify({ reason }) }) },
        BORROW_API
      );
      notify(approve ? `Approved "${r.title}" for ${r.borrower}.` : `Declined the request for "${r.title}".`);
    } catch (e) { notify(e.message); }
    reload();
  };

  const payFine = async (t) => {
    try {
      await api(`/${t.id}/pay`, { method: "PUT" }, BORROW_API);
      reload();
      notify(`Fine of ${peso(t.fine)} marked as paid.`);
    } catch (e) { notify(e.message); }
  };

  const deleteBook = async () => {
    const id = toDelete?.id;
    if (!id) return;
    try {
      await api(`/${id}`, { method: "DELETE" });
      setBooks((prev) => prev.filter((b) => b.id !== id));
      setApiError("");
      notify("Book deleted.");
    } catch (e) {
      setApiError(e.message);
    }
    setToDelete(null);
  };

  const askPay = (t) =>
    ask(
      "Mark Fine as Paid",
      `Mark the fine of ${peso(t.fine)} for "${t.title}" (${t.borrower}) as paid?`,
      "Yes, mark paid",
      () => payFine(t)
    );

  const matchesStatus = (t, f) =>
    f === "All Statuses" ? true
    : f === "Overdue" ? t.overdue
    : f === "Not Returned" ? !isReturned(t)
    : f === "Pending Return" ? t.pendingReturn
    : t.status === f;
  const filteredTx = transactions.filter((t) => matchesStatus(t, statusFilter));
  const txCount = (f) => transactions.filter((t) => matchesStatus(t, f)).length;

  const bookCols = [
    { key: "cover", label: "", render: (r) => <Cover colors={r.cover} image={r.image} size="lg" /> },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (r) => (
        <button
          type="button"
          onClick={() => setBookView(r)}
          className="block min-w-[140px] cursor-pointer border-0 bg-transparent p-0 font-bold hover:underline"
        >
          {r.title}
        </button>
      ),
    },
    { key: "author", label: "Author", sortable: true },
    { key: "publisher", label: "Publisher", sortable: true },
    { key: "category", label: "Category", plain: true },
    { key: "subcategory", label: "Subcategory", plain: true, render: (r) => r.subcategory || "-" },
    { key: "published", label: "Published Date", sortable: true, render: (r) => fmt(r.published) },
    { key: "status", label: "Status", sortable: true, render: (r) => <Badge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <span className="inline-flex items-center gap-2.5">
          <button
            aria-label={`Edit ${r.title}`}
            className="inline-flex cursor-pointer border-0 bg-transparent p-0.5 text-[#1b1b1b] hover:opacity-70"
            onClick={() => setToEdit(r)}
          >
            <EditIcon />
          </button>
          <button
            aria-label={`Delete ${r.title}`}
            className="inline-flex cursor-pointer border-0 bg-transparent p-0.5 text-[#c0121f] hover:opacity-70"
            onClick={() => requestDelete(r)}
          >
            <TrashIcon />
          </button>
          <button
            type="button"
            className={btnIssue}
            disabled={copiesLeft(r) < 1}
            onClick={() => setIssueCtx({ book: r })}
          >
            Issue
          </button>
        </span>
      ),
    },
  ];

  const txCols = [
    { key: "cover", label: "", render: (r) => <Cover colors={r.cover} image={books.find((b) => b.id === r.bookId)?.image} /> },
    {
      key: "title",
      label: "Title",
      sortable: true,
      render: (r) => (
        <button
          type="button"
          onClick={() => setBookView(books.find((b) => b.id === r.bookId) ?? { id: r.bookId, title: r.title })}
          className="cursor-pointer border-0 bg-transparent p-0 font-bold hover:underline"
        >
          {r.title}
        </button>
      ),
    },
    {
      key: "borrower",
      label: "Borrower",
      sortable: true,
      render: (r) => (
        <button
          type="button"
          onClick={() => setStudentEmail(r.borrowerEmail)}
          className="cursor-pointer border-0 bg-transparent p-0 text-[#0b4a8b] hover:underline"
        >
          {r.borrower}
        </button>
      ),
    },
    { key: "borrowedOn", label: "Borrowed On", sortable: true, render: (r) => fmtStamp(r.borrowedAt ?? r.borrowedOn) },
    { key: "due", label: "Due", sortable: true, render: (r) => fmt(r.due) },
    { key: "returned", label: "Return Date", sortable: true, render: (r) => fmt(r.returned) },
    { key: "status", label: "Status", sortable: true, render: (r) => <Badge status={r.status} overdue={r.overdue} /> },
    {
      key: "fine",
      label: "Fine",
      sortable: true,
      render: (r) => (r.fine > 0 ? `${peso(r.fine)} (${r.daysOverdue}d late)${r.finePaid ? " · PAID" : ""}` : "-"),
    },
    { key: "actions", label: "Actions", render: (r) => <TxActions t={r} onReturn={setToReturn} onPayFine={askPay} /> },
  ];

  const noteKey = (n) => `${n.title}|${n.sub}`;
  const notes = buildNotifications(transactions, books, requests).filter((n) => !clearedNotes.has(noteKey(n)));
  const clearNotes = () => {
    const next = new Set([...clearedNotes, ...notes.map(noteKey)]);
    try { localStorage.setItem("clearedNotes:librarian", JSON.stringify([...next])); } catch { /* storage unavailable */ }
    setClearedNotes(next);
  };
  const unseen = notes.filter((n) => !seenNotes.has(noteKey(n))).length;
  const openNotes = () => {
    setSeenNotes((s) => new Set([...s, ...notes.map(noteKey)]));
    setShowNotes(true);
  };
  const overdueTotal = transactions.filter((t) => t.overdue).length;

  const noteSig = notes.map(noteKey).join("\n");
  useEffect(() => {
    const missing = notes.filter((n) => !noteTimes[noteKey(n)]);
    if (!missing.length) return;
    const now = new Date().toISOString();
    setNoteTimes((prev) => {
      const next = { ...prev };
      missing.forEach((n) => { next[noteKey(n)] = next[noteKey(n)] || now; });
      try { localStorage.setItem("noteTimes:librarian", JSON.stringify(next)); } catch { /* storage unavailable */ }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [noteSig]);

  const sq = studentQuery.trim().toLowerCase();
  const foundStudents = students.filter(
    (s) => !sq || s.fullName.toLowerCase().includes(sq) || s.email.toLowerCase().includes(sq) || (s.phone || "").includes(sq)
  );
  const sPages = Math.max(1, Math.ceil(foundStudents.length / ROWS_PER_PAGE));
  const sCur = Math.min(studentPage, sPages);
  const shownStudents = foundStudents.slice((sCur - 1) * ROWS_PER_PAGE, sCur * ROWS_PER_PAGE);
  const openStudent = students.find((s) => s.email === studentEmail);

  const goStat = (label) => {
    if (label === "Total Book Copies") setTab("books");
    else if (label === "Available Copies") { setBookSort({ key: "status", dir: "asc" }); setTab("books"); }
    else if (label === "Pending Requests") setTab("requests");
    else {
      setTab("borrowers");
      setBorrowerView("transactions");
      setStatusFilter(label === "Overdue Books" ? "Overdue" : "Not Returned");
    }
  };

  const onAction = (k) => {
    if (k === "issue") setIssueCtx({});
    else if (k === "requests") setTab("requests");
    else if (k === "analytics") setTab("analytics");
    else if (k === "catalog") { setBookSort({ key: "title", dir: "asc" }); setTab("books"); }
    else if (k === "returns") setShowVerify(true);
    else if (k === "history" || k === "overdue") {
      setTab("borrowers");
      setBorrowerView("transactions");
      setStatusFilter(k === "overdue" ? "Overdue" : "All Statuses");
    }
    else { setTab("borrowers"); setBorrowerView("lookup"); }
  };

  const chip = (active, danger) =>
    `cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${
      active ? (danger ? "border-[#c0121f] bg-[#c0121f] text-white" : "border-[#4a1f1f] bg-[#4a1f1f] text-white")
             : (danger ? "border-[#c0121f] bg-white text-[#c0121f]" : "border-[#4a1f1f] bg-white text-[#4a1f1f]")}`;

  return (
    <div className="flex min-h-screen flex-col bg-white font-sans text-[#1b1b1b]">
      <Navbar role="librarian" notificationCount={unseen} onNotifications={openNotes} />

      <main className="mx-auto w-full max-w-[1100px] flex-1 px-4 py-6 sm:px-6 lg:py-8">
        {tab === "overview" && (
          <div className="mb-5 flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#4a1f1f] md:text-3xl">
                {greeting()}, {profile?.firstName?.trim() || "Librarian"}
              </h1>
              <p className="mt-0.5 text-sm text-gray-500">
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            </div>
          </div>
        )}

        <nav className="sticky top-[80px] z-30 mb-6 flex gap-1 overflow-x-auto overflow-y-hidden rounded-xl border border-[#4a1f1f]/15 bg-white/95 px-2 shadow-sm backdrop-blur" aria-label="Sections">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => { if (k === "books") setBookSort({ key: "title", dir: "asc" }); setTab(k); }}
              className={`cursor-pointer whitespace-nowrap border-0 border-b-2 bg-transparent px-4 py-3 text-sm font-semibold transition-colors ${
                tab === k ? "border-[#eea51c] text-[#4a1f1f]" : "border-transparent text-gray-500 hover:text-[#4a1f1f]"
              }`}
            >
              {label}
              {k === "requests" && requests.length > 0 && (
                <span className="ml-1.5 rounded-full bg-[#eea51c] px-1.5 text-[11px] font-bold text-white">{requests.length}</span>
              )}
              {k === "borrowers" && overdueTotal > 0 && (
                <span className="ml-1.5 rounded-full bg-[#c0121f] px-1.5 text-[11px] font-bold text-white">{overdueTotal}</span>
              )}
            </button>
          ))}
        </nav>

        {apiError && (
          <p className="mb-4 rounded-md bg-[#ffe5e5] px-3 py-2 text-[13px] font-semibold text-[#c0121f]" role="alert">
            {apiError}
          </p>
        )}

        {tab === "overview" && (
          <Overview books={books} transactions={transactions} requests={requests} onAction={onAction} onStat={goStat} />
        )}

        {tab === "requests" && <RequestsTab requests={requests} books={books} students={students} onDecide={decide} onViewBorrower={setStudentEmail} onViewBook={setBookView} />}

        {tab === "analytics" && <Analytics books={books} transactions={transactions} students={students} />}

        {tab === "books" && (
          <section className="mb-10">
            <h2 className="mb-0.5 text-xl font-bold">Book Catalog</h2>
            <p className="mb-2 text-[13px] text-gray-500">
              {filteredBooks.length} {filteredBooks.length === 1 ? "title" : "titles"} in the catalog
            </p>
            <SortableTable
              key={`${bookSort.key}-${bookSort.dir}`}
              columns={[
                ...bookCols.slice(0, -2),
                { key: "copies", label: "Copies", plain: true, render: (r) => `${copiesLeft(r)} of ${r.totalCopies ?? 1}` },
                ...bookCols.slice(-2),
              ]}
              rows={filteredBooks}
              resetKey={`${query}|${categoryFilter}|${subFilter}`}
              defaultSort={bookSort}
              filters={
                <>
                  <select
                    className={`${selectSm} max-w-[130px]`}
                    aria-label="Filter by category"
                    value={categoryFilter}
                    onChange={(e) => { setCategoryFilter(e.target.value); setSubFilter("All"); }}
                  >
                    <option value="All">All Categories</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <select
                    className={`${selectSm} max-w-[130px]`}
                    aria-label="Filter by subcategory"
                    value={subFilter}
                    onChange={(e) => setSubFilter(e.target.value)}
                  >
                    <option value="All">All Subcategories</option>
                    {subOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </>
              }
              toolbar={
                <div className="ml-auto flex flex-wrap items-center justify-end gap-2">
                  <SearchInput
                    className="w-full sm:w-48"
                    placeholder="Search books"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                  />
                  <button className={btnImport} onClick={() => setShowImport(true)}>Bulk Import</button>
                  <button className={btnAdd} onClick={() => setShowModal(true)}>+ Add Book</button>
                </div>
              }
              emptyText={loading ? "Loading books..." : books.length === 0 ? "No books yet. Select + Add Book to add one." : undefined}
            />
          </section>
        )}

        {tab === "borrowers" && (
          <section className="mb-10">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-[#4a1f1f]/15">
              <div className="flex gap-1">
                {[["lookup", "Lookup"], ["transactions", "Transactions"]].map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setBorrowerView(k)}
                    className={`-mb-px cursor-pointer whitespace-nowrap border-0 border-b-2 bg-transparent px-4 py-3 text-sm font-semibold transition-colors ${
                      borrowerView === k ? "border-[#eea51c] text-[#4a1f1f]" : "border-transparent text-gray-500 hover:text-[#4a1f1f]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {borrowerView === "lookup" && (
                <SearchInput
                  className="mb-2 w-full sm:w-72"
                  placeholder="Search by name, email, or phone"
                  value={studentQuery}
                  onChange={(e) => { setStudentQuery(e.target.value); setStudentPage(1); }}
                />
              )}
            </div>

            {borrowerView === "lookup" && (
              <>

                {foundStudents.length === 0 ? (
                  <p className="p-6 text-center text-gray-500">No students found.</p>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {shownStudents.map((s) => {
                      const active = transactions.filter((t) => t.borrowerEmail === s.email && !isReturned(t));
                      const od = active.filter((t) => t.overdue).length;
                      return (
                        <button
                          key={s.email}
                          onClick={() => setStudentEmail(s.email)}
                          className="flex cursor-pointer items-center gap-3 rounded-xl border border-[#4a1f1f]/20 bg-white p-3 text-left hover:bg-[#faf6f0]"
                        >
                          <Avatar src={s.avatar} name={s.fullName} />
                          <span className="min-w-0 flex-1">
                            <strong className="block">{s.fullName}</strong>
                            <span className="block truncate text-xs text-gray-600">{s.email}</span>
                            <span className="block text-xs text-gray-600">{s.phone}</span>
                          </span>
                          <span className="flex flex-col items-end gap-1">
                            <span className={`rounded-full ${loanTone(active.length)} px-2.5 py-[3px] text-[11px] font-bold text-white`}>{active.length}/{MAX_LOANS} books</span>
                            {od > 0 && <span className="rounded-full bg-[#c0121f] px-2.5 py-[3px] text-[11px] font-bold text-white">{od} overdue</span>}
                          </span>
                        </button>
                      );
                    })}
                    <p className="text-center text-xs text-gray-500">
                      Showing {(sCur - 1) * ROWS_PER_PAGE + 1}–{(sCur - 1) * ROWS_PER_PAGE + shownStudents.length} of {foundStudents.length}
                    </p>
                    <Pagination page={sCur} totalPages={sPages} onChange={setStudentPage} />
                  </div>
                )}
              </>
            )}

            {borrowerView === "transactions" && (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {["All Statuses", "Not Returned", "Pending Return", "Overdue", "Returned"].map((f) => (
                    <button key={f} className={chip(statusFilter === f, f === "Overdue")} onClick={() => setStatusFilter(f)}>
                      {f === "All Statuses" ? "All" : f} ({txCount(f)})
                    </button>
                  ))}
                  <button className={`${btnPrimary} relative ml-auto py-1.5`} onClick={() => setShowVerify(true)}>
                    Verify Return
                    {txCount("Pending Return") > 0 && (
                      <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#c0121f] px-1 text-[11px] font-bold text-white ring-2 ring-white">
                        {txCount("Pending Return")}
                      </span>
                    )}
                  </button>
                </div>
                <SortableTable
                  columns={txCols}
                  rows={filteredTx}
                  resetKey={statusFilter}
                  defaultSort={{ key: "borrowedOn", dir: "desc" }}
                  emptyText={transactions.length === 0 ? "No transactions yet." : undefined}
                />
              </>
            )}
          </section>
        )}
      </main>

      <Footer
        onNavigate={(k) => {
          if (k === "books") setBookSort({ key: "title", dir: "asc" });
          setTab(k);
          window.scrollTo({ top: 0 });
        }}
      />

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-[#1b1b1b] px-5 py-3 text-sm font-medium text-white shadow-2xl ring-1 ring-white/10" role="status">
          {toast}
        </div>
      )}

      {showModal && <BookFormModal books={books} ask={ask} onClose={() => setShowModal(false)} onSave={addBook} />}
      {toEdit && <BookFormModal key={toEdit.id} book={toEdit} books={books} ask={ask} onClose={() => setToEdit(null)} onSave={saveEdit} />}
      {toDelete && <ConfirmDeleteModal book={toDelete} onCancel={() => setToDelete(null)} onConfirm={deleteBook} />}
      {openStudent && (
        <StudentModal
          student={openStudent}
          transactions={transactions}
          books={books}
          onClose={() => setStudentEmail(null)}
          onIssue={(s) => setIssueCtx({ student: s })}
          onReturn={setToReturn}
          onPayFine={askPay}
        />
      )}
      {issueCtx && (
        <IssueModal
          students={students}
          books={books}
          transactions={transactions}
          initial={issueCtx}
          onClose={() => setIssueCtx(null)}
          onIssue={issueBook}
        />
      )}
      {showImport && (
        <ImportModal
          books={books}
          activeFor={activeFor}
          ask={ask}
          onClose={() => setShowImport(false)}
          onDone={(msg) => { setShowImport(false); reload(); notify(msg); }}
        />
      )}
      {bookView && <BookDetailModal book={bookView} onClose={() => setBookView(null)} />}
      {showNotes && <NotificationsModal notes={notes} books={books} times={noteTimes} onClear={clearNotes} onClose={() => setShowNotes(false)} />}
      {showVerify && (
        <VerifyReturnModal
          books={books}
          onClose={() => setShowVerify(false)}
          onDone={(tx) => {
            reload();
            notify(`Return verified: "${tx.title}"${tx.fine > 0 ? `. Fine due: ${peso(tx.fine)}` : ""}.`);
          }}
        />
      )}
      {toReturn && (
        <ReturnModal
          tx={toReturn}
          book={books.find((b) => b.id === toReturn.bookId)}
          onCancel={() => setToReturn(null)}
          onConfirm={async () => { await returnTx(toReturn); setToReturn(null); }}
        />
      )}
      {confirmAct && <ConfirmModal {...confirmAct} onCancel={() => setConfirmAct(null)} />}
    </div>
  );
}