import React, { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";
import { AuthProvider } from "./context/AuthContext";
import { RefreshProvider } from "./context/RefreshContext";
ReactDOM.createRoot(document.getElementById("root")).render(
  <StrictMode>
    <RefreshProvider>
    <AuthProvider >
      <App />
    </AuthProvider>
    </RefreshProvider>
  </StrictMode>
);
