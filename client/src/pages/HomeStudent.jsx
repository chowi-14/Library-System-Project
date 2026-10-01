import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, Scroll, GraduationCap, Skull, X } from "lucide-react";
import Navbar from "../components/Navbar";
import crest from "../assets/crest.webp";
import bg from "../assets/bg.webp";

/* ---------------- Data ---------------- */

const categories = [
  { slug: "fiction", label: "Fiction", tagline: "Stories beyond the curriculum.", icon: BookOpen, color: "#e99b1c" },
  { slug: "non-fiction", label: "Non-Fiction", tagline: "Real magic, real history.", icon: Scroll, color: "#c0151f" },
  { slug: "academic", label: "Academic", tagline: "The books behind every lesson.", icon: GraduationCap, color: "#0e3f8a" },
  { slug: "restricted", label: "Restricted", tagline: "Forbidden knowledge. Read at your own risk.", icon: Skull, color: "#0a7a46" },
];

// Add books here. `cover` and `released` (YYYY-MM-DD) are optional.
// Example:
// { id: 1, title: "Book Title", author: "Author Name", category: "fiction",
//   released: "2019-02-26", cover: "/covers/book.webp", description: "is a ..." }
const books = [];

// Dates are YYYY-MM-DD
const initialBorrowed = [];
const initialHistory = [];

const parse = (d) => new Date(`${d}T00:00:00`);
const fmt = (d, day = "numeric") =>
  parse(d).toLocaleDateString("en-US", { month: "long", day, year: "numeric" });

/* ---------------- Small components ---------------- */

