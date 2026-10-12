import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, BookMarked, ChevronRight, Scroll, GraduationCap, Skull, X, Search, CheckCircle2, Clock, ArrowUpDown } from "lucide-react";
import Navbar from "../components/Navbar";
import crest from "../assets/crest.webp";
import bg from "../assets/bg.webp";
import { useLocation } from "react-router-dom";

const API = "http://localhost:5001/api/books";

const api = async (path = "", options = {}) => {
  const res = await fetch(`${API}${path}`, {
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

const categories = [
  { slug: "fiction", label: "Fiction", tagline: "Stories beyond the curriculum.", icon: BookOpen, color: "#e99b1c" },
  { slug: "non-fiction", label: "Non-Fiction", tagline: "Real magic, real history.", icon: Scroll, color: "#c0151f" },
  { slug: "academic", label: "Academic", tagline: "The books behind every lesson.", icon: GraduationCap, color: "#0e3f8a" },
  { slug: "restricted", label: "Restricted", tagline: "Forbidden knowledge. Read at your own risk.", icon: Skull, color: "#0a7a46" },
];

const toStudentBook = (b) => ({
  id: b.id,
  title: b.title,
  author: b.author,
  category: (b.category || "").toLowerCase(),
  released: b.published,
  cover: b.image || undefined,
  description: b.description,
  status: b.status,
});

const parse = (d) => new Date(`${d}T00:00:00`);
const fmt = (d, day = "numeric") =>
  parse(d).toLocaleDateString("en-US", { month: "long", day, year: "numeric" });

function Cover({ title, src, className = "" }) {
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt={`${title} cover`}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={`object-cover ${className}`}
      />
    );
  }
  const hue = [...title].reduce((n, ch) => n + ch.charCodeAt(0), 0) % 360;
  return (
    <div
      className={`flex items-center justify-center p-1 text-center font-serif text-[10px] leading-tight text-white ${className}`}
      style={{ background: `linear-gradient(160deg, hsl(${hue} 45% 32%), hsl(${(hue + 40) % 360} 50% 14%))` }}
    >
      {title}
    </div>
  );
}

function BookCard({ book, onBorrow, onView }) {
  const available = book.status === "Available";
  return (
    <article className="group flex flex-col rounded-xl bg-white p-2.5 shadow-sm ring-1 ring-black/5 transition duration-200 hover:-translate-y-1 hover:shadow-xl">
      <button
        type="button"
        onClick={() => onView?.(book)}
        aria-label={`View ${book.title}`}
        className="relative block overflow-hidden rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#4a1a1f]"
      >
        <Cover
          title={book.title}
          src={book.cover}
          className="aspect-[2/3] w-full rounded-lg transition duration-300 group-hover:scale-105"
        />
        <span
          className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold text-white shadow ${
            available ? "bg-[#0a7a46]" : "bg-[#e99b1c]"
          }`}
        >
          {available ? <CheckCircle2 size={10} /> : <Clock size={10} />}
          {available ? "Available" : "On hold"}
        </span>
      </button>
      <h3 className="mt-3 line-clamp-1 text-sm font-bold leading-tight">
        <button type="button" onClick={() => onView?.(book)} className="text-left hover:underline">
          {book.title}
        </button>
      </h3>
      <p className="line-clamp-1 text-xs text-gray-500">{book.author}</p>
      <button
        type="button"
        onClick={() => onBorrow?.(book)}
        disabled={!available}
        className="mt-3 flex items-center justify-center gap-1 rounded-full bg-[#4a1a1f] py-1.5 text-xs font-semibold text-white transition hover:brightness-125 disabled:cursor-not-allowed disabled:bg-gray-300"
      >
        Borrow <ArrowRight size={12} />
      </button>
    </article>
  );
}

function Footer({ onOpenCategory }) {
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
          {categories.map((c) => (
            <li key={c.slug}>
              <button type="button" onClick={() => onOpenCategory(c.slug)} className="hover:underline">
                {c.label}
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

function BookModal({ book, mode, alreadyBorrowed, onClose, onConfirm }) {
  const category = categories.find((c) => c.slug === book.category);
  const available = book.status === "Available";
  const accent = category?.color ?? "#4a1a1f";
  const canBorrow = available && !alreadyBorrowed;

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <style>{`@keyframes modal-pop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}`}</style>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-modal-title"
        style={{ animation: "modal-pop .2s ease-out" }}
        className="relative w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 rounded-full bg-black/5 p-2 text-gray-700 transition hover:bg-black/10"
        >
          <X size={18} />
        </button>

        <div className="grid md:grid-cols-[280px_1fr]">
          <div
            className="flex items-center justify-center p-8"
            style={{ background: `linear-gradient(160deg, ${accent}22, ${accent}66)` }}
          >
            <Cover
              title={book.title}
              src={book.cover}
              className="aspect-[2/3] w-40 rounded-xl shadow-2xl ring-1 ring-black/10 md:w-full md:max-w-[200px]"
            />
          </div>

          <div className="flex max-h-[80vh] flex-col overflow-y-auto p-8">
            <div className="flex flex-wrap items-center gap-2">
              {category && (
                <span
                  className="rounded-full px-3 py-1 text-xs font-bold text-white"
                  style={{ backgroundColor: category.color }}
                >
                  {category.label}
                </span>
              )}
              <span
                className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${
                  available ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                }`}
              >
                {available ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                {available ? "Available" : "On hold"}
              </span>
            </div>

            <h3 id="book-modal-title" className="mt-4 pr-8 font-serif text-3xl font-bold leading-tight text-[#2b0f12]">
              {book.title}
            </h3>
            <p className="mt-1 text-base text-gray-500">by {book.author}</p>

            <dl className="mt-6 grid grid-cols-2 gap-4 rounded-2xl bg-gray-50 p-4 text-sm">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Released</dt>
                <dd className="mt-0.5 font-semibold">{book.released ? fmt(book.released) : "Unknown"}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Category</dt>
                <dd className="mt-0.5 font-semibold">{category?.label ?? "Uncategorized"}</dd>
              </div>
            </dl>

            <div className="mt-6">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-gray-400">About this book</h4>
              <p className="mt-2 text-sm leading-relaxed text-gray-700">
                {book.description || "No description available yet."}
              </p>
            </div>

            <div className="mt-auto pt-8">
              {alreadyBorrowed && (
                <p className="mb-3 text-sm font-semibold text-red-700">You already borrowed this book.</p>
              )}
              {!available && !alreadyBorrowed && (
                <p className="mb-3 text-sm font-semibold text-amber-700">
                  This book is currently on hold.
                </p>
              )}
              <div className="flex flex-wrap gap-3">
                {canBorrow && (
                  <button
                    type="button"
                    onClick={() => onConfirm(book)}
                    className="inline-flex items-center gap-2 rounded-full bg-[#4a1a1f] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-125"
                  >
                    {mode === "borrow" ? "Confirm borrow" : "Borrow this book"} <ArrowRight size={14} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                >
                  {mode === "borrow" ? "Cancel" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const PAGE_SIZE = 10;
const HOME_PAGE_SIZE = 5;

function usePagination(list, size = PAGE_SIZE) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(list.length / size));
  const current = Math.min(page, totalPages);
  const items = list.slice((current - 1) * size, current * size);
  return { items, page: current, totalPages, setPage };
}

const pageNumbers = (page, total) => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const shown = [...new Set([1, total, page - 1, page, page + 1])]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);
  return shown.flatMap((p, i) => (i > 0 && p - shown[i - 1] > 1 ? ["…", p] : [p]));
};

function Pagination({ page, totalPages, onChange }) {
  if (totalPages <= 1) return null;

  const base = "min-w-9 rounded border px-3 py-1.5 text-sm";
  const idle = "border-gray-400 bg-white hover:bg-gray-100";

  return (
    <nav aria-label="Pagination" className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
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

const SORTS = [
  { value: "title", label: "Title A–Z" },
  { value: "author", label: "Author A–Z" },
  { value: "newest", label: "Newest first" },
];

const sortBooks = (list, sort) => {
  const copy = [...list];
  if (sort === "title") return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (sort === "author") return copy.sort((a, b) => a.author.localeCompare(b.author));
  return copy.sort((a, b) => (b.released || "").localeCompare(a.released || ""));
};

function Shelf({ title, books, tint, onView, onSeeAll }) {
  if (books.length === 0) return null;
  return (
    <section className="w-full px-[7%] pt-12">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-3 text-sm font-bold uppercase tracking-[0.15em] text-[#2b0f12]">
          {tint && <span className="h-4 w-1 rounded-full" style={{ backgroundColor: tint }} />}
          {title}
        </h2>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-gray-500 transition hover:text-[#4a1a1f]"
          >
            See all <ChevronRight size={14} />
          </button>
        )}
      </div>

      <div className="-mx-2 mt-5 flex gap-6 overflow-x-auto px-2 pb-4 [scrollbar-width:thin]">
        {books.map((b) => {
          const available = b.status === "Available";
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => onView(b)}
              className="group w-36 shrink-0 text-left"
            >
              <Cover
                title={b.title}
                src={b.cover}
                className="h-52 w-36 rounded-md shadow-lg ring-1 ring-black/5 transition duration-200 group-hover:-translate-y-1.5 group-hover:shadow-2xl"
              />
              <p className="mt-3 line-clamp-1 text-xs font-bold">{b.title}</p>
              <p className="line-clamp-1 text-[11px] text-gray-500">{b.author}</p>
              <p
                className={`mt-1 inline-flex items-center gap-1.5 text-[11px] font-bold ${
                  available ? "text-[#0a7a46]" : "text-[#c97a2b]"
                }`}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${available ? "bg-[#0a7a46]" : "bg-[#c97a2b]"}`} />
                {available ? "Available" : "On hold"}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}

function Spotlight({ book, more, onView, onBorrow }) {
  if (!book) return null;
  const available = book.status === "Available";
  return (
    <section className="mt-14 bg-[#fbf6ee] px-[7%] py-14">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_auto_1fr]">
        <div className="lg:text-right">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[#c97a2b]">Featured this week</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight text-[#2b0f12] lg:text-5xl">{book.title}</h2>
          <p className="mt-2 text-gray-500">by {book.author}</p>
          <p className="mt-4 line-clamp-4 text-sm leading-relaxed text-gray-700 lg:ml-auto lg:max-w-sm">
            {book.description}
          </p>
          <div className="mt-6 flex flex-wrap gap-3 lg:justify-end">
            {available && (
              <button
                type="button"
                onClick={() => onBorrow(book)}
                className="inline-flex items-center gap-2 rounded-full bg-[#4a1a1f] px-6 py-2.5 text-sm font-semibold text-white shadow-md transition hover:brightness-125"
              >
                Borrow <ArrowRight size={14} />
              </button>
            )}
            <button
              type="button"
              onClick={() => onView(book)}
              className="rounded-full border border-[#4a1a1f]/30 bg-white px-6 py-2.5 text-sm font-semibold text-[#4a1a1f] transition hover:bg-[#4a1a1f]/5"
            >
              View details
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => onView(book)}
          aria-label={`View ${book.title}`}
          className="group relative mx-auto"
        >
          <span className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#e9c27a]/40" />
          <Cover
            title={book.title}
            src={book.cover}
            className="relative h-80 w-56 rounded-lg shadow-2xl ring-1 ring-black/10 transition duration-300 group-hover:-translate-y-1.5"
          />
        </button>

        <div>
          {more.length > 0 && (
            <>
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Also new</p>
              <div className="mt-4 flex gap-4 overflow-x-auto pb-2">
                {more.map((b) => (
                  <button key={b.id} type="button" onClick={() => onView(b)} className="group w-24 shrink-0 text-left">
                    <Cover
                      title={b.title}
                      src={b.cover}
                      className="h-36 w-24 rounded-md shadow-md transition group-hover:-translate-y-1"
                    />
                    <p className="mt-2 line-clamp-2 text-xs font-bold leading-tight">{b.title}</p>
                    <p className="line-clamp-1 text-[11px] text-gray-500">{b.author}</p>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function PromoBanner({ onAction }) {
  return (
    <section className="px-[7%] py-12">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#2b0f12] via-[#4a1a1f] to-[#7a2b32] px-8 py-10 text-[#fdf0e0] shadow-xl sm:px-12">
        <BookMarked size={200} className="pointer-events-none absolute -right-8 -top-8 rotate-12 text-[#e9c27a]/15" />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="font-serif text-3xl sm:text-4xl">
              Borrow any available book for <span className="text-[#e9c27a]">7 days</span>.
            </h2>
            <p className="mt-2 text-sm opacity-80">Return on time and keep your record clean. Mischief managed.</p>
          </div>
          <button
            type="button"
            onClick={onAction}
            className="inline-flex items-center gap-2 rounded-full bg-[#c97a2b] px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:brightness-110"
          >
            View my books <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function HomeView({ books, loading, borrowedCount, onOpenCategory, onOpenBorrowed, onView, onBorrow }) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sort, setSort] = useState("title");

  const hasFilters = query.trim() !== "" || category !== "all" || availableOnly;

  const countOf = (slug) =>
    slug === "all" ? books.length : books.filter((b) => b.category === slug).length;

  const results = sortBooks(
    books.filter((b) => {
      if (category !== "all" && b.category !== category) return false;
      if (availableOnly && b.status !== "Available") return false;
      const q = query.trim().toLowerCase();
      if (!q) return true;
      return [b.title, b.author, b.category, b.description]
        .some((f) => (f || "").toLowerCase().includes(q));
    }),
    sort
  );

  const newArrivals = sortBooks(books.filter((b) => b.status === "Available"), "newest").slice(0, 10);

  const spotlight = newArrivals.find((b) => b.description) ?? newArrivals[0];
  const spotlightMore = newArrivals.filter((b) => b.id !== spotlight?.id).slice(0, 3);
  const shelves = categories
    .map((c) => ({ ...c, list: books.filter((b) => b.category === c.slug).slice(0, 10) }))
    .filter((s) => s.list.length > 0);
  const heading = query.trim()
    ? "Search results"
    : category !== "all"
    ? categories.find((c) => c.slug === category)?.label
    : "All books";

  const { items, page, totalPages, setPage } = usePagination(results);

  useEffect(() => {
    setPage(1);
  }, [query, category, availableOnly, sort, setPage]);

  const changePage = (p) => {
    setPage(p);
    document.getElementById("all-books")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setAvailableOnly(false);
  };

  // const chip = (active, color = "#4a1a1f") => ({
  //   className: `rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
  //     active ? "text-white shadow" : "bg-white hover:bg-gray-50"
  //   }`,
  //   style: { borderColor: color, color: active ? "#fff" : color, backgroundColor: active ? color : undefined },
  // });

  return (
    <>
      <section
        className="relative flex min-h-[420px] items-center bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/20" />
        <div className="relative w-full px-[7%] py-16 text-[#fdf0e0]">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[#e9c27a]">Hogwarts Library</p>
          <h1 className="mt-3 max-w-[12em] font-serif text-[clamp(2.25rem,5vw,4.5rem)] leading-[1.08]">
            Knowledge is the truest magic.
          </h1>
          <p className="mt-3 max-w-xl font-serif text-[clamp(0.95rem,1.5vw,1.3rem)] opacity-90">
            Where every book holds a lesson, and every lesson holds power.
          </p>

          <div className="mt-8 flex max-w-2xl items-center gap-3 rounded-full bg-white/95 px-5 py-3 text-gray-800 shadow-xl backdrop-blur focus-within:ring-4 focus-within:ring-[#e9c27a]/60">
            <Search size={20} className="shrink-0 text-[#4a1a1f]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search titles, authors, or topics"
              className="w-full bg-transparent text-base outline-none placeholder:text-gray-500"
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear search">
                <X size={18} className="text-[#4a1a1f]" />
              </button>
            )}
          </div>
        </div>
      </section>

            <section className="sticky top-0 z-30 flex items-stretch border-b border-[#e8dcc8] bg-[#fbf6ee]/95 backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto pl-[7%] pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ slug: "all", label: "All" }, ...categories].map(({ slug, label }) => {
            const active = category === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => setCategory(slug)}
                aria-pressed={active}
                className={`relative shrink-0 px-4 py-4 text-sm font-semibold transition ${
                  active ? "text-[#4a1a1f]" : "text-gray-600 hover:text-[#4a1a1f]"
                }`}
              >
                {label}
                <span className="ml-1.5 text-xs font-normal text-gray-400">{countOf(slug)}</span>
                <span
                  className={`absolute inset-x-3 bottom-0 h-0.5 rounded-full ${
                    active ? "bg-[#c97a2b]" : "bg-transparent"
                  }`}
                />
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenBorrowed}
          className="flex shrink-0 items-center gap-2 bg-[#c97a2b] px-5 text-sm font-semibold text-white transition hover:brightness-110 sm:px-[4%]"
        >
          <span className="hidden sm:inline">My books</span>
        </button>
      </section>

      {!hasFilters && !loading && (
        <>
          <Shelf title="New arrivals" books={newArrivals} onView={onView} />
          <Spotlight book={spotlight} more={spotlightMore} onView={onView} onBorrow={onBorrow} />
          {shelves.map((s) => (
            <Shelf
              key={s.slug}
              title={s.label}
              tint={s.color}
              books={s.list}
              onView={onView}
              onSeeAll={() => onOpenCategory(s.slug)}
            />
          ))}
          <PromoBanner onAction={onOpenBorrowed} />
        </>
      )}

      <section id="all-books" className="w-full scroll-mt-20 px-[7%] pb-16 pt-12">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-[0.15em] text-[#2b0f12]">{heading}</h2>
            <p className="mt-1 text-xs text-gray-500">
              {results.length} {results.length === 1 ? "book" : "books"}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              role="switch"
              aria-checked={availableOnly}
              onClick={() => setAvailableOnly((v) => !v)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700"
            >
              <span className={`relative h-6 w-11 rounded-full transition ${availableOnly ? "bg-[#0a7a46]" : "bg-gray-300"}`}>
                <span
                  className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
                    availableOnly ? "left-[22px]" : "left-0.5"
                  }`}
                />
              </span>
              Available only
            </button>

            <label className="flex items-center gap-2 rounded-full border border-gray-300 bg-white px-3 py-1.5 text-sm font-semibold text-gray-700">
              <ArrowUpDown size={14} />
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className="bg-transparent outline-none"
                aria-label="Sort books"
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>

        {loading ? (
          <p className="mt-6 text-gray-500">Loading books...</p>
        ) : results.length === 0 ? (
          <div className="mt-10 flex flex-col items-center gap-3 text-gray-500">
            <Search size={40} className="text-[#4a1a1f]" />
            <p>No books match your search.</p>
            {hasFilters && (
              <button type="button" onClick={clearFilters} className="font-semibold text-[#4a1a1f] hover:underline">
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="mt-6 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {items.map((b) => (
                <BookCard key={b.id} book={b} onView={onView} onBorrow={onBorrow} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={changePage} />
          </>
        )}
      </section>
    </>
  );
}

function CategoryView({ books, loading, slug, onBack, onView, onBorrow }) {
  const category = categories.find((c) => c.slug === slug);
  const list = books.filter((b) => b.category === slug);
  const { items, page, totalPages, setPage } = usePagination(list);

  if (!category) return null;

  const Icon = category.icon;

  const changePage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <header style={{ backgroundColor: category.color }} className="text-white">
        <div className="px-[7%] py-4">
          <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm hover:underline">
            <ArrowLeft size={14} /> Back to Home
          </button>
          <div className="mt-2 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-full border-2 border-white">
              <Icon size={22} />
            </span>
            <div>
              <h1 className="font-serif text-2xl leading-tight">{category.label}</h1>
              <p className="text-sm">{category.tagline}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="w-full flex-1 px-[7%] py-10">
        {loading ? (
          <p className="text-gray-500">Loading books...</p>
        ) : list.length === 0 ? (
          <p className="text-gray-500">No books in this category yet.</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
              {items.map((b) => (
                <BookCard key={b.id} book={b} onView={onView} onBorrow={onBorrow} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={changePage} />
          </>
        )}
      </main>
    </>
  );
}

function TransactionsView({ borrowed, history, onReturn }) {
  const [tab, setTab] = useState("borrowed");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const isOverdue = (due) => parse(due) < today;

  const tabClass = (name) =>
    `border-b-2 px-2 pb-2 text-lg font-bold ${
      tab === name ? "border-[#4a1a1f]" : "border-transparent hover:border-gray-400"
    }`;

  return (
    <main className="w-full flex-1 px-[7%] py-8">
      <div className="flex gap-12 border-b border-gray-400">
        <button type="button" onClick={() => setTab("borrowed")} className={tabClass("borrowed")}>
          Borrowed Books
        </button>
        <button type="button" onClick={() => setTab("history")} className={tabClass("history")}>
          History
        </button>
      </div>

      {tab === "borrowed" ? (
        <ul className="mt-6 space-y-4">
          {borrowed.length === 0 && <li className="text-sm text-gray-500">No borrowed books.</li>}
          {borrowed.map((item) => {
            const overdue = isOverdue(item.due);
            return (
              <li
                key={item.id}
                className={`flex items-center gap-4 rounded-md bg-gray-100 p-3 ${
                  overdue ? "border border-red-600" : "border border-transparent"
                }`}
              >
                <Cover title={item.title} src={item.cover} className="h-14 w-10 shrink-0 rounded-sm" />
                <div className="flex-1">
                  <h3 className="font-bold leading-tight">
                    {item.title} <span className="ml-1 text-[10px] font-normal">{item.author}</span>
                  </h3>
                  <p className="mt-1 text-[11px] font-semibold text-gray-700">Borrowed: {fmt(item.borrowed)}</p>
                  <p className="text-[11px] font-semibold text-gray-700">Due: {fmt(item.due)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onReturn(item)}
                  className={`rounded px-6 py-1 text-xs font-semibold ${
                    overdue
                      ? "bg-red-700 text-white hover:bg-red-800"
                      : "border border-gray-500 bg-white hover:bg-gray-100"
                  }`}
                >
                  Return
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="mt-6 min-h-[420px] overflow-x-auto rounded-md border border-gray-400">
          <table className="w-full min-w-[640px] text-center text-xs">
            <thead>
              <tr className="border-b border-gray-400">
                <th className="w-16 p-3" />
                {["Title", "Author", "Category", "Borrowed Date", "Returned Date", "Status"].map((h) => (
                  <th key={h} className="p-3 font-bold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {history.length === 0 && (
                <tr><td colSpan={7} className="p-6 text-gray-500">No history yet.</td></tr>
              )}
              {history.map((item) => (
                <tr key={item.id} className="border-b border-gray-300 font-semibold">
                  <td className="p-3">
                    <Cover title={item.title} src={item.cover} className="mx-auto h-14 w-10 rounded-sm" />
                  </td>
                  <td className="p-3">{item.title}</td>
                  <td className="p-3">{item.author}</td>
                  <td className="p-3">{item.category}</td>
                  <td className="p-3">{fmt(item.borrowed, "2-digit")}</td>
                  <td className="p-3">{fmt(item.returned, "2-digit")}</td>
                  <td className="p-3">
                    <span className="rounded-full bg-emerald-600 px-3 py-0.5 text-[10px] text-white">Returned</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}

export default function HomeStudent() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [borrowed, setBorrowed] = useState([]);
  const [history, setHistory] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  const location = useLocation();
  const [view, setView] = useState({
    page: location.state?.page ?? "home",
    slug: null,
  });

  useEffect(() => {
    api()
      .then((data) => setBooks(Array.isArray(data) ? data.map(toStudentBook) : []))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (page, slug = null) => {
    setView({ page, slug });
    window.scrollTo({ top: 0 });
  };

  const openView = (book) => setModal({ mode: "view", book });
  const openBorrow = (book) => setModal({ mode: "borrow", book });
  const closeModal = () => setModal(null);

  const iso = (d) => d.toLocaleDateString("en-CA");

  const confirmBorrow = (book) => {
    const due = new Date();
    due.setDate(due.getDate() + 7);
    setBorrowed((list) => [
      {
        id: Date.now(),
        bookId: book.id,
        title: book.title,
        author: book.author,
        category: categories.find((c) => c.slug === book.category)?.label ?? "",
        cover: book.cover,
        borrowed: iso(new Date()),
        due: iso(due),
      },
      ...list,
    ]);
    closeModal();
    setToast(`You borrowed "${book.title}". Due ${fmt(iso(due))}.`);
  };

  const handleReturn = (item) => {
    setBorrowed((list) => list.filter((b) => b.id !== item.id));
    setHistory((list) => [{ ...item, returned: iso(new Date()) }, ...list]);
  };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      <Navbar
        active={view.page === "transactions" ? "transactions" : "home"}
        onNavigate={(page) => go(page)}
      />

      {loadError && (
        <p className="bg-[#ffe5e5] px-[7%] py-2 text-sm font-semibold text-[#c0121f]" role="alert">
          {loadError}
        </p>
      )}

      {view.page === "home" && (
        <HomeView
          books={books}
          loading={loading}
          onOpenCategory={(slug) => go("category", slug)}
          onView={openView}
          onBorrow={openBorrow}
        />
      )}
      {view.page === "category" && (
        <CategoryView
          key={view.slug}
          books={books}
          loading={loading}
          slug={view.slug}
          onBack={() => go("home")}
          onView={openView}
          onBorrow={openBorrow}
        />
      )}
      {view.page === "transactions" && (
        <TransactionsView borrowed={borrowed} history={history} onReturn={handleReturn} />
      )}

      {view.page !== "transactions" && <Footer onOpenCategory={(slug) => go("category", slug)} />}

      {modal && (
        <BookModal
          book={modal.book}
          mode={modal.mode}
          alreadyBorrowed={borrowed.some((b) => b.bookId === modal.book.id)}
          onClose={closeModal}
          onConfirm={confirmBorrow}
        />
      )}

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded bg-[#4a1a1f] px-5 py-3 text-sm text-white shadow-lg"
        >
          {toast}
        </div>
      )}
    </div>
  );
}