import { useEffect, useMemo, useRef, useState } from "react";
import Navbar from "../components/Navbar";
import Pagination from "../components/Pagination";

const API = `${import.meta.env.VITE_API_URL ?? "http://localhost:5001/api"}/books`;
const BORROW_API = `${import.meta.env.VITE_API_URL ?? "http://localhost:5001/api"}/borrowings`;
const ROWS_PER_PAGE = 5;
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


const selectSm = "rounded-md border border-[#2b2b2b] bg-white px-2.5 py-[7px] text-[13px]";
const inputBase =
  "block w-full rounded border bg-white px-2.5 py-2 text-[13px] font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b4a8b]";
const btnBase = "cursor-pointer rounded-sm px-3 py-[9px] text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-60";
const btnPrimary = `${btnBase} border border-[#eea51c] bg-[#eea51c] text-white hover:bg-[#d8940f]`;
const btnSecondary = `${btnBase} border border-[#2b2b2b] bg-white text-[#1b1b1b] hover:bg-gray-100`;
const btnDanger = `${btnBase} border border-[#c0121f] bg-[#c0121f] text-white hover:bg-[#9c0e19]`;
const btnSmall = "cursor-pointer rounded-sm border border-[#2b2b2b] bg-white px-3.5 text-xs font-bold text-[#1b1b1b] hover:bg-gray-100";

