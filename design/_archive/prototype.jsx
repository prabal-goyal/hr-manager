/* ============================================================
   Naveya — Working prototype (router)
   A real navigable app, distinct from the design canvas (index.html).
   Reuses window.Screens (design/screens.jsx), composed on top of
   window.UI (design/kit.jsx). Classic JSX runtime — no imports.

   Flow: Login -> Continue -> Employee Home (the primary surface,
   most users are teachers/staff) -> left nav switches employee
   routes (Home real, rest are labeled placeholders). "View admin
   console" (top bar) reaches a secondary AdminStub route; "Back to
   employee home" returns. Sign out returns to Login.

   A single ThemeProvider wraps the whole app. The ONE ThemeToggle
   lives in the employee shell's top bar (per design/screens.jsx) —
   theme mode is a separate state slot from the route, so it persists
   across sign-out/sign-in, letting Login be verified in both themes
   without a second, overlapping toggle control.
   ============================================================ */
function App() {
  const { useState } = React;
  const [screen, setScreen] = useState("login"); // "login" | "admin" | employee route key
  // Role gating check: EmployeeShell hides "View admin console" unless role
  // isn't "employee". Default is the plain-employee experience (the
  // primary surface); append ?role=admin to the URL to verify the gate.
  const role = new URLSearchParams(window.location.search).get("role") || "employee";

  if (screen === "login") {
    return (
      <window.Screens.Login
        onContinue={() => setScreen("home")}
        onSSO={() => setScreen("home")}
      />
    );
  }

  if (screen === "admin") {
    return <window.Screens.AdminStub onBack={() => setScreen("home")} />;
  }

  return (
    <window.Screens.Employee
      route={screen}
      role={role}
      onNavigate={setScreen}
      onSignOut={() => setScreen("login")}
      onViewAdmin={() => setScreen("admin")}
    />
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <window.UI.ThemeProvider>
    <App />
  </window.UI.ThemeProvider>
);
