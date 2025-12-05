import * as React from "react";
import * as ReactDOM from "react-dom/client";
import Home from "./Home";


document.addEventListener("DOMContentLoaded", () => {
  const rootEl = document.getElementById("root");
  if (rootEl) {
    const root = ReactDOM.createRoot(rootEl);
    root.render(<Home />);
  }
});