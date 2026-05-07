import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import CreateSessionPage from "./CreateSessionPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/create-session" element={<CreateSessionPage />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
