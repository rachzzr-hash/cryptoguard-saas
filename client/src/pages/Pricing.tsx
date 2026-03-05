import { t, type Lang } from "../i18n";
import { useState } from "react";

interface PricingProps {
  lang: Lang;
  user: any;
  onNav: (p: string) => void;
  onCheckout: (plan: string) => void;
  onCryptoCheckout?: (plan: string, currency: string) => void;
}

const CRYPTO_COINS = [
  { symbol: "sol", name: "Solana", emoji: "◎", color: "text-purple-400" },
  { symbol: "usdt", name: "USDT", emoji: "₮", color: "text-green-400" },
  { symbol: "usdc", name: "USDC", emoji: "◉", color: "text-blue-400" },
  { symbol: "btc", name: "Bitcoin", emoji: "₿", color: "text-orange-400" },
  { symbol: "eth", name: "Ethereum", emoji: "Ξ", color: "text-indigo-400" },
];

function CryptoModal({ plan, lang, onClose, onPay }: {
  plan: string; lang: Lang; onClose: () => void; onPay: (currency: string) => void;
}) {
  const [selected, setSelected] = useState("sol");
  const title = lang === "fr" ? "Payer en crypto" : lang === "es" ? "Pagar con cripto" : lang === "ar" ? "الدفع بالعملة المشفرة" : "Pay with crypto";
  const subtitle = lang === "fr" ? "Choisissez votre cryptomonnaie" : lang === "es" ? "Elige tu criptomoneda" : lang === "ar" ? "اختر عملتك المشفرة" : "Choose your cryptocurrency";
  const price = plan === "pro" ? 29 : 79;
  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 w-full max-w-sm">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-lg font-bold text-white">{title}</h3>
            <p className="text-sm text-gray-500">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white text-xl">×</button>
        </div>
        <div className="bg-[#0d1117] rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-gray-400 text-sm">{plan.charAt(0).toUpperCase() + plan.slice(1)}</span>
          <span className="text-white font-bold">${price}/mois</span>
        </div>
        <div className="grid grid-cols-5 gap-2 mb-5">
          {CRYPTO_COINS.map((coin) => (
            <button
              key={coin.symbol}
              onClick={() => setSelected(coin.symbol)}
              className={`flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                selected === coin.symbol
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-[#30363d] bg-[#0d1117] hover:border-[#444c56]"
              }`}
            >
              <span className={`text-lg font-bold ${coin.color}`}>{coin.emoji}</span>
              <span className="text-xs text-gray-400">{coin.symbol.toUpperCase()}</span>
            </button>
          ))}
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-3 mb-4">
          <p className="text-yellow-200/60 text-xs">
            {lang === "fr"
              ? "⚡ Paiement via NOWPayments. Le plan s'active automatiquement après confirmation."
              : "⚡ Payment via NOWPayments. Plan activates automatically after confirmation."}
          </p>
        </div>
        <button
          onClick={() => onPay(selected)}
          className="w-full py-3 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-xl font-medium transition-all"
        >
          {lang === "fr" ? `Payer en ${selected.toUpperCase()} →` : `Pay with ${selected.toUpperCase()} →`}
        </button>
      </div>
    </div>
  );
}

function PlanCard({
  name, desc, price, currency, features, cta, popular, color, onCta, disabled
}: {
  name: string; desc: string; price: number | string; currency: string; features: string[];
  cta: string; popular?: boolean; color: string; onCta: () => void; disabled?: boolean;
}) {
  return (
    <div className={`relative bg-[#161b22] border rounded-2xl p-7 flex flex-col ${popular ? "border-blue-500/60 shadow-lg shadow-blue-900/20" : "border-[#30363d]"}`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold px-4 py-1 rounded-full">
          ⭐ Populaire
        </div>
      )}
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white mb-1">{name}</h3>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <div className="mb-6">
        <span className="text-4xl font-bold text-white">{typeof price === "number" && price > 0 ? `$${price}` : price}</span>
        {typeof price === "number" && price > 0 && (
          <span className="text-gray-500 text-sm ml-1">{currency}</span>
        )}
      </div>
      <ul className="space-y-3 mb-8 flex-1">
        {features.map((f) => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-gray-300">
            <span className="text-green-400 mt-0.5 flex-shrink-0">✓</span>
            <span>{f}</span>
          </li>
        ))}
      </ul>
      <button
        onClick={onCta}
        disabled={disabled}
        className={`w-full py-3 rounded-lg font-medium text-sm transition-colors ${
          popular
            ? "bg-blue-600 hover:bg-blue-500 text-white"
            : disabled
            ? "bg-[#2d333b] text-gray-500 cursor-not-allowed"
            : "bg-[#2d333b] hover:bg-[#373e47] text-white border border-[#444c56]"
        }`}
      >
        {cta}
      </button>
    </div>
  );
}

