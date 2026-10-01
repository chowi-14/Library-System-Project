import crest from "../assets/crest.webp";

// Solid profile icon: white circle with a cut-out person
function ProfileIcon({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="12" fill="#fff" />
      <circle cx="12" cy="9.2" r="3.9" fill="#4a1a1f" />
      <path d="M4.6 19.2c1.5-3 4-4.5 7.4-4.5s5.9 1.5 7.4 4.5A11.9 11.9 0 0 1 12 24a11.9 11.9 0 0 1-7.4-4.8Z" fill="#4a1a1f" />
    </svg>
  );
}

// active: "home" | "transactions"; onNavigate("home" | "transactions")
export default function Navbar({ active = "home", onNavigate }) {
  const linkClass = (name) =>
    `border-b pb-1 text-[17px] text-white ${
      active === name ? "border-white" : "border-transparent hover:border-white/60"
    }`;

  return (
    <header className="bg-[#4a1a1f] font-serif">
      <nav className="grid grid-cols-[1fr_auto_1fr] items-center px-[4%] py-2.5">
        <button
          type="button"
          onClick={() => onNavigate?.("home")}
          className="flex items-center gap-2.5 justify-self-start"
        >
          <img src={crest} alt="Hogwarts crest" className="h-12 w-12 object-contain" />
          <span className="text-left text-lg leading-tight text-white">
            Hogwarts
            <br />
            Library
          </span>
        </button>

        <div className="flex gap-24">
          <button type="button" onClick={() => onNavigate?.("home")} className={linkClass("home")}>
            Home
          </button>
          <button type="button" onClick={() => onNavigate?.("transactions")} className={linkClass("transactions")}>
            Transactions
          </button>
        </div>

        <button type="button" aria-label="Profile" className="justify-self-end">
          <ProfileIcon />
        </button>
      </nav>
    </header>
  );
}