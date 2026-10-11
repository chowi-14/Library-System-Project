import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, Lock } from "lucide-react";
import girl from "../assets/signup.webp";
import books from "../assets/books.webp";
import crest from "../assets/crest.webp";
import { useAuth } from "../context/useAuth";

const ScarfIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      stroke="currentColor"
      strokeWidth=".1"
      d="M19.122 25.558c-3.797 2.583-8.63 4.499-14.123 4.499c-.637 0-.967-.37-.97-1.057H2.5a.5.5 0 0 1 0-1h1.529v-1H2.5a.5.5 0 0 1 0-1h1.529v-1H2.5a.5.5 0 0 1 0-1h1.529v-1H2.5a.5.5 0 0 1 0-1h1.691c.236-.613.763-1.026 1.796-1.026c.669 0 1.42-.06 2.22-.18C6.06 18.546 4.98 15.6 4.98 11.976C4.979 4.662 10.691 1.331 16 1.331c5.54 0 9.12 3.583 10.586 6.524c1.062 1.81 1.554 4.184 1.085 7.214c2.25.23 3.391 1.888 3.391 4.94v1.686c0 2.661-1.516 4.313-3.956 4.313h-1.027a44 44 0 0 1-6.957-.45Zm.22-10.958a5.4 5.4 0 0 0 .643-2.547c.018-1.68-.759-5.04-4.007-5.04c-1.492 0-2.56.406-3.316.97q-.163.612-.164 1.327a3.92 3.92 0 0 0 1.207 2.921c.873.863 2.52 1.823 5.638 2.369ZM14.437 3.44C10.517 4 6.98 6.7 6.98 11.976c0 5.772 2.94 9.273 9.253 11.017c3.478.78 7.04 1.118 10.603 1.007h.271c1.3 0 1.956-.778 1.956-2.313V20c0-2.743-.886-2.967-1.956-2.967h-1.314c-6.608.063-11.146-1.066-13.494-3.388a5.9 5.9 0 0 1-1.8-4.343a5.915 5.915 0 0 1 3.938-5.862Z"
    />
  </svg>
);

const HatIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4"
      d="M24 40c11.046 0 20-1.79 20-4c0-1.439-3.299-2.7-9-3.405L27 12L15 8l3 6l-5 18.595C7.299 33.3 4 34.56 4 36c0 2.21 8.954 4 20 4"
    />
  </svg>
);

const ROLES = [
  { id: "student", label: "Student", icon: ScarfIcon },
  { id: "librarian", label: "Librarian", icon: HatIcon },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(09\d{9}|\+639\d{9})$/; 
const NAME_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/;

const EyeIcon = ({ off }) => (
  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
    <path d="M1.5 12S5.5 5 12 5s10.5 7 10.5 7-4 7-10.5 7S1.5 12 1.5 12z" />
    <circle cx="12" cy="12" r="3" />
    {off && <path d="M3 3l18 18" strokeLinecap="round" />}
  </svg>
);

const validate = (v) => {
  const e = {};

  if (!v.firstName.trim()) e.firstName = "First name is required.";
  else if (!NAME_RE.test(v.firstName.trim()))
    e.firstName = "Use letters only.";

  if (!v.lastName.trim()) e.lastName = "Last name is required.";
  else if (!NAME_RE.test(v.lastName.trim())) e.lastName = "Use letters only.";

  if (!v.email.trim()) e.email = "Email is required.";
  else if (!EMAIL_RE.test(v.email.trim()))
    e.email = "Enter a valid email address.";

  const phone = v.phone.replace(/[\s-]/g, "");
  if (!phone) e.phone = "Phone number is required.";
  else if (!PHONE_RE.test(phone))
    e.phone = "Use 09XXXXXXXXX or +639XXXXXXXXX.";

  if (!v.password) e.password = "Password is required.";
  else if (v.password.length < 8)
    e.password = "Password must be at least 8 characters.";
  else if (!/[A-Za-z]/.test(v.password) || !/\d/.test(v.password))
    e.password = "Include at least one letter and one number.";

  if (!v.confirmPassword) e.confirmPassword = "Confirm your password.";
  else if (v.confirmPassword !== v.password)
    e.confirmPassword = "Passwords do not match.";

  return e;
};

const initialValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  password: "",
  confirmPassword: "",
};

