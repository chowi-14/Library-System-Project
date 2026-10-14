import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Camera, ChevronLeft, ChevronRight, Eye, EyeOff, Heart, KeyRound, LogOut, Search, SquarePen, UserPlus, UserRound, X } from "lucide-react"
import Navbar from "../components/Navbar"
import { useAuth } from "../context/useAuth"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^(09\d{9}|\+639\d{9})$/
const NAME_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/


const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"] // match yearLevelOptions in profile.dart

const ROLE_FIELDS = {
    student: [
        { name: "id_number", label: "Student ID" },
        { name: "email", label: "Email", type: "email" },
        { name: "course", label: "Course" },
        { name: "year_level", label: "Year level", options: YEAR_LEVELS },
    ],
    professor: [
        { name: "id_number", label: "Employee ID" },
        { name: "email", label: "Faculty email", type: "email" },
        { name: "department", label: "Department" },
    ],
    librarian: [
        { name: "id_number", label: "Employee ID" },
        { name: "email", label: "Faculty email", type: "email" },
    ],
}

const validate = (v, role) => {
    const e = {}

    if (!v.firstName.trim()) e.firstName = "First name is required."
    else if (!NAME_RE.test(v.firstName.trim())) e.firstName = "Use letters only."

    if (!v.lastName.trim()) e.lastName = "Last name is required."
    else if (!NAME_RE.test(v.lastName.trim())) e.lastName = "Use letters only."

    if (!v.email.trim()) e.email = "Email is required."
    else if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address."

    const phone = v.phone_number.replace(/[\s-]/g, "")
    if (!phone) e.phone_number = "Phone number is required."
    else if (!PHONE_RE.test(phone)) e.phone_number = "Use 09XXXXXXXXX or +639XXXXXXXXX."

    for (const f of ROLE_FIELDS[role] ?? []) {
        if (f.name === "email") continue
        if (!String(v[f.name] ?? "").trim())
            e[f.name] = f.options ? "Choose your year level." : `${f.label} is required.`
    }

    return e
}

function Field({ label, name, value, error, editing, onChange, type = "text", options }) {
    const cls = `mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold outline-none ${
        error
            ? "border-red-700"
            : editing
            ? "border-[#4a1a1f] focus:ring-2 focus:ring-[#4a1a1f]/30"
            : "border-[#4a1a1f]/40 bg-white/70"
    }`
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-bold text-[#4a1a1f]">
                {label}
            </label>
            {options && editing ? (
                <select id={name} name={name} value={value} onChange={onChange} aria-invalid={!!error} className={cls}>
                    <option value="">Select...</option>
                    {options.map((o) => (
                        <option key={o} value={o}>{o}</option>
                    ))}
                </select>
            ) : (
                <input
                    id={name}
                    name={name}
                    type={type}
                    value={value}
                    readOnly={!editing}
                    onChange={onChange}
                    aria-invalid={!!error}
                    className={cls}
                />
            )}
            {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
        </div>
    )
}

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api"

const btnGhost = "rounded-lg border border-[#4a1a1f]/25 bg-white px-4 py-2.5 text-sm font-bold text-[#4a1a1f] transition hover:bg-[#F7DDB8]/40 disabled:cursor-not-allowed disabled:opacity-60"
const btnSolid = "rounded-lg bg-[#4a1a1f] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#3a1717] disabled:cursor-not-allowed disabled:opacity-60"
const btnRed = "rounded-lg bg-[#E00000] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#b80000] disabled:cursor-not-allowed disabled:opacity-60"

let modalLocks = 0

function ModalShell({ title, subtitle, titleId, onClose, footer, small, bare, role = "dialog", z = "z-50", children }) {
    const timer = useRef(null)

    useEffect(() => {
        modalLocks++
        document.body.style.overflow = "hidden"
        return () => {
            clearTimeout(timer.current)
            modalLocks--
            if (modalLocks === 0) document.body.style.overflow = ""
        }
    }, [])

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose()
        window.addEventListener("keydown", onKey)
        return () => window.removeEventListener("keydown", onKey)
    }, [onClose])

    const onScroll = (e) => {
        const el = e.currentTarget
        el.classList.add("is-scrolling")
        clearTimeout(timer.current)
        timer.current = setTimeout(() => el.classList.remove("is-scrolling"), 800)
    }

    return (
        <div
            className={`fixed inset-0 ${z} flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm`}
            onMouseDown={(e) => e.target === e.currentTarget && onClose()}
        >
            <style>{`@keyframes modal-pop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}`}</style>
            <div
                role={role}
                aria-modal="true"
                aria-labelledby={titleId}
                style={{ animation: "modal-pop .2s ease-out" }}
                className={`relative flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl ${small ? "max-w-sm" : "max-w-md"}`}
            >
                {bare ? (
                    <h2 id={titleId} className="px-6 pt-6 text-xl font-bold text-[#2b0f12]">{title}</h2>
                ) : (
                    <>
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close"
                            className="absolute right-4 top-4 z-10 rounded-full bg-black/5 p-2 text-gray-700 transition hover:bg-black/10"
                        >
                            <X size={18} />
                        </button>
                        <div className="shrink-0 border-b border-[#4a1a1f]/10 bg-[#F7DDB8]/40 px-6 py-5 pr-16">
                            <h2 id={titleId} className="text-xl font-bold text-[#2b0f12]">{title}</h2>
                            {subtitle && <p className="mt-1 text-xs text-[#4a1a1f]/70">{subtitle}</p>}
                        </div>
                    </>
                )}
                <div className="hover-scroll min-h-0 flex-1 overflow-y-auto" onScroll={onScroll}>
                    {children}
                </div>
                {footer && (
                    <div className={`shrink-0 bg-white px-6 py-4 ${bare ? "" : "border-t border-[#4a1a1f]/10"}`}>
                        {footer}
                    </div>
                )}
            </div>
        </div>
    )
}

