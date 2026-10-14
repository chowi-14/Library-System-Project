import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, BookMarked, ChevronRight, Scroll, GraduationCap, Skull, X, Search, CheckCircle2, Clock, ArrowUpDown, Heart } from "lucide-react";
import Navbar from "../components/Navbar";
import Cover from "../components/Cover";
import BorrowerTransactions from "./BorrowerTransactions";
import { fmt } from "../utils/dates";
import crest from "../assets/crest.webp";
import bg from "../assets/bg.webp";
import { useLocation, useNavigate } from "react-router-dom";

const API = "http://localhost:5001/api/books";

const BORROW_API = "http://localhost:5001/api/borrowings";

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
  subcategory: b.subcategory || "",
  released: b.published,
  cover: b.image || undefined,
  description: b.description,
  status: b.status,
});


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

function BookModal({ book, mode, alreadyBorrowed, alreadyRequested, isFavorite, onToggleFavorite, onClose, onConfirm }) {
  const category = categories.find((c) => c.slug === book.category);
  const available = book.status === "Available";
  const accent = category?.color ?? "#4a1a1f";
  const canBorrow = available && !alreadyBorrowed && !alreadyRequested;

  const [scrolling, setScrolling] = useState(false);
  const [thumb, setThumb] = useState({ top: 0, height: 0 });
  const scrollRef = useRef(null);
  const scrollTimer = useRef(null);
  const onScroll = () => {
    const el = scrollRef.current;
    if (el && el.scrollHeight > el.clientHeight) {
      const height = Math.max(32, (el.clientHeight / el.scrollHeight) * el.clientHeight);
      const maxScroll = el.scrollHeight - el.clientHeight;
      const top = (el.scrollTop / maxScroll) * (el.clientHeight - height);
      setThumb({ top, height });
    }
    setScrolling(true);
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(() => setScrolling(false), 700);
  };
  useEffect(() => () => clearTimeout(scrollTimer.current), []);

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
      <style>{`
        @keyframes modal-pop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
        .modal-scroll{scrollbar-width:none}
        .modal-scroll::-webkit-scrollbar{display:none}
      `}</style>
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

        <div
          ref={scrollRef}
          onScroll={onScroll}
          className="modal-scroll max-h-[90vh] overflow-y-auto"
        >
        <div className="grid md:grid-cols-[280px_1fr]">
          <div
            className="relative flex items-center justify-center p-8"
            style={{ background: `linear-gradient(160deg, ${accent}22, ${accent}66)` }}
          >
            <button
              type="button"
              onClick={() => onToggleFavorite(book)}
              aria-label={isFavorite ? "Remove from favorites" : "Add to favorites"}
              aria-pressed={isFavorite}
              className="absolute left-4 top-4 z-10 rounded-full bg-black/20 p-2 text-white transition hover:bg-black/30"
            >
              <Heart size={18} className={isFavorite ? "fill-red-400 text-red-400" : ""} />
            </button>
            <Cover
              title={book.title}
              src={book.cover}
              className="aspect-[2/3] w-40 rounded-xl shadow-2xl ring-1 ring-black/10 md:w-full md:max-w-[200px]"
            />
          </div>

          <div className="flex flex-col p-8">
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
              {alreadyRequested && !alreadyBorrowed && (
                <p className="mb-3 text-sm font-semibold text-amber-700">
                  Request sent. Waiting for librarian approval.
                </p>
              )}
              {!available && !alreadyBorrowed && !alreadyRequested && (
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
                {mode === "borrow" && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full border border-gray-300 bg-white px-6 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
        </div>
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute right-1 w-1.5 rounded-full bg-[#4a1a1f]/50 transition-opacity duration-300 ${
            scrolling && thumb.height > 0 ? "opacity-100" : "opacity-0"
          }`}
          style={{ top: thumb.top, height: thumb.height }}
        />
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
  const [sub, setSub] = useState("all");

  const hasFilters = query.trim() !== "" || category !== "all" || availableOnly;

  const countOf = (slug) =>
    slug === "all" ? books.length : books.filter((b) => b.category === slug).length;

  const subOptions =
    category === "all"
      ? []
      : [...new Set(books.filter((b) => b.category === category).map((b) => b.subcategory).filter(Boolean))].sort(
          (a, b) => a.localeCompare(b)
        );

  const results = sortBooks(
    books.filter((b) => {
      if (category !== "all" && b.category !== category) return false;
      if (availableOnly && b.status !== "Available") return false;
      if (sub !== "all" && b.subcategory !== sub) return false;
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

  const { items, page, totalPages, setPage } = usePagination(results, 20);

  useEffect(() => {
    setPage(1);
  }, [query, category, sub, availableOnly, sort, setPage]);

  const changePage = (p) => {
    setPage(p);
    document.getElementById("all-books")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const searchRef = useRef(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const el = searchRef.current;
      if (el) setStuck(el.getBoundingClientRect().top <= 73);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

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
        className="relative flex min-h-[420px] items-end bg-cover bg-center"
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

          <div className="mt-8 h-12" />
        </div>
      </section>

      <div ref={searchRef} className="pointer-events-none sticky top-[72px] z-40 -mt-28 mb-16 px-[7%]">
        <div
          className={`pointer-events-auto flex h-12 max-w-2xl items-center gap-3 rounded-full border border-black/5 px-5 text-gray-800 shadow-xl backdrop-blur-md transition-colors duration-200 focus-within:ring-4 focus-within:ring-[#e9c27a]/60 ${stuck ? "mx-auto" : ""} ${
            query ? "bg-white" : "bg-white/70 focus-within:bg-white"
          }`}
        >
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

            <section className="sticky top-0 z-30 flex items-stretch border-b border-[#e8dcc8] bg-[#fbf6ee]/95 backdrop-blur">
        <div className="flex min-w-0 flex-1 items-center overflow-x-auto pl-[7%] pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {[{ slug: "all", label: "All" }, ...categories].map(({ slug, label }) => {
            const active = category === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => {
                  setCategory(slug);
                  setSub("all");
                }}
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

        {subOptions.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by subcategory">
            {["all", ...subOptions].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSub(s)}
                aria-pressed={sub === s}
                className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                  sub === s
                    ? "border-[#4a1a1f] bg-[#4a1a1f] text-white shadow"
                    : "border-[#4a1a1f] bg-white text-[#4a1a1f] hover:bg-gray-50"
                }`}
              >
                {s === "all" ? "All" : s}
              </button>
            ))}
          </div>
        )}

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
            <p className="mt-4 text-left text-sm text-gray-500">
              Showing {items.length} of {results.length}
            </p>
          </>
        )}
      </section>
    </>
  );
}

