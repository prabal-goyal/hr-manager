/* ============================================================
   prototype.jsx — Naveya v2 assembled prototype: Login → Shell2 →
   all seven Pages2.* routes. Composes ONLY from window.G2, window.UI2,
   window.Screens2.Login and window.Shell2 + window.Pages2.*. Classic-
   JSX-runtime IIFE, no imports/exports, inline styles only.

   Load order (see design/v2-prototype.html):
     v2/tokens.jsx → v2/kit.jsx → v2/shell.jsx → v2/pages/*.jsx → v2/prototype.jsx
   ============================================================ */
(function () {
  const { useState } = React;
  const { ThemeProvider, LangProvider } = window.UI2;
  const { Login } = window.Screens2;

  const ROUTES = ["home", "attendance", "leave", "payslips", "documents", "profile", "substitution"];

  function RouteContent({ route, onNavigate }) {
    const Pages2 = window.Pages2 || {};
    switch (route) {
      case "home": return <Pages2.Dashboard onNavigate={onNavigate} />;
      case "attendance": return <Pages2.Attendance />;
      case "leave": return <Pages2.Leave />;
      case "payslips": return <Pages2.Payslips />;
      case "documents": return <Pages2.Documents />;
      case "profile": return <Pages2.Profile />;
      case "substitution": return <Pages2.Substitution />;
      default: return <Pages2.Dashboard onNavigate={onNavigate} />;
    }
  }

  // Deep-linking: ?route=<home|attendance|leave|payslips|documents|profile|
  // substitution> boots straight into Shell2 at that route, skipping Login.
  // ?screen=login (or no ?route= at all) shows Login as before — the
  // existing click-through flow is unchanged. ?theme=dark|light and
  // ?lang=en|hi seed the providers' initial state (still user-toggleable).
  function readParams() {
    if (typeof window === "undefined" || !window.location) {
      return { route: null, screen: null, theme: null, lang: null };
    }
    const qp = new URLSearchParams(window.location.search);
    const route = qp.get("route");
    const screen = qp.get("screen");
    const theme = qp.get("theme");
    const lang = qp.get("lang");
    return {
      route: ROUTES.indexOf(route) >= 0 ? route : null,
      screen: screen === "login" ? "login" : null,
      theme: theme === "dark" || theme === "light" ? theme : null,
      lang: lang === "en" || lang === "hi" ? lang : null,
    };
  }

  function Prototype() {
    const params = readParams();
    const initialScreen = params.route && !params.screen ? "app" : "login";
    const [screen, setScreen] = useState(initialScreen); // "login" | "app"
    const [route, setRoute] = useState(params.route || "home");
    const Shell2 = window.Shell2;

    const handleNavigate = (r) => setRoute(ROUTES.indexOf(r) >= 0 ? r : "home");
    const handleSignOut = () => { setScreen("login"); setRoute("home"); };

    return (
      <ThemeProvider initialMode={params.theme || "light"}>
        <LangProvider initialLang={params.lang || "en"}>
          {screen === "login" ? (
            <Login onContinue={() => setScreen("app")} onSSO={() => setScreen("app")} />
          ) : (
            <Shell2 route={route} onNavigate={handleNavigate} onSignOut={handleSignOut} schoolName="Sunrise Public School">
              <RouteContent route={route} onNavigate={handleNavigate} />
            </Shell2>
          )}
        </LangProvider>
      </ThemeProvider>
    );
  }

  window.Prototype2 = Prototype;
})();
