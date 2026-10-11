import { useNavigate } from "react-router-dom"
import crest from "../assets/crest.webp"

function ProfileIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="#fff"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 4a8 8 0 0 0-6.96 11.947A4.99 4.99 0 0 1 9 14h6a4.99 4.99 0 0 1 3.96 1.947A8 8 0 0 0 12 4m7.943 14.076q.188-.245.36-.502A9.96 9.96 0 0 0 22 12c0-5.523-4.477-10-10-10S2 6.477 2 12a9.96 9.96 0 0 0 2.057 6.076l-.005.018l.355.413A9.98 9.98 0 0 0 12 22q.324 0 .644-.02a9.95 9.95 0 0 0 5.031-1.745a10 10 0 0 0 1.918-1.728l.355-.413zM12 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6"
            />
        </svg>
    )
}

export default function Navbar({ role = "student", active = "home", onNavigate, onProfile }) {
    const navigate = useNavigate()
    const isLibrarian = role === "librarian"

    const linkClass = (name) =>
        `border-b pb-1 text-[17px] text-white ${
            active === name ? "border-white" : "border-transparent hover:border-white/60"
        }`

    const openProfile = onProfile ?? (() => navigate(`/${role}/profile`))
    const goHome = () => (isLibrarian ? navigate("/home") : onNavigate?.("home"))

    return (
        <header className="bg-[#4a1a1f] font-serif">
            <nav className={`grid grid-cols-[1fr_auto_1fr] items-center py-2.5 ${isLibrarian ? "px-6" : "px-[4%]"}`}>
                <button type="button" onClick={goHome} className="flex items-center gap-2.5 justify-self-start">
                    <img
                        src={crest}
                        alt="Hogwarts crest"
                        className={isLibrarian ? "h-9.5 w-auto object-contain" : "h-12 w-12 object-contain"}
                    />
                    {isLibrarian ? (
                        <span className="text-left text-white">
                            <span className="block text-lg">Hogwarts Library</span>
                            <span className="block font-sans text-[11px] font-semibold opacity-90">
                                Knowledge is the truest magic.
                            </span>
                        </span>
                    ) : (
                        <span className="text-left text-lg leading-tight text-white">
                            Hogwarts
                            <br />
                            Library
                        </span>
                    )}
                </button>

                {isLibrarian ? (
                    <div />
                ) : (
                    <div className="flex gap-24">
                        <button type="button" onClick={() => onNavigate?.("home")} className={linkClass("home")}>
                            Home
                        </button>
                        <button type="button" onClick={() => onNavigate?.("transactions")} className={linkClass("transactions")}>
                            Transactions
                        </button>
                    </div>
                )}

                <button type="button" onClick={openProfile} aria-label="Profile" className="justify-self-end">
                    <ProfileIcon />
                </button>
            </nav>
        </header>
    )
}