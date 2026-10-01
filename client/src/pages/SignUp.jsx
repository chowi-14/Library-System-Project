import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, Lock } from "lucide-react";
import girl from "../assets/signup.webp";
import books from "../assets/books.webp";
import crest from "../assets/crest.webp";

const ROLES = [
  { id: "student", label: "Student"},
  { id: "librarian", label: "Librarian" },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(09\d{9}|\+639\d{9})$/; 
const NAME_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/;

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
          type={type}
          value={values[name]}
          placeholder={placeholder}
          onChange={onChange}
          onBlur={onBlur}
          aria-invalid={!!showError}
          aria-describedby={showError ? `${name}-error` : undefined}
          className="w-full bg-transparent text-lg text-[#f3d9c0] placeholder:text-[#f3d9c0]/60 outline-none"
        />
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

  const handleChange = (e) => {
    const next = { ...values, [e.target.name]: e.target.value };
    setValues(next);
    setErrors(validate(next));
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
    if (Object.keys(found).length > 0) return;


    console.log("Sign up:", { role, ...values });
    navigate("/login");
  };

  const fieldProps = { values, errors, touched, onChange: handleChange, onBlur: handleBlur };

  return (
    <main className="min-h-screen bg-[#4a1a1f] font-serif text-[#f3d9c0] flex items-center justify-center p-6">
      <div className="grid w-full max-w-5xl items-center gap-10 md:grid-cols-2">

        <section className="mx-auto w-full max-w-sm">
          <Brand />

          {step === "role" ? (
            <div className="mt-8">
              <h2 className="text-xl">Create Account to explore the library</h2>
              <p className="mt-2 text-sm text-[#f3d9c0]/80">
                Do you already have an account?{" "}
                <Link to="/login" className="underline underline-offset-2">
                  Sign in now
                </Link>
              </p>

              <p className="mt-6 text-lg">I am a:</p>
              <div className="mt-4 flex gap-4" role="group" aria-label="Account type">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => chooseRole(r.id)}
                    className="flex h-28 w-28 flex-col items-center justify-center gap-2 rounded-lg bg-[#f9dcc0] text-lg text-[#4a1a1f] transition outline-none hover:ring-4 hover:ring-sky-500 focus-visible:ring-4 focus-visible:ring-sky-500"
                  >
                    <span className="text-4xl" aria-hidden="true">{r.icon}</span>
                    {r.label}
                  </button>
                ))}
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