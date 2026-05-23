import React from "react";
import ReactDOM from "react-dom/client";
import App from "../driver_diagram_mvp.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