function CategoryView({ books, loading, slug, onBack, onView, onBorrow }) {
  const [sub, setSub] = useState("all");
  const category = categories.find((c) => c.slug === slug);
  const inCategory = books.filter((b) => b.category === slug);
  const subcategories = [...new Set(inCategory.map((b) => b.subcategory).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );
  const list = sub === "all" ? inCategory : inCategory.filter((b) => b.subcategory === sub);
  const { items, page, totalPages, setPage } = usePagination(list);

  if (!category) return null;

  const countOfSub = (s) =>
    s === "all" ? inCategory.length : inCategory.filter((b) => b.subcategory === s).length;

  const pickSub = (s) => {
    setSub(s);
    setPage(1);
  };

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
        {subcategories.length > 0 && (
          <div className="mb-8 flex flex-wrap gap-2" role="group" aria-label="Filter by subcategory">
            {["all", ...subcategories].map((s) => {
              const active = sub === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => pickSub(s)}
                  aria-pressed={active}
                  className={`rounded-full border px-4 py-1.5 text-sm font-semibold transition ${
                    active ? "text-white shadow" : "bg-white hover:bg-gray-50"
                  }`}
                  style={{
                    borderColor: category.color,
                    color: active ? "#fff" : category.color,
                    backgroundColor: active ? category.color : undefined,
                  }}
                >
                  {s === "all" ? "All" : s}
                  <span className="ml-1.5 text-xs font-normal opacity-70">{countOfSub(s)}</span>
                </button>
              );
            })}
          </div>
        )}

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

