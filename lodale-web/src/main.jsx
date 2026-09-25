import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason && 
    (event.reason.name === 'AbortError' || 
     (typeof event.reason.message === 'string' && event.reason.message.includes('Transition was skipped')))
  ) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
