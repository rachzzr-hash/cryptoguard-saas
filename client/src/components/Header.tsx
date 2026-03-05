import { useState } from "react";
import { t, LANGUAGES, type Lang } from "../i18n";

interface HeaderProps {
  lang: Lang;
  onLangChange: (l: Lang) => void;
  user: any;
  onLogout: () => void;
  page: string;
  onNav: (p: string) => void;
}

export default function Header({ lang, onLangChange, user, onLogout, page, onNav }: HeaderProps) {
  const [langOpen, setLangOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const current = LANGUAGES.find((l) => l.code === lang);

  return (
    <header className="bg-[#161b22] border-b border-[#30363d] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => onNav("home")} className="flex items-center gap-2 font-bold text-white text-lg">
          <span>🛡️</span>
          <span>CryptoGuard</span>
        </button>

        {/* Nav desktop */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => onNav("home")}
            className={`text-sm transition-colors ${page === "home" ? "text-white" : "text-gray-400 hover:text-white"}`}
          >
            {t("nav.home", lang)}
          </button>
          <button
            onClick={() => onNav("pricing")}
            className={`text-sm transition-colors ${page === "pricing" ? "text-white" : "text-gray-400 hover:text-white"}`}
          >
            {t("nav.pricing", lang)}
          </button>
          {user && (
            <button
              onClick={() => onNav("dashboard")}
              className={`text-sm transition-colors ${page === "dashboard" ? "text-white" : "text-gray-400 hover:text-white"}`}
            >
              {t("nav.dashboard", lang)}
            </button>
          )}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Language picker */}
          <div className="relative">
            <button
              onClick={() => setLangOpen(!langOpen)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-[#1c2130] border border-[#30363d] text-sm text-gray-300 hover:text-white"
            >
              <span>{current?.flag}</span>
              <span className="hidden sm:inline">{current?.code.toUpperCase()}</span>
              <span className="text-xs opacity-50">▾</span>
            </button>
            {langOpen && (
              <div className="absolute right-0 mt-1 bg-[#1c2130] border border-[#30363d] rounded-lg shadow-xl py-1 w-44 z-50">
                {LANGUAGES.map((l) => (
                  <button
                    key={l.code}
                    onClick={() => { onLangChange(l.code); setLangOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left hover:bg-[#2d333b] ${lang === l.code ? "text-blue-400" : "text-gray-300"}`}
                  >
                    <span>{l.flag}</span>
                    <span>{l.label}</span>
                    {lang === l.code && <span className="ml-auto text-blue-400">✓</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Auth buttons */}
          {!user ? (
            <>
              <button
                onClick={() => onNav("login")}
                className="hidden sm:block text-sm text-gray-300 hover:text-white px-3 py-1.5"
              >
                {t("nav.login", lang)}
              </button>
              <button
                onClick={() => onNav("register")}
                className="text-sm bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-md"
              >
                {t("nav.register", lang)}
              </button>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <span className={`hidden sm:inline text-xs px-2 py-0.5 rounded-full font-medium ${
                user.plan === "business" ? "bg-purple-900/50 text-purple-300 border border-purple-600/30" :
                user.plan === "pro" ? "bg-blue-900/50 text-blue-300 border border-blue-600/30" :
                "bg-gray-700 text-gray-300"
              }`}>
                {user.plan?.toUpperCase()}
              </span>
              <button
                onClick={onLogout}
                className="text-sm text-gray-400 hover:text-white px-2 py-1.5"
              >
                {t("nav.logout", lang)}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
