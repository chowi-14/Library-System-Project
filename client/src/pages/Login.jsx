import { useState } from "react";
import illustration from "../assets/illustration.webp"
import crest from "../assets/crest.webp"
import { useAuth } from "../context/useAuth";
import { Link, useNavigate } from "react-router-dom";

const UserIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
    <circle cx="12" cy="7.5" r="4.5" />
    <path d="M3 21c0-4.4 4-7 9-7s9 2.6 9 7z" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0" fill="currentColor" aria-hidden="true">
    <path d="M7 10V7a5 5 0 0110 0v3h1a2 2 0 012 2v8a2 2 0 01-2 2H6a2 2 0 01-2-2v-8a2 2 0 012-2zm2 0h6V7a3 3 0 00-6 0z" />
  </svg>
);

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" strokeLinecap="round" />}
  </svg>
);

function UnderlineInput({ icon, type = "text", placeholder, value, onChange, name, trailing }) {
  return (
    <div className="flex items-center gap-3 border-b border-black pb-1">
      {icon}
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full bg-transparent text-lg text-black placeholder:text-black/50 focus:outline-none"
      />
      {trailing}
    </div>
  );
}

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

function ForgotPasswordModal({ onClose, onDone }) {
  const [f, setF] = useState({ email: "", idNumber: "", next: "", conf: "" });
  const [show, setShow] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const errors = {
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) && "Enter a valid email",
    idNumber: !f.idNumber.trim() && "ID number is required",
    next:
      f.next.length < 8 ? "At least 8 characters"
      : !/[A-Za-z]/.test(f.next) || !/[0-9]/.test(f.next) ? "Use letters and numbers" : "",
    conf: f.conf !== f.next && "Passwords don't match",
  };

  const submit = async () => {
    setTouched(true);
    if (Object.values(errors).some(Boolean)) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: f.email.trim().toLowerCase(),
          idNumber: f.idNumber.trim(),
          newPassword: f.next,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not reset password.");
      onDone();
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot reach the server." : err.message);
      setSaving(false);
    }
  };

  const rows = [
    ["email", "Email", "email"],
    ["idNumber", "Student / Employee ID", "text"],
    ["next", "New password", "password"],
    ["conf", "Confirm new password", "password"],
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-[#2b0f12]">Forgot Password</h2>
        <p className="mt-1 text-xs text-[#4A1F1F]/70">
          Verify your email and ID, then choose a new password.
        </p>

        <div className="mt-4 flex flex-col gap-4">
          {rows.map(([k, label, type]) => (
            <div key={k}>
              <label className="block text-sm font-bold text-[#4A1F1F]">{label}</label>
              <div className="relative mt-1">
                <input
                  type={type === "password" && show ? "text" : type}
                  value={f[k]}
                  onChange={(e) => setF({ ...f, [k]: e.target.value })}
                  className={`h-10 w-full rounded-lg border bg-white px-3 text-sm font-semibold outline-none focus:ring-2 focus:ring-[#4A1F1F]/30 ${
                    touched && errors[k] ? "border-red-700" : "border-[#4A1F1F]/40"
                  } ${type === "password" ? "pr-10" : ""}`}
                />
                {type === "password" && (
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-[#4A1F1F] [&_svg]:h-5 [&_svg]:w-5"
                  >
                    <EyeIcon off={show} />
                  </button>
                )}
              </div>
              {touched && errors[k] && <p className="mt-1 text-xs text-red-700">{errors[k]}</p>}
            </div>
          ))}
          {error && <p className="rounded-lg bg-red-50 p-3 text-xs font-bold text-red-700" role="alert">{error}</p>}
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-[#4A1F1F]/25 bg-white px-4 py-2.5 text-sm font-bold text-[#4A1F1F] hover:bg-[#F7DDB8]/40"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={saving}
            className="rounded-lg bg-[#4A1F1F] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#3a1717] disabled:opacity-60"
          >
            {saving ? "Resetting..." : "Reset password"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("")
  const [showForgot, setShowForgot] = useState(false)
  const [notice, setNotice] = useState("")

  const navigate = useNavigate()
  const { login } = useAuth()

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await login(form.email.trim().toLowerCase(), form.password);
    if (!res.ok) return setError(res.error);
    navigate(res.user?.mustChangePassword ? "/profile" : "/home", { replace: true });
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7DDB8] px-6 py-10 font-['Almendra',serif]">
      <div className="grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="hidden justify-center md:flex">
          <img src={illustration} alt="Students in the Hogwarts library" className="w-full max-w-lg" />
        </div>

        <div className="mx-auto w-full max-w-sm">
          <div className="mb-6 flex items-center gap-4">
              <img src={crest} alt="Hogwarts crest" className="h-24 w-20 shrink-0 object-contain" />
            <h1 className="text-5xl leading-[0.95] text-black">
              Hogwarts
              <br />
              Library
            </h1>
          </div>

          <h2 className="text-2xl text-black">Welcome back to Hogwarts Library</h2>
          <p className="mt-3 text-sm text-black">
            New here?{" "}
            <Link to="/signup" className="underline underline-offset-2">Create Account</Link>
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-6">
            <UnderlineInput
              name="email"
              type="email"
              icon={<UserIcon />}
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
            />

            <UnderlineInput
              name="password"
              type={showPassword ? "text" : "password"}
              icon={<LockIcon />}
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="text-black"
                >
                  <EyeIcon off={showPassword} />
                </button>
              }
            />

            <div className="-mt-3 text-right">
              <button
                type="button"
                onClick={() => { setNotice(""); setShowForgot(true); }}
                className="text-sm text-black underline underline-offset-2"
              >
                Forgot password?
              </button>
            </div>

            {notice && <p role="status" className="text-sm font-bold text-[#0c7a43]">{notice}</p>}
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

            {showForgot && (
              <ForgotPasswordModal
                onClose={() => setShowForgot(false)}
                onDone={() => { setShowForgot(false); setNotice("Password reset. You can sign in now."); }}
              />
            )}

            <button
              type="submit"
              className="w-full rounded-md bg-[#4A1F1F] py-2.5 text-lg text-white transition hover:bg-[#3a1717] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#4A1F1F] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7DDB8]"
            >
              Sign in
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}