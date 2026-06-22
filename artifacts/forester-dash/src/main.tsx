import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set dark mode by default
document.documentElement.classList.add('dark');

createRoot(document.getElementById("root")!).render(<App />);

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const swUrl = `${import.meta.env.BASE_URL}service-worker.js`;

    navigator.serviceWorker.register(swUrl).catch((error) => {
      console.warn("Forester Dashboard service worker registration failed", error);
    });
  });
}
