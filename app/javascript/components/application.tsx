import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Home from "./Home";
import Admin from "./Admin";

document.addEventListener("DOMContentLoaded", () => {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    let availableKeywords: string[] = [];
    const keywordsJson = rootEl.dataset.availableKeywords;
    if (keywordsJson) {
      try {
        availableKeywords = JSON.parse(keywordsJson);
      } catch (error) {
        console.error('Failed to parse available keywords:', error);
      }
    }
    ReactDOM.createRoot(rootEl).render(<Home availableKeywords={availableKeywords} />);
  }

  const adminEl = document.getElementById("admin-root");
  if (adminEl) {
    ReactDOM.createRoot(adminEl).render(<Admin />);
  }
});