function SortableTable({ columns, rows, defaultSort, emptyText, resetKey }) {
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
      <div className="mb-2 flex items-center justify-end gap-2 text-[13px]">
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
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-[#2b2b2b]">
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr>
              {columns.map((c) => {
                const active = sort.key === c.key;
                return (
                  <th
                    key={c.key}
                    className="whitespace-nowrap border-b border-[#d8d8d8] px-2.5 py-3 text-center font-semibold"
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
              <tr key={row.id} className="border-b border-[#eee] last:border-b-0 hover:bg-[#faf6f0]">
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

const Cover = ({ colors = ["#4a1f1f", "#eea51c"], image }) => {
  const [failed, setFailed] = useState(false);
  if (image && !failed) {
    return (
      <img
        className="mx-auto block h-[50px] w-[34px] rounded-[3px] object-cover"
        src={image}
        alt=""
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
      />
    );
  }
  return (
    <div className="relative mx-auto h-[50px] w-[34px] overflow-hidden rounded-[3px]" style={{ background: colors[0] }}>
      <span className="absolute inset-x-1.5 bottom-2 h-1.5 rounded-sm" style={{ background: colors[1] }} />
    </div>
  );
};

const BADGE_COLORS = {
  overdue: "bg-[#c0121f]",
  available: "bg-[#0c7a43]",
  returned: "bg-[#0c7a43]",
  "not-returned": "bg-[#eea51c]",
  borrowed: "bg-[#eea51c]",
};

const Badge = ({ status, overdue }) => {
  const kind = overdue ? "overdue" : status.toLowerCase().replace(" ", "-");
  return (
    <span className={`inline-block rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white ${BADGE_COLORS[kind]}`}>
      {status}
    </span>
  );
};

const CATEGORIES = ["Fiction", "Non-Fiction", "Academic", "Restricted"];
const EMPTY_FORM = { title: "", author: "", publisher: "", category: "", published: "", description: "", image: "", copies: "1" };
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

  if (!f.published) e.published = "Pick a publish date.";
  else if (f.published > todayISO()) e.published = "Date can't be in the future.";

  const desc = f.description.trim();
  if (!desc) e.description = "Description is required.";
  else if (desc.length < 10) e.description = "Write at least 10 characters.";
  else if (desc.length > DESC_MAX) e.description = "Keep it under 300 characters.";

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

function Modal({ title, titleId, onClose, small, role = "dialog", describedBy, children }) {
  return (
    <div
      className="fixed inset-0 z-50 flex overflow-y-auto bg-black/[.55] px-4 py-6"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className={`m-auto w-full bg-white shadow-[0_10px_40px_rgba(0,0,0,0.35)] ${small ? "max-w-[380px]" : "max-w-[430px]"}`}
        role={role}
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={describedBy}
      >
        <div className="flex items-center justify-between bg-[#4a1f1f] px-[22px] py-4 text-white">
          <h2 id={titleId} className="text-lg font-bold">{title}</h2>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="cursor-pointer border-0 bg-transparent text-[26px] leading-none text-white"
          >
            ×
          </button>
        </div>
        {children}
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

function BookFormModal({ book, onClose, onSave }) {
  const editing = !!book;
  const isData = !!book?.image && book.image.startsWith("data:");
  const [form, setForm] = useState(() =>
    book
      ? {
          title: book.title, author: book.author, publisher: book.publisher, category: book.category,
          published: book.published, description: book.description || "", image: isData ? "" : book.image || "",
          copies: String(book.copies ?? 1),
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
    className: `${inputBase} ${err(k) ? "border-[#c0121f]" : "border-[#2b2b2b]"} ${form[k] ? "text-[#1b1b1b]" : "text-gray-400"}`,
    "aria-invalid": !!err(k),
  });

  const submit = async (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, true])));
    if (Object.keys(errors).length) return;

    setSaving(true);
    setSubmitError("");
    try {
      await onSave({
        title: form.title.trim(),
        author: form.author.trim(),
        publisher: form.publisher.trim(),
        category: form.category,
        published: form.published,
        description: form.description.trim(),
        image: upload ? upload.data : form.image.trim(),
        copies: Number(form.copies),
      });
    } catch (err) {
      setSubmitError(err.message);
      setSaving(false);
    }
  };

  const full = form.description.length >= DESC_MAX;

  return (
    <Modal title={editing ? "Edit Book" : "Add Book"} titleId="book-form-title" onClose={onClose}>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px]">
        <Field label="Book Title" error={err("title")}>
          <input ref={firstRef} type="text" placeholder="Enter a Book Title" {...bind("title")} />
        </Field>

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <Field label="Author Name" error={err("author")}>
            <input type="text" placeholder="Enter a Author Name" {...bind("author")} />
          </Field>
          <Field label="Publisher" error={err("publisher")}>
            <input type="text" placeholder="Enter a Publisher Name" {...bind("publisher")} />
          </Field>
        </div>

        <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2">
          <Field label="Category" error={err("category")}>
            <select {...bind("category")}>
              <option value="" disabled>Choose a Category</option>
              {CATEGORIES.map((c) => <option key={c} className="text-[#1b1b1b]">{c}</option>)}
            </select>
          </Field>
          <Field label="Date Published" error={err("published")}>
            <input type="date" max={todayISO()} {...bind("published")} />
          </Field>
        </div>

        <Field
          label="Description"
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

        <Field label="Number of Copies" error={err("copies")}>
          <input type="number" min="1" max="99" placeholder="e.g. 3" {...bind("copies")} />
        </Field>

        <Field label="Image Upload" error={fileError || err("image")}>
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
              <button type="button" className={btnSmall} onClick={() => fileRef.current?.click()}>Browse</button>
            )}
          </div>
        </Field>
        <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
        {previewSrc && (
          <div className="flex items-center gap-2.5 text-[11.5px]">
            <img
              className="h-[58px] w-[40px] rounded-[3px] border border-[#2b2b2b] object-cover"
              src={previewSrc}
              alt="Cover preview"
              referrerPolicy="no-referrer"
              onLoad={() => setImgOk(true)}
              onError={() => setImgOk(false)}
            />
            <span className={imgOk === false ? "text-[#c0121f]" : "text-[#0c7a43]"}>
              {imgOk === false
                ? "Couldn't load this image. Use a direct image link (ends in .jpg or .png), or browse a file."
                : imgOk ? "Image loaded." : "Loading preview..."}
            </span>
          </div>
        )}

        {submitError && (
          <p className="text-[12.5px] font-semibold text-[#c0121f]" role="alert">{submitError}</p>
        )}

        <div className="mt-1.5 grid grid-cols-2 gap-6">
          <button type="submit" className={btnPrimary} disabled={saving}>
            {saving ? "Saving..." : editing ? "Edit Book" : "Add Book"}
          </button>
          <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
        </div>
      </form>
    </Modal>
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
        <div className="grid grid-cols-2 gap-6">
          <button type="button" className={btnDanger} onClick={onConfirm}>Delete</button>
          <button type="button" className={btnSecondary} ref={cancelRef} onClick={onCancel}>Cancel</button>
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
const TABS = [["overview", "Overview"], ["books", "Books"], ["borrowers", "Borrowers"]];
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

const buildNotifications = (transactions, books) => {
  const out = [];
  const now = Date.now();
  for (const t of transactions) {
    if (t.overdue) {
      out.push({ tone: "red", title: `Overdue: ${t.title}`, sub: `${t.borrower} · ${t.daysOverdue} ${t.daysOverdue === 1 ? "day" : "days"} late` });
    } else if (!isReturned(t) && t.due && (new Date(t.due + "T00:00:00") - now) / 86400000 < 2) {
      out.push({ tone: "amber", title: `Due soon: ${t.title}`, sub: `${t.borrower} · due ${fmt(t.due)}` });
    }
    if (isReturned(t) && t.fine > 0 && !t.finePaid) {
      out.push({ tone: "red", title: `Unpaid fine: ${peso(t.fine)}`, sub: `${t.borrower} · ${t.title}` });
    }
  }
  for (const b of books) {
    if (copiesLeft(b) === 0) out.push({ tone: "maroon", title: `No copies left: ${b.title}`, sub: `All ${b.totalCopies ?? 1} copies are borrowed.` });
  }
  return out;
};

// ---------- CSV import ----------
const CSV_TEMPLATE = `title,author,publisher,category,published,copies,description,image
The Hobbit,J.R.R. Tolkien,Allen & Unwin,Fiction,1937-09-21,3,A hobbit goes on an unexpected adventure.,
A Brief History of Time,Stephen Hawking,Bantam Books,Non-Fiction,1988-04-01,2,An introduction to cosmology for general readers.,https://example.com/cover.jpg
`;
const REQUIRED_COLS = ["title", "author", "publisher", "category", "published", "description"];
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

const readImport = (text, existing) => {
  const table = parseCsv(text.replace(/^\uFEFF/, ""));
  if (table.length < 2) return { rows: [], error: "The file needs a header row and at least one book." };
  const head = {};
  table[0].forEach((h, i) => {
    let k = h.trim().toLowerCase().replace(/ /g, "");
    if (k === "totalcopies" || k === "numberofcopies") k = "copies";
    if (k === "imageurl" || k === "imagelink") k = "image";
    if (k === "datepublished") k = "published";
    head[k] = i;
  });
  const missing = REQUIRED_COLS.filter((k) => !(k in head));
  if (missing.length) return { rows: [], error: `Missing column(s): ${missing.join(", ")}.` };

  const cell = (r, k) => (head[k] === undefined ? "" : (r[head[k]] ?? "").trim());
  const keyOf = (t, a) => `${t.toLowerCase()}|${a.toLowerCase()}`;
  const seen = new Set(existing.map((b) => keyOf(b.title, b.author)));

  const rows = table.slice(1, MAX_IMPORT_ROWS + 1).map((r, i) => {
    const cat = CATEGORIES.find((c) => c.toLowerCase() === cell(r, "category").toLowerCase());
    const form = {
      title: cell(r, "title"), author: cell(r, "author"), publisher: cell(r, "publisher"),
      category: cat || "", published: cell(r, "published"), description: cell(r, "description"),
      image: cell(r, "image"), copies: cell(r, "copies") || "1",
    };
    const e = validate(form);
    if (!cat) e.category = `Category must be one of: ${CATEGORIES.join(", ")}.`;
    if (form.published && !/^\d{4}-\d{2}-\d{2}$/.test(form.published)) e.published = "Use the date format YYYY-MM-DD.";
    const errors = Object.values(e);
    if (!errors.length) {
      const k = keyOf(form.title, form.author);
      if (seen.has(k)) errors.push("Duplicate: this title and author already exist.");
      else seen.add(k);
    }
    return { line: i + 2, label: form.title || "(no title)", form, errors };
  });
  return { rows, error: table.length - 1 > MAX_IMPORT_ROWS ? `Only the first ${MAX_IMPORT_ROWS} rows were read.` : "" };
};

function ImportModal({ books, onClose, onDone }) {
  const [fileName, setFileName] = useState("");
  const [fileError, setFileError] = useState("");
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);
  const good = rows.filter((r) => !r.errors.length);
  const bad = rows.filter((r) => r.errors.length);

  const pick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);
    const res = readImport(await file.text(), books);
    setRows(res.rows);
    setFileError(res.error);
  };
  const template = () => {
    const url = URL.createObjectURL(new Blob(["\uFEFF" + CSV_TEMPLATE], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url; a.download = "books_import_template.csv"; a.click();
    URL.revokeObjectURL(url);
  };
  const run = async () => {
    setBusy(true);
    let n = 0;
    for (const r of good) {
      const { copies, ...rest } = r.form;
      try { await api("", { method: "POST", body: JSON.stringify({ ...rest, copies: Number(copies) }) }); n++; } catch { /* skipped */ }
    }
    const skipped = rows.length - n;
    onDone(`Imported ${n} ${n === 1 ? "book" : "books"}${skipped > 0 ? ` (${skipped} skipped)` : ""}.`);
  };

  return (
    <Modal title="Bulk Import" titleId="import-title" onClose={onClose}>
      <div className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px] text-[13px]">
        <p><strong>1.</strong> Download the template (.csv) and open it in Excel or Google Sheets.</p>
        <button type="button" className={btnSecondary} onClick={template}>Download template (.csv)</button>
        <p>
          <strong>2.</strong> One book per row. Keep the header row. Categories: {CATEGORIES.join(", ")}. Date format: YYYY-MM-DD.
          Max {MAX_IMPORT_ROWS} rows. Books already in the catalog (same title and author) are skipped.
        </p>
        <p><strong>3.</strong> Upload your file.</p>
        <button type="button" className={`${btnSecondary} py-5`} onClick={() => fileRef.current?.click()}>
          {fileName || "Choose a .csv file"}
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={pick} />
        {fileError && <p className="font-semibold text-[#c0121f]" role="alert">{fileError}</p>}

        {rows.length > 0 && (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-[#0c7a43]/40 bg-[#0c7a43]/10 p-3"><strong className="block text-2xl text-[#0c7a43]">{good.length}</strong>Ready to import</div>
              <div className="rounded-xl border border-[#c0121f]/40 bg-[#c0121f]/10 p-3"><strong className="block text-2xl text-[#c0121f]">{bad.length}</strong>Will be skipped</div>
            </div>
            {bad.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-[#c0121f]/40 bg-[#c0121f]/5 p-3">
                <p className="mb-2 font-bold text-[#c0121f]">Fix these rows and upload again:</p>
                {bad.slice(0, 20).map((r) => (
                  <div key={r.line} className="mb-2">
                    <div className="font-bold">Row {r.line} · {r.label}</div>
                    <div className="text-xs">{r.errors.join(" ")}</div>
                  </div>
                ))}
                {bad.length > 20 && <p className="text-xs text-gray-500">...and {bad.length - 20} more.</p>}
              </div>
            )}
            <button type="button" className={btnPrimary} disabled={!good.length || busy} onClick={run}>
              {busy ? "Importing..." : good.length ? `Import ${good.length} ${good.length === 1 ? "book" : "books"}` : "Nothing to import"}
            </button>
          </>
        )}
      </div>
    </Modal>
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
        <Field label="Student">
          <select className={`${inputBase} border-[#2b2b2b]`} value={email} onChange={(e) => setEmail(e.target.value)}>
            <option value="" disabled>Choose a student</option>
            {students.map((s) => <option key={s.email} value={s.email}>{s.fullName} · {s.email}</option>)}
          </select>
        </Field>
        <Field label="Book">
          <select className={`${inputBase} border-[#2b2b2b]`} value={bookId} onChange={(e) => setBookId(e.target.value)}>
            <option value="" disabled>Choose a book</option>
            {books.map((b) => <option key={b.id} value={b.id}>{b.title} ({copiesLeft(b)} left)</option>)}
          </select>
        </Field>
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
    {!isReturned(t) && <button className={`${btnSmall} py-1.5`} onClick={() => onReturn(t)}>Mark returned</button>}
    {isReturned(t) && t.fine > 0 && !t.finePaid && <button className={`${btnSmall} py-1.5`} onClick={() => onPayFine(t)}>Mark fine paid</button>}
  </span>
);

// ---------- Student detail ----------
function StudentModal({ student, transactions, onClose, onIssue, onReturn, onPayFine }) {
  const [page, setPage] = useState(1);
  const records = transactions.filter((t) => t.borrowerEmail === student.email);
  const active = records.filter((t) => !isReturned(t));
  const problem = eligibility(student, null, transactions);
  const fines = records.filter((t) => t.fine > 0 && !t.finePaid).reduce((s, t) => s + t.fine, 0);
  const size = 3;
  const pages = Math.max(1, Math.ceil(records.length / size));
  const cur = Math.min(page, pages);
  const shown = records.slice((cur - 1) * size, cur * size);

  return (
    <Modal title={student.fullName} titleId="student-title" onClose={onClose}>
      <div className="flex flex-col gap-3 px-6 pt-[22px] pb-[26px] text-[13px]">
        <p className="text-gray-500">{student.email} · {student.phone}</p>
        <div className={`rounded-lg p-3 font-semibold ${problem ? "bg-[#c0121f]/10 text-[#c0121f]" : "bg-[#0c7a43]/10 text-[#0c7a43]"}`}>
          {problem || "Eligible to borrow"}
        </div>
        <p className="font-semibold">Borrowing limit: {active.length}/{MAX_LOANS} books</p>
        {fines > 0 && <p className="font-bold text-[#c0121f]">Outstanding fines: {peso(fines)}</p>}
        <button type="button" className={btnPrimary} onClick={() => onIssue(student)}>+ Issue a book</button>

        <h3 className="mt-2 text-base font-bold">Borrowing records</h3>
        {records.length === 0 ? (
          <p className="text-gray-500">No borrowing records yet.</p>
        ) : (
          <>
            {shown.map((t) => (
              <div key={t.id} className={`rounded-xl border p-3 ${t.overdue ? "border-[#c0121f]/60" : "border-[#2b2b2b]/30"}`}>
                <div className="mb-1 flex items-center justify-between gap-2">
                  <strong>{t.title}</strong>
                  <Badge status={t.status} overdue={t.overdue} />
                </div>
                <div className="text-xs text-gray-500">Borrowed {fmt(t.borrowedOn)} · Due {fmt(t.due)}</div>
                {isReturned(t) && <div className="text-xs text-gray-500">Returned {fmt(t.returned)}</div>}
                {t.fine > 0 && (
                  <div className={`text-[13px] font-bold ${t.finePaid ? "text-[#0c7a43]" : "text-[#c0121f]"}`}>
                    Fine: {peso(t.fine)} ({t.daysOverdue} {t.daysOverdue === 1 ? "day" : "days"} late){t.finePaid ? " · PAID" : ""}
                  </div>
                )}
                <div className="mt-2 text-right"><TxActions t={t} onReturn={onReturn} onPayFine={onPayFine} /></div>
              </div>
            ))}
            <Pagination page={cur} totalPages={pages} onChange={setPage} />
          </>
        )}
      </div>
    </Modal>
  );
}

// ---------- Notifications ----------
function NotificationsModal({ notes, onClose }) {
  const [page, setPage] = useState(1);
  const size = 6;
  const pages = Math.max(1, Math.ceil(notes.length / size));
  const cur = Math.min(page, pages);
  return (
    <Modal title="Notifications" titleId="notes-title" onClose={onClose}>
      <div className="flex flex-col gap-3 px-6 pt-[22px] pb-[26px] text-[13px]">
        <p className="text-gray-500">
          {notes.length === 0 ? "Nothing needs your attention." : `${notes.length} ${notes.length === 1 ? "notification" : "notifications"}`}
        </p>
        {notes.length === 0 && <p className="rounded-xl bg-[#faf6f0] p-4 font-semibold text-[#0c7a43]">You're all caught up.</p>}
        {notes.slice((cur - 1) * size, cur * size).map((n, i) => (
          <div key={i} className="flex items-start gap-3 rounded-xl border border-[#2b2b2b]/20 p-3">
            <span className="mt-1 h-3 w-3 shrink-0 rounded-full" style={{ background: TONES[n.tone] }} />
            <div><div className="font-bold">{n.title}</div><div className="text-gray-600">{n.sub}</div></div>
          </div>
        ))}
        {notes.length > size && <Pagination page={cur} totalPages={pages} onChange={setPage} />}
      </div>
    </Modal>
  );
}

// ---------- Overview ----------
function Overview({ books, transactions, students, onAction, onStat }) {
  const outstanding = transactions.filter((t) => t.fine > 0 && !t.finePaid).reduce((s, t) => s + t.fine, 0);
  const stats = [
    ["Total Books", books.length, "bg-[#e4f1ee]"],
    ["Borrowed", transactions.filter((t) => !isReturned(t)).length, "bg-[#dedaf4]"],
    ["Overdue", transactions.filter((t) => t.overdue).length, "bg-[#ffadad]"],
    ["Available", books.reduce((s, b) => s + copiesLeft(b), 0), "bg-[#ffd6a5]"],
    ["Students", students.length, "bg-[#d7ecff]"],
    ["Fines Due", `₱${outstanding.toFixed(0)}`, "bg-[#f6d6e8]"],
  ];
  const borrowedToday = transactions.filter((t) => isToday(t.borrowedOn)).length;
  const returnedToday = transactions.filter((t) => isReturned(t) && isToday(t.returned)).length;
  const recent = transactions.slice(0, 5);
  const actions = [["issue", "Issue"], ["add", "Add Book"], ["import", "Import"], ["students", "Students"]];
  const h = "mb-3 border-b border-[#eea51c]/60 pb-1 text-xl font-bold text-[#4a1f1f]";

  return (
    <>
      <p className="mb-3 text-sm italic text-gray-500">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p>
      <div className="mb-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {actions.map(([k, label]) => (
          <button key={k} onClick={() => onAction(k)} className="cursor-pointer rounded-xl border border-[#eea51c] bg-[#4a1f1f] py-3 text-sm font-semibold text-white hover:opacity-90">{label}</button>
        ))}
      </div>

      <h2 className={h}>Library at a Glance</h2>
      <section className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3">
        {stats.map(([label, value, bg]) => (
          <button key={label} onClick={() => onStat(label)} className={`flex cursor-pointer flex-col gap-1.5 rounded-xl border-0 px-[18px] py-3.5 text-left hover:opacity-90 ${bg}`}>
            <span className="text-[13px] font-semibold">{label}</span>
            <strong className="text-[30px] font-bold">{value}</strong>
          </button>
        ))}
      </section>

      <h2 className={h}>Today's Summary</h2>
      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-[#4a1f1f]/40 bg-[#4a1f1f]/10 p-4"><strong className="block text-2xl text-[#4a1f1f]">{borrowedToday}</strong><span className="text-xs font-semibold">Borrowed today</span></div>
        <div className="rounded-xl border border-[#0c7a43]/40 bg-[#0c7a43]/10 p-4"><strong className="block text-2xl text-[#0c7a43]">{returnedToday}</strong><span className="text-xs font-semibold">Returned today</span></div>
      </div>

      <h2 className={h}>Recent Activity</h2>
      {recent.length === 0 ? (
        <p className="rounded-xl bg-[#faf6f0] p-4 text-sm font-semibold">No loans recorded yet.</p>
      ) : (
        <div className="rounded-xl border border-[#4a1f1f]/20">
          {recent.map((t) => (
            <div key={t.id} className="flex items-center gap-3 border-b border-[#4a1f1f]/10 px-4 py-3 last:border-b-0">
              <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: t.overdue ? TONES.red : isReturned(t) ? TONES.green : TONES.amber }} />
              <div className="min-w-0">
                <div className="truncate text-sm font-bold">{t.title}</div>
                <div className="truncate text-xs text-gray-600">{t.borrower} · {isReturned(t) ? `Returned ${fmt(t.returned)}` : `Borrowed ${fmt(t.borrowedOn)}`}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ---------- Profile ----------
function EditProfileModal({ profile, onClose, onSaved }) {
  const [f, setF] = useState({ firstName: profile.firstName || "", lastName: profile.lastName || "", phone: profile.phone || "" });
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const phone = f.phone.replace(/[\s-]/g, "");
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
    className: `${inputBase} ${touched && errors[k] ? "border-[#c0121f]" : "border-[#2b2b2b]"}`,
  });
  return (
    <Modal title="Edit Profile" titleId="edit-profile-title" onClose={onClose} small>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px]">
        <Field label="First name" error={touched && errors.firstName}><input type="text" {...bind("firstName")} /></Field>
        <Field label="Last name" error={touched && errors.lastName}><input type="text" {...bind("lastName")} /></Field>
        <Field label="Phone" error={touched && errors.phone}><input type="tel" {...bind("phone")} /></Field>
        {error && <p className="text-[12.5px] font-semibold text-[#c0121f]" role="alert">{error}</p>}
        <div className="grid grid-cols-2 gap-6">
          <button type="submit" className={btnPrimary}>Save</button>
          <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
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
    className: `${inputBase} ${touched && errors[k] ? "border-[#c0121f]" : "border-[#2b2b2b]"}`,
  });
  return (
    <Modal title="Change Password" titleId="password-title" onClose={onClose} small>
      <form onSubmit={submit} noValidate className="flex flex-col gap-3.5 px-6 pt-[22px] pb-[26px]">
        <Field label="Current password" error={touched && errors.cur}><input {...bind("cur")} /></Field>
        <Field label="New password" error={touched && errors.next}><input {...bind("next")} /></Field>
        <Field label="Confirm new password" error={touched && errors.conf}><input {...bind("conf")} /></Field>
        {error && <p className="text-[12.5px] font-semibold text-[#c0121f]" role="alert">{error}</p>}
        <div className="grid grid-cols-2 gap-6">
          <button type="submit" className={btnPrimary}>Update</button>
          <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
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
            <div className="grid grid-cols-2 gap-6">
              <button className={btnDanger} onClick={logout}>Log out</button>
              <button className={btnSecondary} onClick={() => setModal(null)}>Cancel</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default function HomeLibrarian() {
  const [books, setBooks] = useState([]);
  const [apiError, setApiError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toEdit, setToEdit] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");
  const [transactions, setTransactions] = useState([]);
  const [tab, setTab] = useState("overview");
  const [borrowerView, setBorrowerView] = useState("lookup");
  const [students, setStudents] = useState([]);
  const [studentQuery, setStudentQuery] = useState("");
  const [studentPage, setStudentPage] = useState(1);
  const [issueCtx, setIssueCtx] = useState(null);
  const [studentEmail, setStudentEmail] = useState(null);
  const [showImport, setShowImport] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [profile, setProfile] = useState(null);
  const [toast, setToast] = useState("");
  const [bookSort, setBookSort] = useState({ key: "title", dir: "asc" });

  const notify = (m) => {
    setToast(m);
    setTimeout(() => setToast(""), 3500);
  };

  const reload = () => {
    Promise.all([api(), api("", {}, BORROW_API).catch(() => [])])
      .then(([bookData, txData]) => {
        const txs = Array.isArray(txData) ? txData : [];
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
      .catch((e) => setApiError(e.message));
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
    return () => window.removeEventListener("focus", reload);
  }, []);

  const q = query.trim().toLowerCase();
  const filteredBooks = books.filter(
    (b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
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
    try {
      await api(`/${t.id}/return`, { method: "PUT" }, BORROW_API);
      reload();
      notify(t.fine > 0 ? `Returned "${t.title}". Fine due: ${peso(t.fine)}.` : `Returned "${t.title}".`);
    } catch (e) { notify(e.message); }
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

  const filteredTx = transactions.filter(
    (t) => statusFilter === "All Statuses" || (statusFilter === "Overdue" ? t.overdue : t.status === statusFilter)
  );
  const txCount = (f) =>
    f === "All Statuses" ? transactions.length
    : f === "Overdue" ? transactions.filter((t) => t.overdue).length
    : transactions.filter((t) => t.status === f).length;

  const bookCols = [
    { key: "cover", label: "", render: (r) => <Cover colors={r.cover} image={r.image} /> },
    { key: "title", label: "Title", sortable: true, render: (r) => <strong>{r.title}</strong> },
    { key: "author", label: "Author", sortable: true },
    { key: "publisher", label: "Publisher", sortable: true },
    { key: "category", label: "Category", sortable: true },
    { key: "published", label: "Published Date", sortable: true, render: (r) => fmt(r.published) },
    { key: "status", label: "Status", sortable: true, render: (r) => <Badge status={r.status} /> },
    {
      key: "actions",
      label: "Actions",
      render: (r) => (
        <span className="inline-flex gap-2.5">
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
        </span>
      ),
    },
  ];

  const txCols = [
    { key: "cover", label: "", render: (r) => <Cover colors={r.cover} image={books.find((b) => b.id === r.bookId)?.image} /> },
    { key: "title", label: "Title", sortable: true, render: (r) => <strong>{r.title}</strong> },
    { key: "borrower", label: "Borrower", sortable: true },
    { key: "borrowedOn", label: "Borrowed On", sortable: true, render: (r) => fmt(r.borrowedOn) },
    { key: "due", label: "Due", sortable: true, render: (r) => fmt(r.due) },
    { key: "returned", label: "Return Date", sortable: true, render: (r) => fmt(r.returned) },
    { key: "status", label: "Status", sortable: true, render: (r) => <Badge status={r.status} overdue={r.overdue} /> },
    {
      key: "fine",
      label: "Fine",
      sortable: true,
      render: (r) => (r.fine > 0 ? `${peso(r.fine)} (${r.daysOverdue}d late)${r.finePaid ? " · PAID" : ""}` : "-"),
    },
    { key: "actions", label: "Actions", render: (r) => <TxActions t={r} onReturn={returnTx} onPayFine={payFine} /> },
  ];

  const notes = buildNotifications(transactions, books);
  const overdueTotal = transactions.filter((t) => t.overdue).length;

  const sq = studentQuery.trim().toLowerCase();
  const foundStudents = students.filter(
    (s) => !sq || s.fullName.toLowerCase().includes(sq) || s.email.toLowerCase().includes(sq) || (s.phone || "").includes(sq)
  );
  const sPages = Math.max(1, Math.ceil(foundStudents.length / ROWS_PER_PAGE));
  const sCur = Math.min(studentPage, sPages);
  const shownStudents = foundStudents.slice((sCur - 1) * ROWS_PER_PAGE, sCur * ROWS_PER_PAGE);
  const openStudent = students.find((s) => s.email === studentEmail);

  const goStat = (label) => {
    if (label === "Total Books") setTab("books");
    else if (label === "Available") { setBookSort({ key: "status", dir: "asc" }); setTab("books"); }
    else if (label === "Students") { setTab("borrowers"); setBorrowerView("lookup"); }
    else {
      setTab("borrowers");
      setBorrowerView("transactions");
      setStatusFilter(label === "Borrowed" ? "Not Returned" : label === "Overdue" ? "Overdue" : "All Statuses");
    }
  };

  const onAction = (k) => {
    if (k === "issue") setIssueCtx({});
    else if (k === "add") setShowModal(true);
    else if (k === "import") setShowImport(true);
    else { setTab("borrowers"); setBorrowerView("lookup"); }
  };

  const chip = (active, danger) =>
    `cursor-pointer rounded-full border px-3.5 py-1.5 text-[13px] font-semibold ${
      active ? (danger ? "border-[#c0121f] bg-[#c0121f] text-white" : "border-[#4a1f1f] bg-[#4a1f1f] text-white")
             : (danger ? "border-[#c0121f] bg-white text-[#c0121f]" : "border-[#4a1f1f] bg-white text-[#4a1f1f]")}`;

  return (
    <div className="min-h-screen bg-white font-sans text-[#1b1b1b]">
      <Navbar role="librarian" notificationCount={notes.length} onNotifications={() => setShowNotes(true)} />

      <main className="mx-auto max-w-[1100px] p-6">
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <h1 className="text-[26px] font-bold md:text-[34px]">
              {greeting()}, {profile?.firstName?.trim() || "Librarian"}
            </h1>
            <p className="text-sm italic text-gray-500">Keeper of the Hogwarts Library</p>
          </div>
        </div>

        <nav className="mb-6 flex gap-1 border-b border-[#d8d8d8]" aria-label="Sections">
          {TABS.map(([k, label]) => (
            <button
              key={k}
              onClick={() => { if (k === "books") setBookSort({ key: "title", dir: "asc" }); setTab(k); }}
              className={`cursor-pointer border-0 border-b-2 bg-transparent px-4 py-2.5 text-sm font-semibold ${
                tab === k ? "border-[#4a1f1f] text-[#4a1f1f]" : "border-transparent text-gray-500 hover:text-[#4a1f1f]"
              }`}
            >
              {label}
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
          <Overview books={books} transactions={transactions} students={students} onAction={onAction} onStat={goStat} />
        )}

        {tab === "books" && (
          <section className="mb-10">
            <div className="mb-3 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between">
              <h2 className="text-xl font-bold">Book Catalog</h2>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="search"
                  placeholder="Search by title or author"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className={`${selectSm} w-full md:w-60`}
                />
                <button className={btnSecondary} onClick={() => setShowImport(true)}>Bulk Import</button>
                <button className={btnPrimary} onClick={() => setShowModal(true)}>+ Add Book</button>
              </div>
            </div>
            <p className="mb-2 text-[13px] text-gray-500">
              {filteredBooks.length} {filteredBooks.length === 1 ? "title" : "titles"} in the catalog
            </p>
            <SortableTable
              key={`${bookSort.key}-${bookSort.dir}`}
              columns={[
                ...bookCols.slice(0, -2),
                { key: "copies", label: "Copies", render: (r) => `${copiesLeft(r)} of ${r.totalCopies ?? 1}` },
                ...bookCols.slice(-2),
                {
                  key: "issue",
                  label: "Issue",
                  render: (r) => (
                    <button className={`${btnSmall} py-1.5`} disabled={copiesLeft(r) < 1} onClick={() => setIssueCtx({ book: r })}>
                      Issue
                    </button>
                  ),
                },
              ]}
              rows={filteredBooks}
              resetKey={query}
              defaultSort={bookSort}
              emptyText={books.length === 0 ? "No books yet. Select + Add Book to add one." : undefined}
            />
          </section>
        )}

        {tab === "borrowers" && (
          <section className="mb-10">
            <div className="mb-4 flex gap-2">
              <button className={chip(borrowerView === "lookup")} onClick={() => setBorrowerView("lookup")}>Lookup</button>
              <button className={chip(borrowerView === "transactions")} onClick={() => setBorrowerView("transactions")}>Transactions</button>
            </div>

            {borrowerView === "lookup" && (
              <>
                <input
                  type="search"
                  placeholder="Search by name, email, or phone"
                  value={studentQuery}
                  onChange={(e) => { setStudentQuery(e.target.value); setStudentPage(1); }}
                  className={`${selectSm} mb-3 w-full md:w-80`}
                />
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
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4a1f1f] font-bold text-white">
                            {s.fullName.charAt(0).toUpperCase()}
                          </span>
                          <span className="min-w-0 flex-1">
                            <strong className="block">{s.fullName}</strong>
                            <span className="block truncate text-xs text-gray-600">{s.email}</span>
                            <span className="block text-xs text-gray-600">{s.phone}</span>
                          </span>
                          <span className="flex flex-col items-end gap-1">
                            <span className="rounded-full bg-[#4a1f1f] px-2.5 py-[3px] text-[11px] font-bold text-white">{active.length}/{MAX_LOANS} books</span>
                            {od > 0 && <span className="rounded-full bg-[#c0121f] px-2.5 py-[3px] text-[11px] font-bold text-white">{od} overdue</span>}
                          </span>
                        </button>
                      );
                    })}
                    <Pagination page={sCur} totalPages={sPages} onChange={setStudentPage} />
                  </div>
                )}
              </>
            )}

            {borrowerView === "transactions" && (
              <>
                <div className="mb-3 flex flex-wrap gap-2">
                  {["All Statuses", "Not Returned", "Overdue", "Returned"].map((f) => (
                    <button key={f} className={chip(statusFilter === f, f === "Overdue")} onClick={() => setStatusFilter(f)}>
                      {f === "All Statuses" ? "All" : f} ({txCount(f)})
                    </button>
                  ))}
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

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 rounded-md bg-[#1b1b1b] px-4 py-2.5 text-[13px] font-semibold text-white shadow-lg" role="status">
          {toast}
        </div>
      )}

      {showModal && <BookFormModal onClose={() => setShowModal(false)} onSave={addBook} />}
      {toEdit && <BookFormModal key={toEdit.id} book={toEdit} onClose={() => setToEdit(null)} onSave={saveEdit} />}
      {toDelete && <ConfirmDeleteModal book={toDelete} onCancel={() => setToDelete(null)} onConfirm={deleteBook} />}
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
      {openStudent && (
        <StudentModal
          student={openStudent}
          transactions={transactions}
          onClose={() => setStudentEmail(null)}
          onIssue={(s) => setIssueCtx({ student: s })}
          onReturn={returnTx}
          onPayFine={payFine}
        />
      )}
      {showImport && (
        <ImportModal
          books={books}
          onClose={() => setShowImport(false)}
          onDone={(msg) => { setShowImport(false); reload(); notify(msg); }}
        />
      )}
      {showNotes && <NotificationsModal notes={notes} onClose={() => setShowNotes(false)} />}
    </div>
  );
}