function Field({ icon: Icon, name, type = "text", placeholder, values, errors, touched, onChange, onBlur }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const showError = touched[name] && errors[name];
  return (
    <div>
      <div
        className={`flex items-center gap-3 border-b pb-2 ${
          showError ? "border-red-300" : "border-[#f3d9c0]/70"
        } focus-within:border-[#f3d9c0]`}
      >
        {Icon && <Icon size={18} className="shrink-0 text-[#f3d9c0]" />}
        <input
          name={name}
          type={isPassword && showPassword ? "text" : type}
          value={values[name]}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${name}-error` : undefined}
          className="w-full bg-transparent text-lg text-[#f3d9c0] placeholder:text-[#f3d9c0]/60 outline-none"
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="shrink-0 text-[#f3d9c0]"
          >
            <EyeIcon off={showPassword} />
          </button>
        )}
      </div>
      {showError && (
        <p id={`${name}-error`} className="mt-1 text-sm text-red-300">
          {errors[name]}
        </p>
      )}
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-4">
      <img src={crest} alt="Hogwarts crest" className="h-[72px] w-[72px] object-contain" />
      <h1 className="text-5xl leading-[0.95]">
        Hogwarts
        <br />
        Library
      </h1>
    </div>
  );
}

export default function SignUp() {
  const navigate = useNavigate();
  const [role, setRole] = useState(null);
  const [step, setStep] = useState("role"); 
  const [values, setValues] = useState(initialValues);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState("")

  const {register} = useAuth()

  const handleChange = (e) => {
    const next = { ...values, [e.target.name]: e.target.value };
    setValues(next);
    setErrors(validate(next));
    setSubmitError("");
  };

  const handleBlur = (e) => {
    setTouched((t) => ({ ...t, [e.target.name]: true }));
    setErrors(validate(values));
  };

  
  const chooseRole = (id) => {
    setRole(id);
    setStep("form");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const found = validate(values);
    setErrors(found);
    setTouched(Object.fromEntries(Object.keys(values).map((k) => [k, true])));
    if (Object.keys(found).length > 0) return

    const { firstName, lastName, email, phone, password } = values;
    const res = register({
      role,
      firstName,
      lastName,
      email: email.trim().toLowerCase(),
      phone,
      password,
    });
    if (!res.ok) return setSubmitError(res.error);
    navigate("/login");
  };

  const fieldProps = { values, errors, touched, onChange: handleChange, onBlur: handleBlur };

  return (
    <main className="min-h-screen bg-[#4a1a1f] font-serif text-[#f3d9c0] flex items-center justify-center p-6">
      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-[1fr_1.5fr]">

        <section className="mx-auto w-full max-w-md">
          <Brand />

          {step === "role" ? (
            <div className="mt-8">
              <h2 className="text-2xl">Create Account to explore the library</h2>
              <p className="mt-3 text-sm text-[#f3d9c0]/80">
                Do you already have an account?{" "}
                <Link to="/login" className="underline underline-offset-2">
                  Sign in now
                </Link>
              </p>

              <p className="mt-6 text-2xl">I am a:</p>
              <div className="mt-4 flex gap-6" role="group" aria-label="Account type">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => chooseRole(r.id)}
                      className="flex h-40 w-40 flex-col items-center justify-center gap-3 rounded-lg bg-[#f9dcc0] text-xl text-black
                                transition duration-150 outline-none
                                hover:-translate-y-1 hover:bg-white hover:shadow-lg
                                active:translate-y-0 active:scale-95 active:bg-[#f3c79a]
                                focus-visible:ring-4 focus-visible:ring-[#f3d9c0]"
                    >
                      <Icon className="h-16 w-16 text-black" />
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-8">
              <h2 className="text-xl">Create Account to explore our library</h2>
              <p className="mt-2 text-sm text-[#f3d9c0]/80">
                Do you already have an account?{" "}
                <Link to="/login" className="underline underline-offset-2">
                  Sign in now
                </Link>
              </p>

              <div className="mt-6 space-y-5">
                <div className="grid grid-cols-2 gap-4">
                  <Field name="firstName" placeholder="First Name" {...fieldProps} />
                  <Field name="lastName" placeholder="Last Name" {...fieldProps} />
                </div>
                <Field icon={Mail} name="email" type="email" placeholder="Enter your email" {...fieldProps} />
                <Field icon={Phone} name="phone" type="tel" placeholder="Enter your Phone Number" {...fieldProps} />
                <Field icon={Lock} name="password" type="password" placeholder="Enter your password" {...fieldProps} />
                <Field icon={Lock} name="confirmPassword" type="password" placeholder="Confirm your password" {...fieldProps} />
              </div>

              {submitError && (
                <p role="alert" className="mt-4 text-sm text-red-300">
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                className="mt-6 w-full rounded-md bg-[#f9dcc0] py-3 text-lg text-[#4a1a1f] hover:brightness-95"
              >
                Sign Up
              </button>

              <button
                type="button"
                onClick={() => setStep("role")}
                className="mt-4 text-sm underline underline-offset-2 text-[#f3d9c0]/80"
              >
                Change account type ({role})
              </button>
            </form>
          )}
        </section>
        <section className="hidden justify-center md:flex">
          <img
            src={step === "role" ? girl : books}
            alt={step === "role" ? "Student carrying a stack of books" : "Stack of magical books"}
            className="max-h-[420px] w-auto object-contain"
          />
        </section>
      </div>
    </main>
  );
}