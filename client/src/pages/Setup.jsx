import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import crest from "../assets/crest.webp";
import illustration from "../assets/illustration.webp";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(09\d{9}|\+639\d{9})$/;
const NAME_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/;

const FIELDS = [
  { name: "setupKey", placeholder: "Setup key", type: "password" },
  { name: "firstName", placeholder: "First name" },
  { name: "lastName", placeholder: "Last name" },
  { name: "idNumber", placeholder: "Employee ID" },
  { name: "email", placeholder: "Faculty email", type: "email" },
  { name: "phone_number", placeholder: "Phone number", type: "tel" },
  { name: "password", placeholder: "Password", type: "password" },
  { name: "confirmPassword", placeholder: "Confirm password", type: "password" },
];

const validate = (v) => {
  if (!v.setupKey) return "Setup key is required.";
  if (!NAME_RE.test(v.firstName.trim())) return "Enter a valid first name.";
  if (!NAME_RE.test(v.lastName.trim())) return "Enter a valid last name.";
  if (!v.idNumber.trim()) return "Employee ID is required.";
  if (!EMAIL_RE.test(v.email.trim())) return "Enter a valid email address.";
  if (!PHONE_RE.test(v.phone_number.replace(/[\s-]/g, ""))) return "Use 09XXXXXXXXX or +639XXXXXXXXX.";
  if (v.password.length < 8) return "Password must be at least 8 characters.";
  if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password)) return "Include at least one letter and one number.";
  if (v.password !== v.confirmPassword) return "Passwords do not match.";
  return "";
};

export default function Setup() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [shown, setShown] = useState({});
  const [form, setForm] = useState(
    Object.fromEntries(FIELDS.map((f) => [f.name, ""]))
  );


  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const problem = validate(form);
    if (problem) return setError(problem);
    setSaving(true);
    try {
      const res = await fetch(`${API}/auth/setup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email: form.email.trim().toLowerCase(),
          phone_number: form.phone_number.replace(/[\s-]/g, ""),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Setup failed.");
      navigate("/login", { replace: true });
    } catch (err) {
      setError(err.message === "Failed to fetch" ? "Cannot reach the server." : err.message);
      setSaving(false);
    }
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
        <h2 className="text-2xl text-black">Librarian setup</h2>
        <p className="mt-3 text-sm text-black">
          Create a librarian account. You need the setup key.{" "}
          <Link to="/login" className="underline underline-offset-2">Back to sign in</Link>
        </p>

        <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-5">
          {FIELDS.map((f) => {
            const isPassword = f.type === "password";
            return (
              <div key={f.name} className="flex items-center gap-3 border-b border-black pb-1">
                <input
                  name={f.name}
                  type={isPassword && shown[f.name] ? "text" : f.type ?? "text"}
                  value={form[f.name]}
                  onChange={handleChange}
                  placeholder={f.placeholder}
                  className="w-full bg-transparent text-lg text-black placeholder:text-black/50 focus:outline-none"
                />
                {isPassword && (
                  <button
                    type="button"
                    onClick={() => setShown((s) => ({ ...s, [f.name]: !s[f.name] }))}
                    aria-label={shown[f.name] ? "Hide password" : "Show password"}
                    className="text-black"
                  >
                    {shown[f.name] ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                )}
              </div>
            );
          })}
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-[#4A1A1F] py-2.5 text-lg text-white transition hover:bg-[#3a1717] disabled:opacity-60"
          >
            {saving ? "Creating..." : "Create librarian account"}
          </button>
        </form>
        </div>
      </div>
    </main>
  );
}