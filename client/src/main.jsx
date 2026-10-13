import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";

const root = document.documentElement
let timer

const showScrollbar = () => {
  root.classList.add("is-scrolling")
  clearTimeout(timer)
  timer = setTimeout(() => root.classList.remove("is-scrolling"), 1000)
}

window.addEventListener("scroll", showScrollbar, { passive: true })
window.addEventListener(
  "mousemove",
  (e) => e.clientX > window.innerWidth - 24 && showScrollbar(),
  { passive: true }
)

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);