export default function HomeStudent() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [rows, setRows] = useState([]);
  const [returningId, setReturningId] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [modal, setModal] = useState(null);
  const [toast, setToast] = useState("");

  // Toast once for each newly declined request
  const announceDeclined = (list) => {
    try {
      const declined = list.filter((r) => r.requestStatus === "declined");
      const seen = new Set(JSON.parse(localStorage.getItem("seenDeclined") || "[]"));
      const fresh = declined.filter((r) => !seen.has(r.id));
      if (fresh.length === 0) return;
      localStorage.setItem("seenDeclined", JSON.stringify([...seen, ...fresh.map((r) => r.id)]));
      setToast(
        fresh.length === 1
          ? `Your request for "${fresh[0].title}" was declined.${fresh[0].declineReason ? ` Reason: ${fresh[0].declineReason}` : ""}`
          : `${fresh.length} of your borrow requests were declined.`
      );
    } catch { /* storage unavailable */ }
  };

  const loadLoans = () =>
    Promise.all([api("", {}, BORROW_API), api()])
      .then(([tx, bk]) => {
        const list = Array.isArray(tx) ? tx : [];
        setRows(list);
        announceDeclined(list);
        if (Array.isArray(bk)) setBooks(bk.map(toStudentBook));
      })
      .catch((e) => setLoadError(e.message));

  const decorate = (r) => {
    const b = books.find((x) => String(x.id) === String(r.bookId));
    return {
      id: r.id,
      bookId: r.bookId,
      title: r.title,
      author: b?.author ?? "",
      category: categories.find((c) => c.slug === b?.category)?.label ?? "",
      cover: b?.cover,
      borrowed: r.borrowedOn,
      due: r.due,
      returned: r.returned,
      requested: r.requestedOn,
      decided: r.decidedOn,
      declineReason: r.declineReason,
      fine: r.fine,
      daysOverdue: r.daysOverdue,
    };
  };
  const loans = rows.filter((r) => r.requestStatus === "approved");
  const borrowed = loans.filter((r) => !r.returned).map(decorate);
  const history = loans
    .filter((r) => r.returned)
    .map(decorate)
    .sort((a, b) => String(b.returned).localeCompare(String(a.returned)));
  const pending = rows.filter((r) => r.requestStatus === "pending").map(decorate);
  const declined = rows.filter((r) => r.requestStatus === "declined").map(decorate);

  const location = useLocation();
  const [view, setView] = useState({
    page: location.state?.page ?? "home",
    slug: null,
  });

  const navigate = useNavigate();
  const pendingBookId = location.state?.bookId;
  useEffect(() => {
    if (pendingBookId == null || books.length === 0) return;
    const target = books.find((x) => String(x.id) === String(pendingBookId));
    if (target) setModal({ mode: "view", book: target });
    navigate(location.pathname, {
      replace: true,
      state: { ...location.state, bookId: undefined },
    });
  }, [pendingBookId, books]);

  useEffect(() => {
    api()
      .then((data) => setBooks(Array.isArray(data) ? data.map(toStudentBook) : []))
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadLoans();
    window.addEventListener("focus", loadLoans);
    return () => window.removeEventListener("focus", loadLoans);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

    useEffect(() => {
      api("/favorites")
        .then((list) => setFavorites(Array.isArray(list) ? list.map((b) => String(b.id)) : []))
        .catch((e) => setLoadError(e.message));
    }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (page, slug = null) => {
    if (page === "transactions") loadLoans();
    setView({ page, slug });
    window.scrollTo({ top: 0 });
  };

  const openView = (book) => setModal({ mode: "view", book });
  const openBorrow = (book) => setModal({ mode: "borrow", book });
  const closeModal = () => setModal(null);

  const toggleFavorite = async (book) => {
    const id = String(book.id);
    const wasFav = favorites.includes(id);
    setFavorites((prev) => (wasFav ? prev.filter((x) => x !== id) : [...prev, id]));
    try {
      await api(`/favorites/${id}`, { method: wasFav ? "DELETE" : "PUT" });
      setToast(wasFav ? "Removed from favorites" : "Added to favorites");
    } catch (e) {
      setFavorites((prev) => (wasFav ? [...prev, id] : prev.filter((x) => x !== id)));
      setToast(e.message);
    }
  };

  const confirmBorrow = async (book) => {
    try {
      await api("", { method: "POST", body: JSON.stringify({ bookId: book.id }) }, BORROW_API);
      closeModal();
      await loadLoans();
      setToast(`Request sent for "${book.title}". Waiting for librarian approval.`);
    } catch (e) {
      setToast(e.message);
    }
  };

  const handleReturn = async (item) => {
    if (returningId) return;
    setReturningId(item.id);
    try {
      await api(`/${item.id}/return`, { method: "PUT" }, BORROW_API);
      await loadLoans();
      setToast(
        item.fine > 0
          ? `Returned "${item.title}". Fine due: ₱${Number(item.fine).toFixed(2)}.`
          : `Returned "${item.title}".`
      );
    } catch (e) {
      setToast(e.message);
    } finally {
      setReturningId(null);
    }
  };

  const handleCancel = async (item) => {
    try {
      await api(`/${item.id}/cancel`, { method: "PUT" }, BORROW_API);
      await loadLoans();
      setToast(`Request cancelled for "${item.title}".`);
    } catch (e) {
      setToast(e.message);
    }
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
          onOpenBorrowed={() => go("transactions")}
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
        <BorrowerTransactions
          borrowed={borrowed}
          history={history}
          pending={pending}
          declined={declined}
          initialTab={location.state?.tab}
          onReturn={handleReturn}
          onCancelRequest={handleCancel}
          onViewBook={(item) => {
            const b = books.find((x) => String(x.id) === String(item.bookId));
            if (b) openView(b);
          }}
        />
      )}

      {view.page !== "transactions" && <Footer onOpenCategory={(slug) => go("category", slug)} />}

      {modal && (
        <BookModal
          book={modal.book}
          mode={modal.mode}
          alreadyBorrowed={borrowed.some((b) => String(b.bookId) === String(modal.book.id))}
          alreadyRequested={pending.some((b) => String(b.bookId) === String(modal.book.id))}
          isFavorite={favorites.includes(String(modal.book.id))}
          onToggleFavorite={toggleFavorite}
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