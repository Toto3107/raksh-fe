import React from "react";
import FinalRegisterBorewell from "./components/FinalRegisterBorewell";

const App: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, #0ea5e9 0, #020617 38%), radial-gradient(circle at bottom right, #22c55e 0, #020617 40%)",
        color: "#e5e7eb",
        padding: "2rem 1rem",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <header style={{ marginBottom: "1.5rem" }}>
          <h1 style={{ fontSize: "2rem", marginBottom: 8 }}>
            RaKsh – Borewell Registration
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#e5e7eb" }}>
            Log existing borewells with accurate location and outcomes to power RaKsh&apos;s
            AI models and governance analytics.
          </p>
        </header>

        <FinalRegisterBorewell />
      </div>
    </div>
  );
};

export default App;