// Real cover if `src` exists, otherwise a colored placeholder with the title.
function Cover({ title, src, className = "" }) {
  if (src) return <img src={src} alt={`${title} cover`} className={`object-cover ${className}`} />;
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
  return (
    <article className="flex flex-col rounded-lg bg-white p-2 shadow-md">
      <button
        type="button"
        onClick={() => onView?.(book)}
        aria-label={`View ${book.title}`}
        className="block rounded-md outline-none focus-visible:ring-2 focus-visible:ring-[#4a1a1f]"
      >
        <Cover title={book.title} src={book.cover} className="aspect-[2/3] w-full rounded-md" />
      </button>
      <h3 className="mt-2 text-sm font-bold leading-tight">
        <button type="button" onClick={() => onView?.(book)} className="text-left hover:underline">
          {book.title}
        </button>
      </h3>
      <p className="text-xs text-gray-500">{book.author}</p>
      <button
        type="button"
        onClick={() => onBorrow?.(book)}
        className="mt-2 flex items-center justify-center gap-1 rounded-full border border-gray-400 py-1 text-xs hover:bg-gray-100"
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

/* ---------------- Modal (view + borrow) ---------------- */

function BookModal({ book, mode, alreadyBorrowed, onClose, onConfirm }) {
  const category = categories.find((c) => c.slug === book.category);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-modal-title"
        className="w-full max-w-2xl overflow-hidden rounded-sm bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex h-14 items-center justify-between bg-[#4a1a1f] px-6 text-white">
          {mode === "borrow" ? <h2 className="text-xl font-bold">Borrow Book</h2> : <span />}
          <button type="button" onClick={onClose} aria-label="Close" className="hover:opacity-80">
            <X size={22} />
          </button>
        </div>

        {/* Body */}
        <div className="flex flex-col gap-6 p-6 sm:flex-row">
          <Cover
            title={book.title}
            src={book.cover}
            className="h-56 w-40 shrink-0 self-center rounded-2xl sm:self-start"
          />

          <div className="flex-1">
            <h3 id="book-modal-title" className="text-2xl font-bold leading-tight">{book.title}</h3>

            <p className="mt-2 flex flex-wrap gap-x-6 text-sm font-bold">
              <span>By: {book.author}</span>
              {book.released && <span>Released on: {fmt(book.released)}</span>}
            </p>

            <span
              className="mt-2 inline-block rounded px-2 py-0.5 text-xs font-bold text-white"
              style={{ backgroundColor: category?.color }}
            >
              {category?.label}
            </span>

            <p className="mt-4 text-sm font-semibold leading-relaxed">
              {book.description || "No description available yet."}
            </p>

            {mode === "borrow" && (
              <div className="mt-6">
                {alreadyBorrowed && (
                  <p className="mb-3 text-center text-sm font-semibold text-red-700">
                    You already borrowed this book.
                  </p>
                )}
                <div className="flex justify-center gap-4 font-serif">
                  {!alreadyBorrowed && (
                    <button
                      type="button"
                      onClick={() => onConfirm(book)}
                      className="rounded-sm bg-[#0b7a45] px-8 py-1.5 text-sm font-semibold text-white hover:brightness-110"
                    >
                      Borrow Book?
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-sm border border-gray-500 bg-white px-8 py-1.5 text-sm font-semibold hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Views ---------------- */

function HomeView({ onOpenCategory, onView, onBorrow }) {
  const scrollToCategories = () =>
    document.getElementById("categories")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      {/* Hero */}
      <section
        className="relative flex h-[40vw] max-h-[620px] min-h-[340px] items-center bg-cover bg-center"
        style={{ backgroundImage: `url(${bg})` }}
      >
        <div className="absolute inset-0 bg-black/40" />
        <div className="relative w-full px-[7%] text-[#fdf0e0]">
          <h1 className="max-w-[9em] font-serif text-[clamp(2.5rem,5.5vw,5rem)] leading-[1.1]">Knowledge is the truest magic.</h1>
          <p className="mt-4 font-serif text-[clamp(0.95rem,1.7vw,1.5rem)]">
            Where every book holds a lesson, and every lesson holds power.
          </p>
          <button
            type="button"
            onClick={scrollToCategories}
            className="mt-6 inline-flex items-center gap-2 rounded bg-[#c97a2b] px-5 py-2.5 text-base text-white hover:brightness-110"
          >
            Explore Collection <ArrowRight size={14} />
          </button>
        </div>
      </section>

      {/* Categories */}
      <section id="categories" className="w-full px-[7%] py-12">
        <p className="text-sm font-bold">Browse By Category</p>
        <h2 className="font-serif text-4xl">Find Your Next Read</h2>

        <div className="mt-6 grid grid-cols-2 gap-6 lg:grid-cols-4">
          {categories.map(({ slug, label, tagline, icon: Icon, color }) => (
            <button
              key={slug}
              type="button"
              onClick={() => onOpenCategory(slug)}
              style={{ backgroundColor: color }}
              className="flex aspect-[8/7] flex-col items-center justify-center rounded-md px-3 text-center text-white outline-none transition hover:-translate-y-1 hover:shadow-lg focus-visible:ring-4 focus-visible:ring-black/30"
            >
              <span className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-white">
                <Icon size={28} />
              </span>
              <span className="mt-3 font-serif text-xl">{label}</span>
              <span className="mt-1 text-xs font-semibold leading-tight">{tagline}</span>
            </button>
          ))}
        </div>
      </section>

      {/* All books */}
      <section className="w-full px-[7%] pb-14">
        <h2 className="font-serif text-3xl">All Available Books</h2>
        {books.length === 0 ? (
          <p className="mt-5 text-gray-500">No books available yet.</p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {books.slice(0, 5).map((b) => (
              <BookCard key={b.id} book={b} onView={onView} onBorrow={onBorrow} />
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function CategoryView({ slug, onBack, onView, onBorrow }) {
  const category = categories.find((c) => c.slug === slug);
  if (!category) return null;

  const Icon = category.icon;
  const list = books.filter((b) => b.category === slug);

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
        {list.length === 0 ? (
          <p className="text-gray-500">No books in this category yet.</p>
        ) : (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5">
            {list.map((b) => (
              <BookCard key={b.id} book={b} onView={onView} onBorrow={onBorrow} />
            ))}
          </div>
        )}
      </main>
    </>
  );
}

function TransactionsView({ borrowed, history, onReturn }) {
  const [tab, setTab] = useState("borrowed"); // "borrowed" | "history"

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

/* ---------------- Page ---------------- */

export default function HomeStudent() {
  const [view, setView] = useState({ page: "home", slug: null }); // home | category | transactions
  const [borrowed, setBorrowed] = useState(initialBorrowed);
  const [history, setHistory] = useState(initialHistory);
  const [modal, setModal] = useState(null); // { mode: "view" | "borrow", book }
  const [toast, setToast] = useState("");

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

  const iso = (d) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD (local)

  const confirmBorrow = (book) => {
    const due = new Date();
    due.setDate(due.getDate() + 7); // 7-day loan
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

      {view.page === "home" && (
        <HomeView
          onOpenCategory={(slug) => go("category", slug)}
          onView={openView}
          onBorrow={openBorrow}
        />
      )}
      {view.page === "category" && (
        <CategoryView
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