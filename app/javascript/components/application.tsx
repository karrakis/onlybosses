import * as React from "react";
import * as ReactDOM from "react-dom/client";
import App from "./App";

document.addEventListener("DOMContentLoaded", () => {
  const rootEl = document.getElementById("root");
  if (!rootEl) return;

  let availableKeywords: string[] = [];
  try {
    availableKeywords = JSON.parse(rootEl.dataset.availableKeywords || "[]");
  } catch {}

  ReactDOM.createRoot(rootEl).render(<App availableKeywords={availableKeywords} />);
});