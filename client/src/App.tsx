import { useState, useEffect } from "react";
import { type Lang } from "./i18n";
import Header from "./components/Header";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import TelegramTutorial from "./pages/TelegramTutorial";
import Admin from "./pages/Admin";
import FloatingCryptoWidget from "./components/FloatingCryptoWidget";

type Page = "home" | "login" | "register" | "pricing" | "dashboard" | "telegram" | "admin";

export default function App() {
  const [page, setPage] = useState<Page>("home");
  const [lang, setLang] = useState<Lang>("fr");
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string>("");
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const t = localStorage.getItem("cg_token");
    if (t) {
      setToken(t);
      fetch("/api/auth/me", { headers: { Authorization: `Bearer ${t}` } })
        .then((r) => r.json())
        .then((u) => {
          if (u.id) { setUser(u); setLang(u.lang || "fr"); }
          else { localStorage.removeItem("cg_token"); }
        })
        .catch(() => localStorage.removeItem("cg_token"));
    }
    fetch("/api/dashboard/stats", { headers: t ? { Authorization: `Bearer ${t}` } : {} })
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("success")) { setPage("dashboard"); window.history.replaceState({}, "", "/"); }
    if (params.get("admin")) { setPage("admin"); window.history.replaceState({}, "", "/"); }
  }, []);

  function handleLogin(u: any, tok: string) {
    setUser(u); setToken(tok); setLang(u.lang || "fr"); setPage("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("cg_token"); setUser(null); setToken(""); setPage("home");
  }

  async function handleCheckout(plan: string) {
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch { alert("Erreur lors du paiement. Vérifiez la configuration Stripe."); }
  }

  async function handleCryptoCheckout(plan: string, currency: string) {
    try {
      const res = await fetch("/api/crypto/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ plan, currency }),
      });
      const data = await res.json();
      if (data.invoice_url) window.location.href = data.invoice_url;
      else alert(data.error || "Erreur paiement crypto. Vérifiez NOWPAYMENTS_API_KEY.");
    } catch { alert("Erreur lors du paiement crypto."); }
  }

  async function handleLangChange(l: Lang) {
    setLang(l);
    if (user && token) {
      await fetch("/api/auth/lang", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lang: l }),
      });
    }
  }

  const dir = lang === "ar" ? "rtl" : "ltr";

  return (
    <div dir={dir} className="min-h-screen" style={{ background: "linear-gradient(135deg, #f4f4f8 0%, #ede9f6 100%)" }}>
      {page !== "admin" && (
        <Header
          lang={lang} onLangChange={handleLangChange} user={user}
          onLogout={handleLogout} page={page}
          onNav={(p) => {
            if (p === "dashboard" && !user) { setPage("login"); return; }
            if (p === "admin" && user?.role !== "admin") return;
            setPage(p as Page);
          }}
        />
      )}
      {page === "home" && <Landing lang={lang} onNav={setPage as any} stats={stats} />}
      {page === "pricing" && <Pricing lang={lang} user={user} onNav={setPage as any} onCheckout={handleCheckout} onCryptoCheckout={handleCryptoCheckout} />}
      {page === "login" && <Auth lang={lang} mode="login" onNav={setPage as any} onSuccess={handleLogin} />}
      {page === "register" && <Auth lang={lang} mode="register" onNav={setPage as any} onSuccess={handleLogin} />}
      {page === "dashboard" && user && <Dashboard lang={lang} user={user} token={token} onNav={setPage as any} />}
      {page === "telegram" && <TelegramTutorial lang={lang} onNav={setPage as any} />}
      {page === "admin" && user?.role === "admin" && <Admin />}
      <FloatingCryptoWidget />
    </div>
  );
}
