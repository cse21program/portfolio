import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/app/App";
import { redirectApexToWww } from "@/lib/canonicalHost";
import "./index.css";

if (!redirectApexToWww()) {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
