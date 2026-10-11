import { useState } from "react";
import { AuthContext } from "./authContext1";

const read = (key, fallback) => {
    try { 
        return JSON.parse(localStorage.getItem(key)) ?? fallback; 
    }
    catch {
        return fallback; 
    }
}

export default function AuthProvider({ children }) {
    const [user, setUser] = useState(() => read("session", null))

    const register = (data) => {
        const users = read("users", [])
        if (users.som((u) => u.email === data.email))
            return { ok: false, error: "Email is already registered."}
        localStorage.setItem("users", JSON.stringify([...users, data]))
        return { ok: true }
    }

    const login = (email, password) => {
        const found = read("users", []).find(
            (u) => u.email === email && u.password === password
        )

        if(!found) return { ok: false, error: "Invalid email or password."}
        
        const session = {...found}
        delete session.password

        localStorage.setItem("session", JSON.stringify(session))
        setUser(session)
        return {ok: true}
    }

    const logout = () => {
        localStorage.removeItem("session")
        setUser(null)
    }

  return (
    <AuthContext.Provider value = {{user, register, login, logout}}>
        {children}
    </AuthContext.Provider>
  )
}