export default function Pricing({ lang, user, onNav, onCheckout, onCryptoCheckout }: PricingProps) {
  const [cryptoModal, setCryptoModal] = useState<string | null>(null);

  function handleCryptoPay(plan: string, currency: string) {
    setCryptoModal(null);
    if (onCryptoCheckout) onCryptoCheckout(plan, currency);
  }

  return (
    <div className="min-h-screen bg-[#0f1117] py-16 px-4" dir={lang === "ar" ? "rtl" : "ltr"}>
      {cryptoModal && (
        <CryptoModal
          plan={cryptoModal}
          lang={lang}
          onClose={() => setCryptoModal(null)}
          onPay={(currency) => handleCryptoPay(cryptoModal, currency)}
        />
      )}
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h1 className="text-4xl font-bold text-white mb-3">{t("pricing.title", lang)}</h1>
          <p className="text-gray-400">{t("pricing.subtitle", lang)}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <PlanCard
            name={t("pricing.free.name", lang)}
            desc={t("pricing.free.desc", lang)}
            price={t("common.free", lang)}
            currency=""
            features={[
              t("pricing.free.f1", lang),
              t("pricing.free.f2", lang),
              t("pricing.free.f3", lang),
            ]}
            cta={t("pricing.free.cta", lang)}
            color="gray"
            onCta={() => user ? onNav("dashboard") : onNav("register")}
            disabled={user?.plan === "free"}
          />
          <div className="flex flex-col gap-3">
            <PlanCard
              name={t("pricing.pro.name", lang)}
              desc={t("pricing.pro.desc", lang)}
              price={29}
              currency={t("pricing.monthly", lang)}
              features={[
                t("pricing.pro.f1", lang),
                t("pricing.pro.f2", lang),
                t("pricing.pro.f3", lang),
                t("pricing.pro.f4", lang),
                t("pricing.pro.f5", lang),
              ]}
              cta={t("pricing.pro.cta", lang)}
              popular
              color="blue"
              onCta={() => user ? onCheckout("pro") : onNav("register")}
              disabled={user?.plan === "pro"}
            />
            {user && user.plan !== "pro" && (
              <button
                onClick={() => setCryptoModal("pro")}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>₿</span>
                <span>{lang === "fr" ? "Payer en crypto" : lang === "es" ? "Pagar con cripto" : lang === "ar" ? "الدفع بالعملة المشفرة" : "Pay with crypto"}</span>
              </button>
            )}
          </div>
          <div className="flex flex-col gap-3">
            <PlanCard
              name={t("pricing.business.name", lang)}
              desc={t("pricing.business.desc", lang)}
              price={79}
              currency={t("pricing.monthly", lang)}
              features={[
                t("pricing.business.f1", lang),
                t("pricing.business.f2", lang),
                t("pricing.business.f3", lang),
                t("pricing.business.f4", lang),
                t("pricing.business.f5", lang),
                t("pricing.business.f6", lang),
              ]}
              cta={t("pricing.business.cta", lang)}
              color="purple"
              onCta={() => user ? onCheckout("business") : onNav("register")}
              disabled={user?.plan === "business"}
            />
            {user && user.plan !== "business" && (
              <button
                onClick={() => setCryptoModal("business")}
                className="w-full py-2.5 rounded-lg text-sm font-medium bg-gradient-to-r from-purple-900/40 to-blue-900/40 border border-purple-500/30 hover:border-purple-500/60 text-purple-300 hover:text-white transition-all flex items-center justify-center gap-2"
              >
                <span>₿</span>
                <span>{lang === "fr" ? "Payer en crypto" : lang === "es" ? "Pagar con cripto" : lang === "ar" ? "الدفع بالعملة المشفرة" : "Pay with crypto"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Payment methods */}
        <div className="mt-10 text-center">
          <p className="text-gray-600 text-sm mb-4">
            {lang === "fr" ? "Moyens de paiement acceptés" :
             lang === "en" ? "Accepted payment methods" :
             lang === "es" ? "Métodos de pago aceptados" :
             lang === "ar" ? "طرق الدفع المقبولة" : "Formas de pagamento aceitas"}
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap mb-3">
            {["💳 Carte bancaire", "🅿️ PayPal", "🍎 Apple Pay", "🔵 Google Pay"].map((m) => (
              <div key={m} className="flex items-center gap-2 text-gray-500 text-sm bg-[#161b22] border border-[#30363d] px-3 py-1.5 rounded-md">
                {m}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {[
              { emoji: "◎", label: "SOL", color: "text-purple-400" },
              { emoji: "₿", label: "BTC", color: "text-orange-400" },
              { emoji: "Ξ", label: "ETH", color: "text-indigo-400" },
              { emoji: "₮", label: "USDT", color: "text-green-400" },
              { emoji: "◉", label: "USDC", color: "text-blue-400" },
            ].map((c) => (
              <div key={c.label} className={`flex items-center gap-1.5 text-sm bg-[#161b22] border border-purple-500/20 px-3 py-1.5 rounded-md ${c.color}`}>
                <span className="font-bold">{c.emoji}</span>
                <span>{c.label}</span>
              </div>
            ))}
          </div>
          <p className="text-gray-600 text-xs mt-2">
            {lang === "fr" ? "Crypto via NOWPayments · Activation automatique" : "Crypto via NOWPayments · Auto-activation"}
          </p>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-white text-center mb-6">FAQ</h3>
          <div className="space-y-4">
            {[
              {
                q: lang === "fr" ? "Puis-je annuler à tout moment ?" : "Can I cancel at any time?",
                a: lang === "fr" ? "Oui, vous pouvez annuler votre abonnement à tout moment depuis votre portail de facturation." : "Yes, you can cancel your subscription anytime from your billing portal."
              },
              {
                q: lang === "fr" ? "Ma carte bancaire est-elle sécurisée ?" : "Is my payment secure?",
                a: lang === "fr" ? "Oui, tous les paiements sont traités par Stripe, certifié PCI DSS niveau 1." : "Yes, all payments are processed by Stripe, PCI DSS Level 1 certified."
              },
            ].map((faq) => (
              <div key={faq.q} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
                <h4 className="font-medium text-white mb-2">{faq.q}</h4>
                <p className="text-sm text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
        }