function PasswordInput({ value, onChange, hasError }) {
    const [show, setShow] = useState(false)
    return (
        <div className="relative mt-1">
            <input
                type={show ? "text" : "password"}
                value={value}
                onChange={onChange}
                className={`h-10 w-full rounded-lg border bg-white px-3 pr-10 text-sm font-semibold outline-none ${
                    hasError ? "border-red-700" : "border-[#4a1a1f]"
                }`}
            />
            <button
                type="button"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
                className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#4a1a1f]"
            >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
        </div>
    )
}

function PasswordModal({ ask, onClose, onDone }) {
    const [f, setF] = useState({ cur: "", next: "", conf: "" })
    const [touched, setTouched] = useState(false)
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const errors = {
        cur: !f.cur && "Required",
        next:
            f.next.length < 8 ? "At least 8 characters"
            : !/[A-Za-z]/.test(f.next) || !/[0-9]/.test(f.next) ? "Use letters and numbers"
            : f.next === f.cur ? "Must differ from current" : "",
        conf: f.conf !== f.next && "Passwords don't match",
    }

    const submit = (e) => {
        e.preventDefault()
        setTouched(true)
        if (Object.values(errors).some(Boolean)) return
        ask("Change Password", "Change your password?", "Yes, change", send)
    }

    const send = async () => {
        setSaving(true)
        setError("")
        try {
            const res = await fetch(`${API}/auth/password`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({ currentPassword: f.cur, newPassword: f.next }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || "Could not change password.")
            onDone()
        } catch (err) {
            setError(err.message === "Failed to fetch" ? "Cannot reach the server." : err.message)
            setSaving(false)
        }
    }

    const rows = [
        ["cur", "Current password"],
        ["next", "New password"],
        ["conf", "Confirm new password"],
    ]

        return (
        <ModalShell
            title="Change Password"
            subtitle="Use at least 8 characters with letters and numbers."
            titleId="password-title"
            onClose={onClose}
            footer={
                <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
                    <button
                        type="submit"
                        form="password-form"
                        disabled={saving || !(f.cur || f.next || f.conf)}
                        className={btnSolid}
                    >
                        {saving ? "Updating..." : "Update"}
                    </button>
                </div>
            }
        >
            <form id="password-form" onSubmit={submit} noValidate className="flex flex-col gap-4 px-6 py-5">
                {rows.map(([k, label]) => (
                    <div key={k}>
                        <label className="block text-sm font-bold text-[#4a1a1f]">{label}</label>
                        <PasswordInput
                            value={f[k]}
                            onChange={(e) => setF({ ...f, [k]: e.target.value })}
                            hasError={touched && !!errors[k]}
                        />
                        {touched && errors[k] && <p className="mt-1 text-xs text-red-700">{errors[k]}</p>}
                    </div>
                ))}
                {error && <p className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700" role="alert">{error}</p>}
            </form>
        </ModalShell>
    )
}

function AddLibrarianModal({ ask, onClose, onDone }) {
    const [f, setF] = useState({
        firstName: "", lastName: "", email: "", idNumber: "",
        phone_number: "", password: "",
    })
    const [touched, setTouched] = useState(false)
    const [error, setError] = useState("")
    const [saving, setSaving] = useState(false)

    const errors = {
        firstName: !NAME_RE.test(f.firstName.trim()) && "Enter a valid first name",
        lastName: !NAME_RE.test(f.lastName.trim()) && "Enter a valid last name",
        email: !EMAIL_RE.test(f.email.trim()) && "Enter a valid email",
        phone_number: f.phone_number && !PHONE_RE.test(f.phone_number.replace(/[\s-]/g, "")) && "Use 09XXXXXXXXX or +639XXXXXXXXX",
        password:
            f.password.length < 8 ? "At least 8 characters"
            : !/[A-Za-z]/.test(f.password) || !/[0-9]/.test(f.password) ? "Use letters and numbers" : "",
    }

    const submit = (e) => {
        e.preventDefault()
        setTouched(true)
        if (Object.values(errors).some(Boolean)) return
        ask(
            "Add Librarian",
            `Create a librarian account for ${f.firstName.trim()} ${f.lastName.trim()}?`,
            "Yes, create",
            send
        )
    }

    const send = async () => {
        setSaving(true)
        setError("")
        try {
            const res = await fetch(`${API}/auth/librarians`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
                body: JSON.stringify({
                    ...f,
                    email: f.email.trim().toLowerCase(),
                    phone_number: f.phone_number.replace(/[\s-]/g, ""),
                }),
            })
            const data = await res.json().catch(() => ({}))
            if (!res.ok) throw new Error(data.error || "Could not create librarian.")
            onDone()
        } catch (err) {
            setError(err.message === "Failed to fetch" ? "Cannot reach the server." : err.message)
            setSaving(false)
        }
    }

    const rows = [
        ["firstName", "First name", "text"],
        ["lastName", "Last name", "text"],
        ["idNumber", "Employee ID", "text"],
        ["email", "Faculty email", "email"],
        ["phone_number", "Phone number (optional)", "tel"],
        ["password", "Temporary password", "password"],
    ]

        return (
        <ModalShell
            title="Add Librarian"
            subtitle="They will be asked to change this temporary password on first login."
            titleId="add-librarian-title"
            onClose={onClose}
            footer={
                <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
                    <button type="submit" form="add-librarian-form" disabled={saving} className={btnSolid}>
                        {saving ? "Creating..." : "Create"}
                    </button>
                </div>
            }
        >
            <form id="add-librarian-form" onSubmit={submit} noValidate className="flex flex-col gap-4 px-6 py-5">
                {rows.map(([k, label, type]) => (
                    <div key={k}>
                        <label className="block text-sm font-bold text-[#4a1a1f]">{label}</label>
                        {type === "password" ? (
                            <PasswordInput
                                value={f[k]}
                                onChange={(e) => setF({ ...f, [k]: e.target.value })}
                                hasError={touched && !!errors[k]}
                            />
                        ) : (
                            <input
                                type={type}
                                value={f[k]}
                                onChange={(e) => setF({ ...f, [k]: e.target.value })}
                                className={`mt-1 h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#4a1a1f]/30 ${
                                    touched && errors[k] ? "border-red-700" : "border-[#4a1a1f]/40"
                                }`}
                            />
                        )}
                        {touched && errors[k] && <p className="mt-1 text-xs text-red-700">{errors[k]}</p>}
                    </div>
                ))}
                {error && <p className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700" role="alert">{error}</p>}
            </form>
        </ModalShell>
    )
}

const FAV_PAGE_SIZE = 10

const pageNumbers = (page, total) => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
    const shown = [...new Set([1, total, page - 1, page, page + 1])]
        .filter((p) => p >= 1 && p <= total)
        .sort((a, b) => a - b)
    return shown.flatMap((p, i) => (i > 0 && p - shown[i - 1] > 1 ? ["…", p] : [p]))
}

function FavoritesModal({ books, onClose, onSelect }) {
    const [query, setQuery] = useState("")
    const [category, setCategory] = useState("all")
    const [page, setPage] = useState(1)

    const [scrolling, setScrolling] = useState(false)
    const [thumb, setThumb] = useState({ top: 0, height: 0 })
    const listRef = useRef(null)
    const scrollTimer = useRef(null)
    const onScroll = () => {
        const el = listRef.current
        if (el && el.scrollHeight > el.clientHeight) {
            const height = Math.max(32, (el.clientHeight / el.scrollHeight) * el.clientHeight)
            const maxScroll = el.scrollHeight - el.clientHeight
            const top = (el.scrollTop / maxScroll) * (el.clientHeight - height)
            setThumb({ top, height })
        }
        setScrolling(true)
        clearTimeout(scrollTimer.current)
        scrollTimer.current = setTimeout(() => setScrolling(false), 700)
    }
    useEffect(() => () => clearTimeout(scrollTimer.current), [])

    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && onClose()
        window.addEventListener("keydown", onKey)
        document.body.style.overflow = "hidden"
        return () => {
            window.removeEventListener("keydown", onKey)
            document.body.style.overflow = ""
        }
    }, [onClose])

    const categories = [...new Set(books.map((b) => b.category).filter(Boolean))].sort((a, b) =>
        a.localeCompare(b)
    )

    const q = query.trim().toLowerCase()
    const filtered = books.filter((b) => {
        if (category !== "all" && b.category !== category) return false
        if (!q) return true
        return [b.title, b.author, b.category].some((f) => (f || "").toLowerCase().includes(q))
    })

    const totalPages = Math.max(1, Math.ceil(filtered.length / FAV_PAGE_SIZE))
    const current = Math.min(page, totalPages)
    const items = filtered.slice((current - 1) * FAV_PAGE_SIZE, current * FAV_PAGE_SIZE)

    const changeQuery = (v) => { setQuery(v); setPage(1) }
    const changeCategory = (v) => { setCategory(v); setPage(1) }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <style>{`
                @keyframes modal-pop{from{opacity:0;transform:translateY(12px) scale(.97)}to{opacity:1;transform:none}}
                .fav-scroll{scrollbar-width:none}
                .fav-scroll::-webkit-scrollbar{display:none}
            `}</style>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="favorites-modal-title"
                style={{ animation: "modal-pop .2s ease-out" }}
                className="relative flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
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

                <div className="flex items-center gap-3 border-b border-[#4a1a1f]/10 bg-[#F7DDB8]/40 px-8 py-6 pr-16">
                    <Heart size={22} className="fill-red-500 text-red-500" />
                    <h2 id="favorites-modal-title" className="text-2xl font-bold text-[#2b0f12]">
                        Favorites
                    </h2>
                    <span className="rounded-full bg-[#4a1a1f]/15 px-2.5 py-0.5 text-xs font-bold text-[#4a1a1f]">
                        {books.length}
                    </span>
                </div>

                {books.length > 0 && (
                    <div className="flex flex-col gap-3 border-b border-[#4a1a1f]/10 px-6 py-4 sm:flex-row">
                        <label className="flex flex-1 items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-2 focus-within:border-[#4a1a1f]">
                            <Search size={16} className="shrink-0 text-[#4a1a1f]" />
                            <input
                                value={query}
                                onChange={(e) => changeQuery(e.target.value)}
                                placeholder="Search title or author"
                                aria-label="Search favorites"
                                className="w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                            />
                            {query && (
                                <button type="button" onClick={() => changeQuery("")} aria-label="Clear search">
                                    <X size={14} className="text-[#4a1a1f]" />
                                </button>
                            )}
                        </label>
                        <select
                            value={category}
                            onChange={(e) => changeCategory(e.target.value)}
                            aria-label="Filter by category"
                            className="rounded-full border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-[#4a1a1f] outline-none focus:border-[#4a1a1f]"
                        >
                            <option value="all">All categories</option>
                            {categories.map((c) => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="relative flex min-h-0 flex-1 flex-col">
                <div ref={listRef} onScroll={onScroll} className="fav-scroll min-h-0 flex-1 overflow-y-auto p-6">
                    {books.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-500">
                            No favorites yet. Tap the heart on a book to add it.
                        </p>
                    ) : filtered.length === 0 ? (
                        <p className="py-8 text-center text-sm text-gray-500">No favorites match your search.</p>
                    ) : (
                        <ul className="flex flex-col gap-3">
                            {items.map((b) => (
                                <li key={b.id}>
                                    <button
                                        type="button"
                                        onClick={() => onSelect(b)}
                                        aria-label={`View ${b.title}`}
                                        className="flex w-full items-center gap-4 rounded-2xl bg-gray-50 p-3 text-left transition hover:bg-[#F7DDB8]/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4a1a1f]"
                                    >
                                        {b.image ? (
                                            <img src={b.image} alt="" className="h-20 w-14 shrink-0 rounded-md object-cover shadow" />
                                        ) : (
                                            <div className="h-20 w-14 shrink-0 rounded-md bg-[#4a1a1f]/20" />
                                        )}
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-bold text-[#2b0f12]">{b.title}</p>
                                            <p className="truncate text-xs text-gray-500">by {b.author}</p>
                                            {b.category && (
                                                <span className="mt-1 inline-block rounded-full bg-[#4a1a1f]/10 px-2 py-0.5 text-[10px] font-bold text-[#4a1a1f]">
                                                    {b.category}
                                                </span>
                                            )}
                                        </div>
                                        <ChevronRight size={16} className="shrink-0 text-[#4a1a1f]/50" />
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
                <div
                    aria-hidden="true"
                    className={`pointer-events-none absolute right-1 w-1.5 rounded-full bg-[#4a1a1f]/50 transition-opacity duration-300 ${
                        scrolling && thumb.height > 0 ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ top: thumb.top, height: thumb.height }}
                />
                </div>

                {filtered.length > 0 && (
                    <div className="flex flex-col items-center gap-2 border-t border-[#4a1a1f]/10 px-6 py-3">
                        {totalPages > 1 && (
                            <nav aria-label="Favorites pagination" className="flex flex-wrap items-center justify-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => setPage(current - 1)}
                                    disabled={current === 1}
                                    className="min-w-9 rounded border border-gray-400 bg-white px-3 py-1.5 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Prev
                                </button>

                                {pageNumbers(current, totalPages).map((p, i) =>
                                    p === "…" ? (
                                        <span key={`gap-${i}`} className="px-1 text-gray-500">…</span>
                                    ) : (
                                        <button
                                            key={p}
                                            type="button"
                                            onClick={() => setPage(p)}
                                            aria-current={p === current ? "page" : undefined}
                                            className={`min-w-9 rounded border px-3 py-1.5 text-sm ${
                                                p === current
                                                    ? "border-[#4a1a1f] bg-[#4a1a1f] font-bold text-white"
                                                    : "border-gray-400 bg-white hover:bg-gray-100"
                                            }`}
                                        >
                                            {p}
                                        </button>
                                    )
                                )}

                                <button
                                    type="button"
                                    onClick={() => setPage(current + 1)}
                                    disabled={current === totalPages}
                                    className="min-w-9 rounded border border-gray-400 bg-white px-3 py-1.5 text-sm hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </nav>
                        )}
                        <p className="text-sm text-gray-500">
                            Showing {items.length} of {filtered.length}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}

function ConfirmModal({ title, message, confirmLabel = "Yes", run, onCancel }) {
    const [busy, setBusy] = useState(false)

    useEffect(() => {
        const onKey = (e) => {
            if (e.key !== "Escape") return
            e.stopImmediatePropagation()
            if (!busy) onCancel()
        }
        window.addEventListener("keydown", onKey, true)
        return () => window.removeEventListener("keydown", onKey, true)
    }, [onCancel, busy])

        return (
        <ModalShell
            title={title}
            titleId="confirm-title"
            role="alertdialog"
            z="z-[60]"
            small
            onClose={() => !busy && onCancel()}
            footer={
                <div className="grid grid-cols-2 gap-4">
                    <button type="button" disabled={busy} onClick={onCancel} className={btnGhost}>
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={busy}
                        onClick={async () => {
                            setBusy(true)
                            try { await run() } finally { onCancel() }
                        }}
                        className={btnSolid}
                    >
                        {busy ? "Working..." : confirmLabel}
                    </button>
                </div>
            }
        >
            <p className="px-6 py-5 text-sm leading-relaxed text-[#4a1a1f]/80">{message}</p>
        </ModalShell>
    )
}

export default function Profile() {
    const navigate = useNavigate()
    const { user, logout, updateProfile, updateAvatar } = useAuth()
    const [draftAvatar, setDraftAvatar] = useState(undefined) 
    const avatar = draftAvatar !== undefined ? draftAvatar : user.avatar
    const fileRef = useRef(null)
    const [showLogout, setShowLogout] = useState(false)
    const [showPassword, setShowPassword] = useState(!!user.mustChangePassword)
    const [showAddLibrarian, setShowAddLibrarian] = useState(false)
    const [showFavorites, setShowFavorites] = useState(false)
    const [confirm, setConfirm] = useState(null)
    const ask = (title, message, confirmLabel, run) => setConfirm({ title, message, confirmLabel, run })
    const [msg, setMsg] = useState("")
    const isLibrarian = user.role === "librarian"
    const roleLabel = isLibrarian
        ? (user.isHead ? "Head Librarian" : "Librarian")
        : user.role.charAt(0).toUpperCase() + user.role.slice(1)

    const [stats, setStats] = useState({ borrowed: 0, pending: 0, overdue: 0, returned: 0 })
    const [favorites, setFavorites] = useState([])
    const favoritesCount = favorites.length

    useEffect(() => {
        if (isLibrarian) return
        fetch(`${API}/books/favorites`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then((list) => setFavorites(Array.isArray(list) ? list : []))
            .catch(() => {})
    }, [isLibrarian])

    useEffect(() => {
        if (isLibrarian) return
        fetch(`${API}/borrowings`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        })
            .then((r) => (r.ok ? r.json() : []))
            .then((rows) => {
                const list = Array.isArray(rows) ? rows : []
                const loans = list.filter((r) => r.requestStatus === "approved")
                const active = loans.filter((r) => !r.returned)
                setStats({
                    borrowed: active.length,
                    pending: list.filter((r) => r.requestStatus === "pending").length,
                    overdue: active.filter((r) => r.daysOverdue > 0).length,
                    returned: loans.length - active.length,
                })
            })
            .catch(() => {})
    }, [isLibrarian])

    const initialProfile = {
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone_number: user.phone_number ?? "",
        id_number: user.id_number ?? user.idNumber ?? "",
        course: user.course ?? "",
        year_level: user.year_level ?? user.yearLevel ?? "",
        department: user.department ?? "",
        assigned_role: user.assigned_role ?? user.assignedRole ?? "",
    }

    const [profile, setProfile] = useState(initialProfile)
    const [draft, setDraft] = useState(initialProfile)
    const [editing, setEditing] = useState(false)
    const [errors, setErrors] = useState({})

    useEffect(() => {
        if (editing) return
        setProfile(initialProfile)
        setDraft(initialProfile)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user])

    const values = editing ? draft : profile

    const changed =
        draftAvatar !== undefined ||
        Object.keys(profile).some((k) => String(draft[k] ?? "").trim() !== String(profile[k] ?? "").trim())

    const startEdit = () => {
        setDraft(profile)
        setErrors({})
        setEditing(true)
    }

    const cancelEdit = () => {
        setDraftAvatar(undefined)
        setDraft(profile)
        setErrors({})
        setEditing(false)
    }

    const handleChange = (e) => {
        const next = { ...draft, [e.target.name]: e.target.value }
        setDraft(next)
        setErrors(validate(next, user.role))
    }

    const save = (e) => {
        e.preventDefault()
        const found = validate(draft, user.role)
        setErrors(found)
        if (Object.keys(found).length > 0) return
        ask("Save Changes", "Save changes to your profile?", "Yes, save", doSave)
    }

    const doSave = async () => {
        const clean = Object.fromEntries(
            Object.entries(draft).map(([k, v]) => [k, String(v ?? "").trim()])
        )

        const payload = draftAvatar !== undefined ? { ...clean, avatar: draftAvatar } : clean
        const res = await updateProfile(payload)
        if (!res.ok) return setErrors({ email: res.error })

        setDraftAvatar(undefined)
        setProfile(clean)
        setEditing(false)
    }

    const handlePhoto = (e) => {
        const file = e.target.files?.[0]
        e.target.value = ""
        if (!file) return
        const url = URL.createObjectURL(file)
        const img = new Image()
        img.onload = () => {
            const scale = Math.min(1, 400 / Math.max(img.width, img.height))
            const canvas = document.createElement("canvas")
            canvas.width = Math.round(img.width * scale)
            canvas.height = Math.round(img.height * scale)
            canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height)
            URL.revokeObjectURL(url)
            setDraftAvatar(canvas.toDataURL("image/jpeg", 0.85))
        }
        img.onerror = () => URL.revokeObjectURL(url)
        img.src = url
    }

    const handleLogout = () => {
        setShowLogout(false)
        logout()
        navigate("/login", { replace: true })
    }

    const fieldProps = { editing, onChange: handleChange }

    return (
        <div className="flex min-h-screen flex-col bg-white font-sans">
            <Navbar
                role={user.role}
                active={null}
                onNavigate={(page) => navigate("/home", { state: { page } })}
                onProfile={() => {}}
            />

            <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
                {isLibrarian && (
                    <button
                        type="button"
                        onClick={() => navigate("/home")}
                        className="inline-flex items-center gap-1 text-sm font-bold text-[#4a1a1f] hover:underline"
                    >
                        <ChevronLeft size={16} /> Back
                    </button>
                )}

                <div className="mt-6 flex flex-col items-center gap-10 md:flex-row md:items-start">
                    <div className="relative shrink-0">
                        <button
                            type="button"
                            onClick={() => editing && fileRef.current?.click()}
                            disabled={!editing}
                            aria-label="Change profile photo"
                            className={`rounded-full bg-[#4a1a1f] p-1.5 ${editing ? "cursor-pointer" : "cursor-default"}`}
                        >
                            <div className="rounded-full bg-[#F7DDB8] p-1">
                                <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-white">
                                    {avatar ? (
                                        <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserRound size={80} className="text-[#4a1a1f]" />
                                    )}
                                </div>
                            </div>
                        </button>
                        {editing && (
                            <span className="pointer-events-none absolute bottom-1 right-1 flex h-9 w-9 items-center justify-center rounded-full bg-amber-500 text-white">
                                <Camera size={17} />
                            </span>
                        )}
                        <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                        {editing && avatar && (
                            <button
                                type="button"
                                onClick={() => setDraftAvatar(null)}
                                className="mt-2 block w-full text-center text-xs font-bold text-red-700 hover:underline"
                            >
                                Remove photo
                            </button>
                        )}
                    </div>

                    <form onSubmit={save} noValidate className="w-full max-w-md flex-1">
                        <h1 className="font-['Cinzel',serif] text-4xl text-[#4a1a1f]">{user.firstName} {user.lastName}</h1>
                        <span className="mt-2 inline-block rounded-full bg-[#4a1a1f]/15 px-3 py-1 text-xs font-bold text-[#4a1a1f]">
                            {roleLabel}
                        </span>

                        {!isLibrarian && (
                            <>
                                <div className="mt-5 grid grid-cols-4 divide-x divide-[#4a1a1f]/20 rounded-lg border border-[#4a1a1f]/20 bg-[#F7DDB8]/40 py-3 text-center">
                                    {[
                                        ["Borrowed", stats.borrowed],
                                        ["Pending", stats.pending],
                                        ["Overdue", stats.overdue],
                                        ["Returned", stats.returned],
                                    ].map(([label, n]) => (
                                        <div key={label}>
                                            <p className={`text-xl font-bold ${label === "Overdue" && n > 0 ? "text-red-700" : "text-[#4a1a1f]"}`}>{n}</p>
                                            <p className="text-xs text-[#4a1a1f]/70">{label}</p>
                                        </div>
                                    ))}
                                </div>

                                <button
                                    type="button"
                                    onClick={() => setShowFavorites(true)}
                                    className="mt-4 flex w-full items-center gap-3 rounded-lg border border-[#4a1a1f]/20 bg-[#F7DDB8]/40 px-4 py-3 text-left transition hover:bg-[#F7DDB8]/70"
                                >
                                    <Heart size={18} className="fill-red-500 text-red-500" />
                                    <span className="flex-1 text-lg font-bold text-[#4a1a1f]">Favorites</span>
                                    <span className="text-sm font-bold text-[#4a1a1f]">{favoritesCount}</span>
                                    <ChevronRight size={16} className="text-[#4a1a1f]/60" />
                                </button>
                            </>
                        )}

                        <h2 className="mt-6 text-lg font-bold text-[#4a1a1f]">{roleLabel} Profile</h2>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="First Name" name="firstName" value={values.firstName} error={errors.firstName} {...fieldProps} />
                            <Field label="Last Name" name="lastName" value={values.lastName} error={errors.lastName} {...fieldProps} />
                        </div>

                        {ROLE_FIELDS[user.role]?.map((f) => (
                            <div className="mt-4" key={f.name}>
                                <Field
                                    label={f.label}
                                    name={f.name}
                                    type={f.type}
                                    options={f.options}
                                    value={values[f.name] ?? ""}
                                    error={errors[f.name]}
                                    {...fieldProps}
                                />
                            </div>
                        ))}

                        <div className="mt-4">
                            <Field label="Phone Number" name="phone_number" type="tel" value={values.phone_number} error={errors.phone_number} {...fieldProps} />
                            {!editing && (
                                <button
                                    type="button"
                                    onClick={() => { setMsg(""); setShowPassword(true) }}
                                    className="mt-4 flex w-full items-center justify-center gap-3 rounded-sm border border-[#4a1a1f] bg-white py-2 text-sm font-bold text-[#4a1a1f] hover:bg-[#f3d9c0]"
                                >
                                    Change Password <KeyRound size={16} />
                                </button>
                            )}
                            {user.isHead && !editing && (
                                <button
                                    type="button"
                                    onClick={() => { setMsg(""); setShowAddLibrarian(true) }}
                                    className="mt-3 flex w-full items-center justify-center gap-3 rounded-sm border border-[#4a1a1f] bg-white py-2 text-sm font-bold text-[#4a1a1f] hover:bg-[#f3d9c0]"
                                >
                                    Add Librarian <UserPlus size={16} />
                                </button>
                            )}
                            {msg && <p className="mt-2 text-sm font-bold text-[#0c7a43]" role="status">{msg}</p>}
                        </div>

                        {editing ? (
                            <div key="edit-actions" className="mt-6 grid grid-cols-2 gap-5">
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-sm border border-[#4a1a1f] bg-white py-2 text-sm font-bold text-[#4a1a1f] hover:bg-[#f3d9c0]"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!changed}
                                    title={!changed ? "No changes to save" : undefined}
                                    className="rounded-sm bg-[#4a1a1f] py-2 text-sm font-bold text-white hover:bg-[#3a1717] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    Save Changes
                                </button>
                            </div>
                        ) : (
                            <div key="view-actions" className="mt-6 grid grid-cols-2 gap-5">
                                <button
                                    type="button"
                                    onClick={startEdit}
                                    className="flex items-center justify-center gap-3 rounded-sm border border-[#4a1a1f] bg-white py-2 text-sm font-bold text-[#4a1a1f] hover:bg-[#f3d9c0]"
                                >
                                    Edit Profile <SquarePen size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowLogout(true)}
                                    className="flex items-center justify-center gap-3 rounded-sm bg-[#4a1a1f] py-2 text-sm font-bold text-white hover:bg-[#3a1717]"
                                >
                                    Logout <LogOut size={16} />
                                </button>
                            </div>
                        )}
                    </form>
                </div>
                {showPassword && (
                    <PasswordModal
                        ask={ask}
                        onClose={() => setShowPassword(false)}
                        onDone={() => { setShowPassword(false); setMsg("Password changed.") }}
                    />
                )}
                {showAddLibrarian && (
                    <AddLibrarianModal
                        ask={ask}
                        onClose={() => setShowAddLibrarian(false)}
                        onDone={() => { setShowAddLibrarian(false); setMsg("Librarian account created.") }}
                    />
                )}
                {showFavorites && (
                    <FavoritesModal
                        books={favorites}
                        onClose={() => setShowFavorites(false)}
                        onSelect={(b) => navigate("/home", { state: { page: "home", bookId: b.id } })}
                    />
                )}
                {confirm && <ConfirmModal {...confirm} onCancel={() => setConfirm(null)} />}
                                {showLogout && (
                    <ModalShell
                        title="Log out?"
                        titleId="logout-title"
                        role="alertdialog"
                        small
                        bare
                        onClose={() => setShowLogout(false)}
                        footer={
                            <div className="grid grid-cols-2 gap-4">
                                <button type="button" onClick={() => setShowLogout(false)} className={btnGhost}>
                                    Cancel
                                </button>
                                <button type="button" onClick={handleLogout} className={btnRed}>
                                    Log out
                                </button>
                            </div>
                        }
                    >
                        <p className="px-6 pb-2 pt-2 text-sm leading-relaxed text-[#4a1a1f]/80">
                            Are you sure you want to log out?
                        </p>
                    </ModalShell>
                )}
            </main>
        </div>
    )
}