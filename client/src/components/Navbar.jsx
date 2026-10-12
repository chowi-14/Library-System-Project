import { useNavigate } from "react-router-dom"
import crest from "../assets/crest.webp"
import { useAuth } from "../context/useAuth"

function ProfileIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
            <path
                fill="currentColor"
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 4a8 8 0 0 0-6.96 11.947A4.99 4.99 0 0 1 9 14h6a4.99 4.99 0 0 1 3.96 1.947A8 8 0 0 0 12 4m7.943 14.076q.188-.245.36-.502A9.96 9.96 0 0 0 22 12c0-5.523-4.477-10-10-10S2 6.477 2 12a9.96 9.96 0 0 0 2.057 6.076l-.005.018l.355.413A9.98 9.98 0 0 0 12 22q.324 0 .644-.02a9.95 9.95 0 0 0 5.031-1.745a10 10 0 0 0 1.918-1.728l.355-.413zM12 6a3 3 0 1 0 0 6a3 3 0 0 0 0-6"
            />
        </svg>
    )
}

export default function Navbar({ role = "student", active = "home", onNavigate, onProfile }) {
    const navigate = useNavigate()
    const { user } = useAuth()
    const isLibrarian = role === "librarian"

    const linkClass = (name) =>
        `relative flex h-full items-center px-1 font-sans text-sm font-medium transition-colors ${
            active === name ? "text-white" : "text-white/65 hover:text-white"
        }`

    const openProfile = onProfile ?? (() => navigate(`/${role}/profile`))
    const goHome = () => (isLibrarian ? navigate("/home") : onNavigate?.("home"))

    return (
        <header className="sticky top-0 z-50 border-b border-black/25 bg-[#4a1a1f]">
            <nav className={`grid h-16 grid-cols-[1fr_auto_1fr] items-center ${isLibrarian ? "px-6" : "px-[4%]"}`}>
                <button
                    type="button"
                    onClick={goHome}
                    className="flex items-center gap-3 justify-self-start rounded-md focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                    <img src={crest} alt="Hogwarts crest" className="h-9 w-9 object-contain" />
                    <span className="text-left leading-tight text-white">
                        <span className="block font-serif text-[17px] font-medium">Hogwarts Library</span>
                        {isLibrarian && (
                            <span className="block font-sans text-[11px] text-white/60">
                                Knowledge is the truest magic.
                            </span>
                        )}
                    </span>
                </button>

                {isLibrarian ? (
                    <div />
                ) : (
                    <div className="flex h-full items-stretch gap-10">
                        {[
                            ["home", "Home"],
                            ["transactions", "Transactions"],
                        ].map(([name, label]) => (
                            <button
                                key={name}
                                type="button"
                                onClick={() => onNavigate?.(name)}
                                aria-current={active === name ? "page" : undefined}
                                className={linkClass(name)}
                            >
                                {label}
                                <span
                                    className={`absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-white transition-opacity ${
                                        active === name ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                            </button>
                        ))}
                    </div>
                )}

                <button
                    type="button"
                    onClick={openProfile}
                    aria-label="Profile"
                    className="justify-self-end rounded-full text-white/80 transition-colors hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                >
                    {user?.avatar ? (
                        <img
                            src={user.avatar}
                            alt="Profile"
                            className="h-[34px] w-[34px] rounded-full border border-white/70 object-cover"
                        />
                    ) : (
                        <ProfileIcon />
                    )}
                </button>
            </nav>
        </header>
    )
}