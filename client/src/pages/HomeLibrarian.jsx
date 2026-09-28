import { useEffect, useMemo, useRef, useState } from "react";

// ---------- Data ----------
// cover = [background, accent] colors used for the placeholder book cover
const initialBooks = [];

const transactions = [];

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
      <div className="sort-bar">
        <label>
          Sort by
          <select value={sort.key} onChange={(e) => setSort({ ...sort, key: e.target.value })}>
            {sortable.map((c) => (
              <option key={c.key} value={c.key}>{c.label}</option>
            ))}
          </select>
        </label>
        <select
          aria-label="Sort order"
          value={sort.dir}
          onChange={(e) => setSort({ ...sort, dir: e.target.value })}
        >
          <option value="asc">A to Z</option>
          <option value="desc">Z to A</option>
        </select>
      </div>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key} aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                  {c.sortable ? (
                    <button className="th-btn" onClick={() => toggle(c.key)}>
                      {c.label}
                      <span className="arrow">{sort.key === c.key ? (sort.dir === "asc" ? "▲" : "▼") : "↕"}</span>
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((row) => (
              <tr key={row.id}>
                {columns.map((c) => (
                  <td key={c.key}>{c.render ? c.render(row) : row[c.key]}</td>
                ))}
              </tr>
            ))}
            {sorted.length === 0 && (
              <tr><td colSpan={columns.length} className="empty">{emptyText || "No results match your filters."}</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

// ---------- Page ----------

const css = `
:root {
  /* Technicolor pastel palette */
  --rose: #ffadad;
  --peach: #ffd6a5;
  --butter: #fdffb6;
  --mint: #e4f1ee;
  --sky: #d9edf8;
  --lilac: #dedaf4;
  /* Hogwarts palette */
  --rookwood: #4a1f1f;
  --blue: #0b4a8b;
  --green: #0c7a43;
  --gold: #b87a2b;
  --sunflower: #eea51c;
  --red: #c0121f;
  --ink: #1b1b1b;
  --line: #2b2b2b;
  --bg: #ffffff;
  font-family: "Inter", system-ui, -apple-system, "Segoe UI", sans-serif;
}

* { box-sizing: border-box; }
body { margin: 0; background: var(--bg); color: var(--ink); }
button, input, select { font: inherit; }

/* Top bar */
.topbar {
  background: var(--rookwood);
  color: #fff;
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 24px;
}
.brand { display: flex; align-items: center; gap: 10px; }
.crest {
  width: 34px; height: 38px; display: grid; place-items: center;
  background: var(--sunflower); color: var(--rookwood);
  font-family: Georgia, serif; font-weight: 700;
  clip-path: polygon(0 0, 100% 0, 100% 65%, 50% 100%, 0 65%);
}
.brand-name { font-family: Georgia, "Times New Roman", serif; font-size: 18px; }
.brand-tag { font-size: 11px; font-weight: 600; opacity: .9; }
.avatar {
  width: 32px; height: 32px; border-radius: 50%; background: #fff; color: var(--rookwood);
  display: grid; place-items: center; font-size: 16px;
}

/* Layout */
.content { max-width: 1100px; margin: 0 auto; padding: 24px; }
.title-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
h1 { margin: 0; font-size: 34px; font-weight: 700; }
h2 { margin: 0; font-size: 20px; font-weight: 700; }
.add-btn {
  background: var(--blue); color: #fff; border: 0; border-radius: 6px;
  padding: 10px 18px; font-weight: 600; cursor: pointer;
}
.add-btn:hover { background: #083a6f; }

/* Stat cards */
.stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 32px; }
.stat { border-radius: 12px; padding: 14px 18px; display: flex; flex-direction: column; gap: 6px; }
.stat span { font-size: 13px; font-weight: 600; }
.stat strong { font-size: 32px; font-weight: 700; }

/* Panels */
.panel { margin-bottom: 40px; }
.panel-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
.panel-head input, .panel-head select, .sort-bar select {
  border: 1px solid var(--line); border-radius: 6px; padding: 7px 10px; background: #fff; font-size: 13px;
}
.panel-head input { width: 240px; }

.sort-bar { display: flex; justify-content: flex-end; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.sort-bar label { display: flex; align-items: center; gap: 8px; }

/* Tables */
.table-wrap { border: 1px solid var(--line); border-radius: 10px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th { padding: 12px 10px; font-weight: 600; text-align: center; border-bottom: 1px solid #d8d8d8; white-space: nowrap; }
td { padding: 12px 10px; text-align: center; border-bottom: 1px solid #eee; }
tbody tr:last-child td { border-bottom: 0; }
tbody tr:hover { background: #faf6f0; }
.th-btn { background: none; border: 0; cursor: pointer; font-weight: 600; display: inline-flex; gap: 4px; align-items: center; }
.th-btn:hover, .th-btn:focus-visible { color: var(--blue); outline: none; }
.arrow { font-size: 10px; color: #777; }
th[aria-sort="ascending"] .arrow, th[aria-sort="descending"] .arrow { color: var(--blue); }
.empty { padding: 24px; color: #777; }

/* Covers */
.cover { width: 34px; height: 50px; border-radius: 3px; position: relative; overflow: hidden; margin: 0 auto; }
.cover span { position: absolute; left: 6px; right: 6px; bottom: 8px; height: 6px; border-radius: 2px; }

/* Status badges */
.badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; color: #fff; }
.badge.overdue { background: var(--red); }
.badge.available, .badge.returned { background: var(--green); }
.badge.not-returned { background: var(--sunflower); }

/* Actions */
.actions { display: inline-flex; gap: 10px; }
.icon { background: none; border: 0; cursor: pointer; padding: 2px; display: inline-flex; }
.icon:hover { opacity: .7; }
.icon.edit { color: var(--ink); }
.icon.del { color: var(--red); }

/* Modal */
.overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; padding: 24px 16px; z-index: 50; overflow-y: auto; }
.modal { background: #fff; width: 100%; max-width: 430px; margin: auto; box-shadow: 0 10px 40px rgba(0,0,0,.35); }
.modal-head { background: var(--rookwood); color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 16px 22px; }
.modal-head h2 { font-size: 18px; }
.close { background: none; border: 0; color: #fff; font-size: 26px; line-height: 1; cursor: pointer; }
.modal form { padding: 22px 24px 26px; display: flex; flex-direction: column; gap: 14px; }
.row { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; align-items: start; }
.field label { display: block; font-weight: 700; font-size: 13px; }
.field input, .field select, .field textarea {
  display: block; width: 100%; margin-top: 6px; border: 1px solid var(--line); border-radius: 4px;
  padding: 8px 10px; font-size: 13px; font-weight: 400; background: #fff; color: var(--ink);
}
.field textarea { min-height: 110px; resize: vertical; }
.field ::placeholder { color: #aaa; }
.field select.empty, .field input[type="date"].empty { color: #aaa; }
.field input:focus, .field select:focus, .field textarea:focus { outline: 2px solid var(--blue); outline-offset: 0; }
.field .invalid { border-color: var(--red); }
.err { display: block; color: var(--red); font-size: 11.5px; }
.field-foot { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; margin-top: 4px; }
.counter { margin-left: auto; font-size: 11.5px; color: #777; white-space: nowrap; }
.counter.full { color: var(--red); font-weight: 700; }
.modal-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-top: 6px; }
.btn-primary, .btn-secondary { padding: 9px 12px; font-weight: 700; font-size: 13px; cursor: pointer; border-radius: 2px; }
.btn-primary { background: var(--sunflower); border: 1px solid var(--sunflower); color: #fff; }
.btn-primary:hover { background: #d8940f; }
.btn-secondary { background: #fff; border: 1px solid var(--line); color: var(--ink); }
.btn-secondary:hover { background: #f4f4f4; }
img.cover { display: block; object-fit: cover; }
.modal.small { max-width: 380px; }
.modal-body { padding: 22px 24px 26px; }
.modal-body p { margin: 0 0 18px; font-size: 14px; line-height: 1.5; }
.btn-danger { background: var(--red); border: 1px solid var(--red); color: #fff; padding: 9px 12px; font-weight: 700; font-size: 13px; cursor: pointer; border-radius: 2px; }
.btn-danger:hover { background: #9c0e19; }
.image-row { display: flex; gap: 8px; margin-top: 6px; }
.image-row input { margin-top: 0; flex: 1; min-width: 0; }
.btn-secondary.small { padding: 0 14px; font-size: 12px; }
.preview { display: flex; align-items: center; gap: 10px; font-size: 11.5px; }
.preview img { width: 40px; height: 58px; object-fit: cover; border: 1px solid var(--line); border-radius: 3px; }
.preview .ok { color: var(--green); }

@media (max-width: 760px) {
  .stats { grid-template-columns: repeat(2, 1fr); }
  .title-row h1 { font-size: 26px; }
  .panel-head { flex-direction: column; align-items: stretch; gap: 8px; }
  .panel-head input { width: 100%; }
  .row { grid-template-columns: 1fr; }
}
`;

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
    return <img className="cover" src={image} alt="" referrerPolicy="no-referrer" onError={() => setFailed(true)} />;
  }
  return (
    <div className="cover" style={{ background: colors[0] }}>
      <span style={{ background: colors[1] }} />
    </div>
  );
};

const Badge = ({ status, overdue }) => {
  const kind = overdue ? "overdue" : status.toLowerCase().replace(" ", "-");
  return <span className={`badge ${kind}`}>{overdue && status === "Not Returned" ? "Not Returned" : status}</span>;
};

const CATEGORIES = ["Fiction", "Non-Fiction", "Science Fiction", "Fantasy", "Mystery", "Biography", "History", "Science"];
const EMPTY_FORM = { title: "", author: "", publisher: "", category: "", published: "", description: "", image: "" };
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
  else if (desc.length > 300) e.description = "Keep it under 300 characters.";

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

const DESC_MAX = 300;

function Field({ label, error, counter, children }) {
  return (
    <div className="field">
      <label>
        {label}
        {children}
      </label>
      {(error || counter) && (
        <div className="field-foot">
          {error ? <span className="err" role="alert">{error}</span> : <span />}
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

  useEffect(() => { setImgOk(null); }, [previewSrc]);

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

  const bind = (k) => ({
    value: form[k],
    onChange: (e) => setForm({ ...form, [k]: e.target.value }),
    onBlur: () => setTouched({ ...touched, [k]: true }),
    className: (touched[k] && errors[k] ? "invalid " : "") + (form[k] ? "" : "empty"),
    "aria-invalid": !!(touched[k] && errors[k]),
  });
  const err = (k) => touched[k] && errors[k];

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

  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-book-title">
        <div className="modal-head">
          <h2 id="add-book-title">{editing ? "Edit Book" : "Add Book"}</h2>
          <button type="button" className="close" aria-label="Close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={submit} noValidate>
          <Field label="Book Title" error={err("title")}>
            <input ref={firstRef} type="text" placeholder="Enter a Book Title" {...bind("title")} />
          </Field>

          <div className="row">
            <Field label="Author Name" error={err("author")}>
              <input type="text" placeholder="Enter a Author Name" {...bind("author")} />
            </Field>
            <Field label="Publisher" error={err("publisher")}>
              <input type="text" placeholder="Enter a Publisher Name" {...bind("publisher")} />
            </Field>
          </div>

          <div className="row">
            <Field label="Category" error={err("category")}>
              <select {...bind("category")}>
                <option value="" disabled>Choose a Category</option>
                {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Date Published" error={err("published")}>
              <input type="date" max={todayISO()} {...bind("published")} />
            </Field>
          </div>

          <Field
            label="Description"
            error={err("description")}
            counter={<span className={"counter" + (form.description.length >= DESC_MAX ? " full" : "")}>{form.description.length}/{DESC_MAX}</span>}
          >
            <textarea placeholder="Enter a short description..." maxLength={DESC_MAX} {...bind("description")} />
          </Field>

          <Field label="Image Upload" error={fileError || err("image")}>
            <div className="image-row">
              <input
                type="text"
                placeholder="Image Link"
                {...bind("image")}
                value={upload ? upload.name : form.image}
                readOnly={!!upload}
              />
              {upload ? (
                <button type="button" className="btn-secondary small" onClick={clearUpload}>Remove</button>
              ) : (
                <button type="button" className="btn-secondary small" onClick={() => fileRef.current?.click()}>Browse</button>
              )}
            </div>
          </Field>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={pickFile} />
          {previewSrc && (
            <div className="preview">
              <img src={previewSrc} alt="Cover preview" referrerPolicy="no-referrer" onLoad={() => setImgOk(true)} onError={() => setImgOk(false)} />
              <span className={imgOk === false ? "err" : "ok"}>
                {imgOk === false
                  ? "Couldn't load this image. Use a direct image link (ends in .jpg or .png), or browse a file."
                  : imgOk ? "Image loaded." : "Loading preview..."}
              </span>
            </div>
          )}

          <div className="modal-actions">
            <button type="submit" className="btn-primary">{editing ? "Edit Book" : "Add Book"}</button>
            <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          </div>
        </form>
      </div>
    </div>
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
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
      <div className="modal small" role="alertdialog" aria-modal="true" aria-labelledby="delete-title" aria-describedby="delete-desc">
        <div className="modal-head">
          <h2 id="delete-title">Delete Book</h2>
          <button type="button" className="close" aria-label="Close" onClick={onCancel}>×</button>
        </div>
        <div className="modal-body">
          <p id="delete-desc">
            Delete <strong>{book.title}</strong> from the catalog? This can't be undone.
          </p>
          <div className="modal-actions">
            <button type="button" className="btn-danger" onClick={onConfirm}>Delete</button>
            <button type="button" className="btn-secondary" ref={cancelRef} onClick={onCancel}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

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
    { label: "Total Books", value: books.length, color: "var(--mint)" },
    { label: "Borrowed", value: borrowedCount, color: "var(--lilac)" },
    { label: "Overdue", value: overdueCount, color: "var(--rose)" },
    { label: "Available", value: availableCount, color: "var(--peach)" },
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
        <span className="actions">
          <button aria-label={`Edit ${r.title}`} className="icon edit" onClick={() => setToEdit(r)}><EditIcon /></button>
          <button aria-label={`Delete ${r.title}`} className="icon del" onClick={() => setToDelete(r)}><TrashIcon /></button>
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
    <div className="app">
      <style>{css}</style>
      <header className="topbar">
        <div className="brand">
          <div className="crest" aria-hidden="true">H</div>
          <div>
            <div className="brand-name">Hogwarts Library</div>
            <div className="brand-tag">Knowledge is the truest magic.</div>
          </div>
        </div>
        <div className="avatar" aria-label="Account">👤</div>
      </header>

      <main className="content">
        <div className="title-row">
          <h1>Librarian Dashboard</h1>
          <button className="add-btn" onClick={() => setShowModal(true)}>+ Add Book</button>
        </div>

        <section className="stats">
          {liveStats.map((s) => (
            <div key={s.label} className="stat" style={{ background: s.color }}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Book Catalog</h2>
            <input
              type="search"
              placeholder="Search by title or author"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <SortableTable
            columns={bookCols}
            rows={filteredBooks}
            defaultSort={{ key: "title", dir: "asc" }}
            emptyText={books.length === 0 ? "No books yet. Select + Add Book to add one." : undefined}
          />
        </section>

        <section className="panel">
          <div className="panel-head">
            <h2>Transaction History</h2>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} aria-label="Filter by status">
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