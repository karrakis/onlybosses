import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Home from "./Home";


document.addEventListener("DOMContentLoaded", () => {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    // Read available keywords from data attribute
    let availableKeywords: string[] = [];
    const keywordsJson = rootEl.dataset.availableKeywords;
    if (keywordsJson) {
      try {
        availableKeywords = JSON.parse(keywordsJson);
      } catch (error) {
        console.error('Failed to parse available keywords:', error);
      }
    }
    
    const root = ReactDOM.createRoot(rootEl);
    root.render(<Home availableKeywords={availableKeywords} />);
  }
});