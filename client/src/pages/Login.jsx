import { useState } from "react";
import illustration from "../assets/illustration.webp"
import crest from "../assets/crest.webp"

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

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log(form);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7DDB8] px-6 py-10 font-['Almendra',serif]">
      <div className="grid w-full max-w-6xl items-center gap-12 md:grid-cols-2">
        <div className="hidden justify-center md:flex">
          <img src={illustration} alt="Students in the Hogwarts library" className="w-full max-w-lg" />
        </div>

        {/* RIGHT — form */}
        <div className="mx-auto w-full max-w-sm">
          {/* Logo + title */}
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
            <a href="/register" className="underline underline-offset-2">
              Create Account
            </a>
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