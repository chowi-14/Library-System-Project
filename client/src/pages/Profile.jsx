import { useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Camera, ChevronLeft, ChevronRight, Heart, LogOut, SquarePen, UserRound } from "lucide-react"
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
        { name: "assigned_role", label: "Assigned role" },
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
    const cls = `mt-1 h-10 w-full rounded-sm border bg-white px-3 text-sm font-semibold outline-none ${
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

export default function Profile() {
    const navigate = useNavigate()
    const { user, logout, updateProfile, updateAvatar } = useAuth()
    const [draftAvatar, setDraftAvatar] = useState(undefined) 
    const avatar = draftAvatar !== undefined ? draftAvatar : user.avatar
    const fileRef = useRef(null)
    const [showLogout, setShowLogout] = useState(false)
    const isLibrarian = user.role === "librarian"
    const roleLabel = user.role.charAt(0).toUpperCase() + user.role.slice(1)

    const stats = { borrowed: 0, overdue: 0, returned: 0 }
    const favoritesCount = 0

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

    const values = editing ? draft : profile

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

    const save = async (e) => {
        e.preventDefault()
        const found = validate(draft, user.role)
        setErrors(found)
        if (Object.keys(found).length > 0) return

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
        if (!file) return
        const reader = new FileReader()
        reader.onload = () => setDraftAvatar(reader.result)
        reader.readAsDataURL(file)
        e.target.value = ""
    }

    const handleLogout = () => {
        setShowLogout(false)
        logout()
        navigate("/login", { replace: true })
    }

    const fieldProps = { editing, onChange: handleChange }

    return (
        <div className="flex min-h-screen flex-col bg-white font-serif">
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
                        <h1 className="text-4xl text-[#4a1a1f]">{user.firstName} {user.lastName}</h1>
                        <span className="mt-2 inline-block rounded-full bg-[#4a1a1f]/15 px-3 py-1 text-xs font-bold text-[#4a1a1f]">
                            {roleLabel}
                        </span>

                        {!isLibrarian && (
                            <>
                                <div className="mt-5 grid grid-cols-3 divide-x divide-[#4a1a1f]/20 rounded-lg border border-[#4a1a1f]/20 bg-[#F7DDB8]/40 py-3 text-center">
                                    {[
                                        ["Borrowed", stats.borrowed],
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
                                    onClick={() => navigate("/favorites")}
                                    className="mt-4 flex w-full items-center gap-3 rounded-lg border border-[#4a1a1f]/20 bg-[#F7DDB8]/40 px-4 py-3 text-left"
                                >
                                    <Heart size={18} className="text-[#4a1a1f]" />
                                    <span className="flex-1 text-sm font-bold text-[#4a1a1f]">My favorites</span>
                                    <span className="text-sm font-bold text-[#4a1a1f]">{favoritesCount}</span>
                                    <ChevronRight size={16} className="text-[#4a1a1f]/60" />
                                </button>
                            </>
                        )}

                        <h2 className="mt-6 text-lg font-bold text-[#4a1a1f]">{roleLabel} profile</h2>

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
                        </div>

                        {editing ? (
                            <div key="edit-actions" className="mt-6 grid grid-cols-2 gap-5">
                                <button
                                    type="submit"
                                    className="rounded-sm bg-[#4a1a1f] py-2 text-sm font-bold text-white hover:bg-[#3a1717]"
                                >
                                    Save Changes
                                </button>
                                <button
                                    type="button"
                                    onClick={cancelEdit}
                                    className="rounded-sm border border-[#4a1a1f] bg-white py-2 text-sm font-bold text-[#4a1a1f] hover:bg-[#f3d9c0]"
                                >
                                    Cancel
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
                {showLogout && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                        <div role="dialog" aria-modal="true" className="w-full max-w-sm rounded-md bg-white p-6">
                            <h2 className="text-xl font-bold text-[#4a1a1f]">Log out?</h2>
                            <p className="mt-2 text-sm text-[#4a1a1f]/80">Are you sure you want to log out?</p>
                            <div className="mt-5 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowLogout(false)}
                                    className="rounded-sm px-4 py-2 text-sm font-bold text-[#4a1a1f]/70 hover:underline"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="rounded-sm bg-[#E00000] px-4 py-2 text-sm font-bold text-white"
                                >
                                    Log out
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    )
}