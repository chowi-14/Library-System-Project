import { useContext } from "react";
import { AuthContext } from "./authContext1";

export const useAuth = () => useContext(AuthContext);