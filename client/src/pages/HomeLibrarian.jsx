import { useEffect, useMemo, useRef, useState } from "react";
import crest from "../assets/crest.webp"

// ---------- Data ----------
// cover = [background, accent] colors used for the placeholder book cover
const initialBooks = [];

const transactions = [];

// ---------- Shared Tailwind class strings ----------
const selectSm = "rounded-md border border-[#2b2b2b] bg-white px-2.5 py-[7px] text-[13px]";
const inputBase =
  "block w-full rounded border bg-white px-2.5 py-2 text-[13px] font-normal placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0b4a8b]";
const btnBase = "cursor-pointer rounded-sm px-3 py-[9px] text-[13px] font-bold";
const btnPrimary = `${btnBase} border border-[#eea51c] bg-[#eea51c] text-white hover:bg-[#d8940f]`;
const btnSecondary = `${btnBase} border border-[#2b2b2b] bg-white text-[#1b1b1b] hover:bg-gray-100`;
const btnDanger = `${btnBase} border border-[#c0121f] bg-[#c0121f] text-white hover:bg-[#9c0e19]`;
const btnSmall = "cursor-pointer rounded-sm border border-[#2b2b2b] bg-white px-3.5 text-xs font-bold text-[#1b1b1b] hover:bg-gray-100";

// ---------- Sortable table ----------

