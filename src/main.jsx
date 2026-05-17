import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App";
import CreateSessionPage from "./CreateSessionPage";
import "./i18n";
import Calculation from "./CalculationPage";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/create-session" element={<CreateSessionPage />} />
        <Route path="/calculation" element={<Calculation />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
