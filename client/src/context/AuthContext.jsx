import { useEffect, useState } from "react";
import { AuthContext } from "./authContext1";

const API = import.meta.env.VITE_API_URL ?? "http://localhost:5001/api";
console.log("API base:", API);

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

const put = async (path, body) => {
    try {
        const res = await fetch(`${API}${path}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
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
        return { ok: true, user: res.data.user };
    };

    const saveUser = (next) => {
        localStorage.setItem("session", JSON.stringify(next));
        setUser(next);
    };

    const refresh = async () => {
        const token = localStorage.getItem("token");
        if (!token) return;
        try {
            const res = await fetch(`${API}/auth/me`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) return;
            const data = await res.json();
            if (data.user) saveUser(data.user);
        } catch { /* offline: keep the cached session */ }
    };

    useEffect(() => {
        refresh();
        window.addEventListener("focus", refresh);
        return () => window.removeEventListener("focus", refresh);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const updateProfile = async (changes) => {
        const res = await put("/auth/me", changes);
        if (!res.ok) return res;
        saveUser({ ...user, ...changes, ...(res.data?.user ?? {}) });
        return { ok: true };
    };

    const updateAvatar = async (avatar) => {
        const res = await put("/auth/me", { avatar });
        if (!res.ok) return res;
        saveUser({ ...user, avatar });
        return { ok: true };
    };

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