// columns: [{ key, label, sortable?, render?(row) }]
function SortableTable({ columns, rows, defaultSort, emptyText }) {
  const [sort, setSort] = useState(defaultSort);

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

  const toggle = (key) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));

  return (
    <>
      <div className="mb-2 flex items-center justify-end gap-2 text-[13px]">
        <label className="flex items-center gap-2">
          Sort by
          <select className={selectSm} value={sort.key} onChange={(e) => setSort({ ...sort, key: e.target.value })}>
            {sortable.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
        <select
          className={selectSm}
          aria-label="Sort order"
          value={sort.dir}
          onChange={(e) => setSort({ ...sort, dir: e.target.value })}
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
            {sorted.map((row) => (
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
    </>
  );
}

// ---------- Small pieces ----------

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

const Cover = ({ colors, image }) => {
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
};

const Badge = ({ status, overdue }) => {
  const kind = overdue ? "overdue" : status.toLowerCase().replace(" ", "-");
  return (
    <span className={`inline-block rounded-full px-2.5 py-[3px] text-[11px] font-bold text-white ${BADGE_COLORS[kind]}`}>
      {status}
    </span>
  );
};

// ---------- Validation ----------

const CATEGORIES = ["Fiction", "Non-Fiction", "Science Fiction", "Fantasy", "Mystery", "Biography", "History", "Science"];
const EMPTY_FORM = { title: "", author: "", publisher: "", category: "", published: "", description: "", image: "" };
const DESC_MAX = 300;
const todayISO = () => new Date().toISOString().slice(0, 10);

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

// ---------- Modals ----------

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
        }
      : EMPTY_FORM
  );
  const [touched, setTouched] = useState({});
  const [upload, setUpload] = useState(isData ? { name: "Uploaded image", data: book.image } : null); // { name, data } for a chosen file
  const [fileError, setFileError] = useState("");
  const [imgOk, setImgOk] = useState(null);
  const firstRef = useRef(null);
  const fileRef = useRef(null);
  const errors = validate(upload ? { ...form, image: "" } : form);
  const previewSrc = upload ? upload.data : form.image.trim() && !errors.image ? form.image.trim() : "";

  // useEffect(() => { setImgOk(null); }, [previewSrc]);

  const pickFile = (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return setFileError("Choose an image file (PNG, JPG or WEBP).");
    if (file.size > 2 * 1024 * 1024) return setFileError("Image must be 2 MB or smaller.");
    const reader = new FileReader();
    reader.onload = () => { setUpload({ name: file.name, data: reader.result }); setFileError(""); };
    reader.readAsDataURL(file);
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

  const submit = (e) => {
    e.preventDefault();
    setTouched(Object.fromEntries(Object.keys(EMPTY_FORM).map((k) => [k, true])));
    if (Object.keys(errors).length) return;
    onSave({
      title: form.title.trim(),
      author: form.author.trim(),
      publisher: form.publisher.trim(),
      category: form.category,
      published: form.published,
      description: form.description.trim(),
      image: upload ? upload.data : form.image.trim(),
    });
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

        <div className="mt-1.5 grid grid-cols-2 gap-6">
          <button type="submit" className={btnPrimary}>{editing ? "Edit Book" : "Add Book"}</button>
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

// ---------- Page ----------

export default function HomeLibrarian() {
  const [books, setBooks] = useState(initialBooks);
  const [showModal, setShowModal] = useState(false);
  const [toDelete, setToDelete] = useState(null);
  const [toEdit, setToEdit] = useState(null);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All Statuses");

  const q = query.trim().toLowerCase();
  const filteredBooks = books.filter(
    (b) => !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q)
  );
  const availableCount = books.filter((b) => b.status === "Available").length;
  const borrowedCount = transactions.filter((t) => t.status === "Not Returned").length;
  const overdueCount = transactions.filter((t) => t.overdue).length;
  const liveStats = [
    { label: "Total Books", value: books.length, bg: "bg-[#e4f1ee]" },
    { label: "Borrowed", value: borrowedCount, bg: "bg-[#dedaf4]" },
    { label: "Overdue", value: overdueCount, bg: "bg-[#ffadad]" },
    { label: "Available", value: availableCount, bg: "bg-[#ffd6a5]" },
  ];
  const saveEdit = (f) => {
    setBooks((prev) => prev.map((b) => (b.id === toEdit.id ? { ...b, ...f } : b)));
    setToEdit(null);
  };
  const deleteBook = () => {
    setBooks((prev) => prev.filter((b) => b.id !== toDelete.id));
    setToDelete(null);
  };
  const addBook = (f) => {
    setBooks((prev) => [...prev, { id: Date.now(), ...f, status: "Available", cover: ["#4a1f1f", "#eea51c"] }]);
    setShowModal(false);
  };
  const filteredTx = transactions.filter((t) => statusFilter === "All Statuses" || t.status === statusFilter);

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
            onClick={() => setToDelete(r)}
          >
            <TrashIcon />
          </button>
        </span>
      ),
    },
  ];

  const txCols = [
    { key: "cover", label: "", render: (r) => <Cover colors={r.cover} image={r.image} /> },
    { key: "title", label: "Title", sortable: true, render: (r) => <strong>{r.title}</strong> },
    { key: "borrower", label: "Borrower", sortable: true },
    { key: "borrowedOn", label: "Borrowed On", sortable: true, render: (r) => fmt(r.borrowedOn) },
    { key: "due", label: "Due", sortable: true, render: (r) => fmt(r.due) },
    { key: "returned", label: "Return Date", sortable: true, render: (r) => fmt(r.returned) },
    { key: "status", label: "Status", sortable: true, render: (r) => <Badge status={r.status} overdue={r.overdue} /> },
  ];

  return (
    <div className="min-h-screen bg-white font-sans text-[#1b1b1b]">
      <header className="flex items-center justify-between bg-[#4a1f1f] px-6 py-2.5 text-white">
        <div className="flex items-center gap-2.5">
          <img
              src={crest}
              alt="Hogwarts Library crest"
              className="h-9.5 w-auto object-contain"
            />
          <div>
            <div className="font-serif text-lg">Hogwarts Library</div>
            <div className="text-[11px] font-semibold opacity-90">Knowledge is the truest magic.</div>
          </div>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-white text-base text-[#4a1f1f]" aria-label="Account">👤</div>
      </header>

      <main className="mx-auto max-w-[1100px] p-6">
        <div className="mb-5 flex items-center justify-between">
          <h1 className="text-[26px] font-bold md:text-[34px]">Librarian Dashboard</h1>
          <button
            className="cursor-pointer rounded-md border-0 bg-[#0b4a8b] px-[18px] py-2.5 font-semibold text-white hover:bg-[#083a6f]"
            onClick={() => setShowModal(true)}
          >
            + Add Book
          </button>
        </div>

        <section className="mb-8 grid grid-cols-2 gap-5 md:grid-cols-4">
          {liveStats.map((s) => (
            <div key={s.label} className={`flex flex-col gap-1.5 rounded-xl px-[18px] py-3.5 ${s.bg}`}>
              <span className="text-[13px] font-semibold">{s.label}</span>
              <strong className="text-[32px] font-bold">{s.value}</strong>
            </div>
          ))}
        </section>

        <section className="mb-10">
          <div className="mb-3 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">Book Catalog</h2>
            <input
              type="search"
              placeholder="Search by title or author"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`${selectSm} w-full md:w-60`}
            />
          </div>
          <SortableTable
            columns={bookCols}
            rows={filteredBooks}
            defaultSort={{ key: "title", dir: "asc" }}
            emptyText={books.length === 0 ? "No books yet. Select + Add Book to add one." : undefined}
          />
        </section>

        <section className="mb-10">
          <div className="mb-3 flex flex-col items-stretch gap-2 md:flex-row md:items-center md:justify-between">
            <h2 className="text-xl font-bold">Transaction History</h2>
            <select className={selectSm} value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
              <option>All Statuses</option>
              <option>Not Returned</option>
              <option>Returned</option>
            </select>
          </div>
          <SortableTable
            columns={txCols}
            rows={filteredTx}
            defaultSort={{ key: "borrowedOn", dir: "desc" }}
            emptyText={transactions.length === 0 ? "No transactions yet." : undefined}
          />
        </section>
      </main>

      {showModal && <BookFormModal onClose={() => setShowModal(false)} onSave={addBook} />}
      {toEdit && <BookFormModal key={toEdit.id} book={toEdit} onClose={() => setToEdit(null)} onSave={saveEdit} />}
      {toDelete && <ConfirmDeleteModal book={toDelete} onCancel={() => setToDelete(null)} onConfirm={deleteBook} />}
    </div>
  );
}