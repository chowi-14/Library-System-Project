import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, LogOut, SquarePen, UserRound } from "lucide-react";
import Navbar from "../components/Navbar";


const initialProfile = {
  firstName: "Zoe Claudette",
  lastName: "Reynaldo",
  email: "email@gmail.com",
  phone: "+63 9393883413",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^(09\d{9}|\+639\d{9})$/; 
const NAME_RE = /^[A-Za-zÀ-ÿ][A-Za-zÀ-ÿ .'-]*$/;

const validate = (v) => {
  const e = {};
  if (!v.firstName.trim()) e.firstName = "First name is required.";
  else if (!NAME_RE.test(v.firstName.trim())) e.firstName = "Use letters only.";

  if (!v.lastName.trim()) e.lastName = "Last name is required.";
  else if (!NAME_RE.test(v.lastName.trim())) e.lastName = "Use letters only.";

  if (!v.email.trim()) e.email = "Email is required.";
  else if (!EMAIL_RE.test(v.email.trim())) e.email = "Enter a valid email address.";

  const phone = v.phone.replace(/[\s-]/g, "");
  if (!phone) e.phone = "Phone number is required.";
  else if (!PHONE_RE.test(phone)) e.phone = "Use 09XXXXXXXXX or +639XXXXXXXXX.";
  return e;
};

function Field({ label, name, value, error, editing, onChange, type = "text" }) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-bold">{label}</label>
      <input
        id={name}
        name={name}
        type={type}
        value={value}
        readOnly={!editing}
        onChange={onChange}
        aria-invalid={!!error}
        className={`mt-1 h-9 w-full rounded-sm border bg-white px-3 text-sm font-semibold outline-none ${
          error
            ? "border-red-600"
            : editing
            ? "border-[#0b4a8b] focus:ring-2 focus:ring-[#0b4a8b]/40"
            : "border-[#555]"
        }`}
      />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}


export default function Profile({ role = "student", avatar }) {
  const navigate = useNavigate();
  const isLibrarian = role === "librarian";
  const dashboard = isLibrarian ? "/librarian" : "/student";
  const [profile, setProfile] = useState(initialProfile); 
  const [draft, setDraft] = useState(initialProfile); 
  const [editing, setEditing] = useState(false);
  const [errors, setErrors] = useState({});

  const values = editing ? draft : profile;

  const startEdit = () => {
    setDraft(profile);
    setErrors({});
    setEditing(true);
  };

  const handleChange = (e) => {
    const next = { ...draft, [e.target.name]: e.target.value };
    setDraft(next);
    setErrors(validate(next));
  };

  const save = (e) => {
    e.preventDefault();
    const found = validate(draft);
    setErrors(found);
    if (Object.keys(found).length > 0) return; 
    setProfile({
      firstName: draft.firstName.trim(),
      lastName: draft.lastName.trim(),
      email: draft.email.trim(),
      phone: draft.phone.trim(),
    });
    setEditing(false); 
  };

  const fieldProps = { editing, onChange: handleChange };

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {isLibrarian ? (
        <Navbar role="librarian" />
      ) : (
        <Navbar
          active={null}
          onNavigate={(page) => navigate("/student", { state: { page } })}
          onProfile={() => {}}
        />
      )}

      <main className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => navigate(dashboard)}
            className="inline-flex items-center gap-1 text-sm font-bold hover:underline"
          >
            <ChevronLeft size={16} /> Back
          </button>
        </div>

        <div className="mt-4 flex flex-col items-center gap-10 md:flex-row md:items-start">
          {/* Avatar */}
          <div className="shrink-0 rounded-full bg-[#0b4a8b] p-1.5">
            <div className="rounded-full bg-white p-1">
              <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full bg-[#dbe7f5]">
                {avatar ? (
                  <img src={avatar} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <UserRound size={80} className="text-[#0b4a8b]" />
                )}
              </div>
            </div>
          </div>

          {/* Details */}
          <form onSubmit={save} noValidate className="w-full max-w-md flex-1">
            <h1 className="text-3xl font-bold">My Profile</h1>

            <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First Name" name="firstName" value={values.firstName} error={errors.firstName} {...fieldProps} />
              <Field label="Last Name" name="lastName" value={values.lastName} error={errors.lastName} {...fieldProps} />
            </div>
            <div className="mt-3">
              <Field label="Email" name="email" type="email" value={values.email} error={errors.email} {...fieldProps} />
            </div>
            <div className="mt-3">
              <Field label="Phone Number" name="phone" type="tel" value={values.phone} error={errors.phone} {...fieldProps} />
            </div>

            <div className="mt-6 grid grid-cols-2 gap-5">
              {editing ? (
                <button
                  key="save"
                  type="submit"
                  className="rounded-sm bg-[#0b4a8b] py-2 text-sm font-bold text-white hover:bg-[#083a6f]"
                >
                  Save Changes
                </button>
              ) : (
                <button
                  key="edit"
                  type="button"
                  onClick={startEdit}
                  className="flex items-center justify-center gap-3 rounded-sm border border-[#0b4a8b] bg-white py-2 text-sm font-bold hover:bg-[#eef4fb]"
                >
                  Edit Profile <SquarePen size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => navigate("/login")} 
                className="flex items-center justify-center gap-3 rounded-sm bg-[#f00] py-2 text-sm font-bold text-white hover:brightness-90"
              >
                Logout <LogOut size={16} />
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}