import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { ChevronLeft, LogOut, SquarePen, UserRound } from "lucide-react"
import Navbar from "../components/Navbar"
import { useAuth } from "../context/useAuth"

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PHONE_RE = /^(09\d{9}|\+639\d{9})$/
const NAME_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/

const validate = (v) => {
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

    return e
}

function Field({ label, name, value, error, editing, onChange, type = "text" }) {
    return (
        <div>
            <label htmlFor={name} className="block text-sm font-bold text-[#4a1a1f]">
                {label}
            </label>
            <input
                id={name}
                name={name}
                type={type}
                value={value}
                readOnly={!editing}
                onChange={onChange}
                aria-invalid={!!error}
                className={`mt-1 h-10 w-full rounded-sm border bg-white px-3 text-sm font-semibold outline-none ${
                    error
                        ? "border-red-700"
                        : editing
                        ? "border-[#4a1a1f] focus:ring-2 focus:ring-[#4a1a1f]/30"
                        : "border-[#4a1a1f]/40 bg-white/70"
                }`}
            />
            {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
        </div>
    )
}

export default function Profile({ avatar }) {
    const navigate = useNavigate()
    const { user, logout, updateProfile } = useAuth()

    const initialProfile = {
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        email: user.email ?? "",
        phone_number: user.phone_number ?? "",
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
        setDraft(profile)
        setErrors({})
        setEditing(false)
    }

    const handleChange = (e) => {
        const next = { ...draft, [e.target.name]: e.target.value }
        setDraft(next)
        setErrors(validate(next))
    }

    const save = async (e) => {
        e.preventDefault()
        const found = validate(draft)
        setErrors(found)
        if (Object.keys(found).length > 0) return

        const clean = {
            firstName: draft.firstName.trim(),
            lastName: draft.lastName.trim(),
            email: draft.email.trim(),
            phone_number: draft.phone_number.trim(),
        }

        const res = await updateProfile(clean)
        if (!res.ok) return setErrors({ email: res.error })

        setProfile(clean)
        setEditing(false)
    }

    const handleLogout = () => {
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
                <button
                    type="button"
                    onClick={() => navigate("/home")}
                    className="inline-flex items-center gap-1 text-sm font-bold text-[#4a1a1f] hover:underline"
                >
                    <ChevronLeft size={16} /> Back
                </button>

                <div className="mt-6 flex flex-col items-center gap-10 md:flex-row md:items-start">
                    <div className="shrink-0 rounded-full bg-[#4a1a1f] p-1.5">
                        <div className="rounded-full bg-[#F7DDB8] p-1">
                            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-white">
                                {avatar ? (
                                    <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                                ) : (
                                    <UserRound size={80} className="text-[#4a1a1f]" />
                                )}
                            </div>
                        </div>
                    </div>

                    <form onSubmit={save} noValidate className="w-full max-w-md flex-1">
                        <h1 className="text-4xl text-[#4a1a1f]">My Profile</h1>
                        <p className="mt-1 text-sm capitalize text-[#4a1a1f]/80">{user.role}</p>

                        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <Field label="First Name" name="firstName" value={values.firstName} error={errors.firstName} {...fieldProps} />
                            <Field label="Last Name" name="lastName" value={values.lastName} error={errors.lastName} {...fieldProps} />
                        </div>

                        <div className="mt-4">
                            <Field label="Email" name="email" type="email" value={values.email} error={errors.email} {...fieldProps} />
                        </div>

                        <div className="mt-4">
                            <Field label="Phone Number" name="phone_number" type="tel" value={values.phone_number} error={errors.phone_number} {...fieldProps} />
                        </div>

                        {editing ? (
                            <div className="mt-6 grid grid-cols-2 gap-5">
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
                            <div className="mt-6 grid grid-cols-2 gap-5">
                                <button
                                    type="button"
                                    onClick={startEdit}
                                    className="flex items-center justify-center gap-3 rounded-sm border border-[#4a1a1f] bg-white py-2 text-sm font-bold text-[#4a1a1f] hover:bg-[#f3d9c0]"
                                >
                                    Edit Profile <SquarePen size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={handleLogout}
                                    className="flex items-center justify-center gap-3 rounded-sm bg-[#4a1a1f] py-2 text-sm font-bold text-white hover:bg-[#3a1717]"
                                >
                                    Logout <LogOut size={16} />
                                </button>
                            </div>
                        )}
                    </form>
                </div>
            </main>
        </div>
    )
}