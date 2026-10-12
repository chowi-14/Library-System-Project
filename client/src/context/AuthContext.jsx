import { useState } from "react";
import { AuthContext } from "./authContext1";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";

const post = async (path, body) => {
    try {
        const res = await fetch(`${API}${path}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });
        const data = await res.json();
        return res.ok ? { ok: true, data } : { ok: false, error: data.error || "Something went wrong." };
    } catch {
        return { ok: false, error: "Cannot reach the server." };
    }
};

const readSession = () => {
    try { return JSON.parse(localStorage.getItem("session")); }
    catch { return null; }
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(readSession);

    const register = (data) => post("/auth/register", data);

    const login = async (email, password) => {
        const res = await post("/auth/login", { email, password });
        if (!res.ok) return res;
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("session", JSON.stringify(res.data.user));
        setUser(res.data.user);
        return { ok: true };
    };

    const saveUser = (next) => {
        localStorage.setItem("session", JSON.stringify(next));
        setUser(next);
    };

    const updateProfile = async (changes) => {
        saveUser({ ...user, ...changes });
        return { ok: true };
    };

    const updateAvatar = (avatar) => saveUser({ ...user, avatar });

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("session");
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, register, login, logout, updateProfile, updateAvatar }}>
        {children}
        </AuthContext.Provider>
    );
}