import { type Lang } from "../i18n";
import { useState } from "react";

interface TelegramTutorialProps {
  lang: Lang;
  onNav: (p: string) => void;
}

const steps = {
  fr: [
    {
      number: "01",
      title: "Créer votre bot Telegram",
      icon: "🤖",
      content: [
        "Ouvrez Telegram et recherchez **@BotFather**",
        "Tapez `/newbot` et appuyez sur Envoi",
        "Choisissez un nom pour votre bot (ex: "Mon CryptoGuard Bot")",
        "Choisissez un username (doit finir par 'bot', ex: "mycryptoguard_bot")",
        "BotFather vous envoie votre **token API** — conservez-le précieusement !",
      ],
      tip: "Votre token ressemble à: 7123456789:AAHd7e-KxYJT...",
    },
    {
      number: "02",
      title: "Obtenir votre Chat ID",
      icon: "🆔",
      content: [
        "Envoyez n'importe quel message à votre nouveau bot",
        "Ouvrez ce lien dans votre navigateur (remplacez TOKEN) :",
        "`https://api.telegram.org/botTOKEN/getUpdates`",
        "Cherchez `"chat":{"id":XXXXXXXXX}` dans la réponse JSON",
        "Ce numéro est votre **Chat ID**",
      ],
      tip: "Exemple de Chat ID: 987654321",
    },
    {
      number: "03",
      title: "Configurer les alertes",
      icon: "⚙️",
      content: [
        "Dans votre dashboard CryptoGuard, allez dans **Paramètres**",
        "Entrez votre **Bot Token** dans le champ prévu",
        "Entrez votre **Chat ID**",
        "Cliquez sur **Tester la connexion** pour vérifier",
        "Activez les alertes souhaitées (nouveaux tokens SAFE, wallets ruggers détectés)",
      ],
      tip: "Vous pouvez aussi utiliser un Chat ID de groupe pour partager les alertes avec votre équipe !",
    },
    {
      number: "04",
      title: "Types d'alertes disponibles",
      icon: "🔔",
      content: [
        "🟢 **Token SAFE détecté** — Score ≥50, liquidité ≥$1K, top holder <40%",
        "🔴 **Wallet rugger identifié** — Win rate >50% sur tokens RISKY",
        "⚠️ **Alerte liquidité** — Token SAFE avec liquidité >$10K",
        "📊 **Rapport quotidien** — Récap des 24h à l'heure de votre choix",
        "🚨 **Alerte rug détecté** — Token suivi qui passe RISKY",
      ],
      tip: "Les alertes sont envoyées en temps réel après chaque scan (toutes les 15 min)",
    },
    {
      number: "05",
      title: "Format des messages",
      icon: "📱",
      content: [
        "Chaque alerte Telegram contient :",
        "• **Nom du token** et ticker ($SYMBOL)",
        "• **Adresse contrat** (cliquable)",
        "• **Score RugCheck** et niveau de risque",
        "• **Liquidité** en USD",
        "• **Lien DexScreener** direct",
      ],
      tip: "Les messages sont formatés en Markdown pour une lecture rapide sur mobile",
    },
  ],
  en: [
    {
      number: "01",
      title: "Create your Telegram bot",
      icon: "🤖",
      content: [
        "Open Telegram and search for **@BotFather**",
        "Type `/newbot` and press Send",
        "Choose a name for your bot (e.g. "My CryptoGuard Bot")",
        "Choose a username (must end in 'bot', e.g. "mycryptoguard_bot")",
        "BotFather sends you your **API token** — keep it safe!",
      ],
      tip: "Your token looks like: 7123456789:AAHd7e-KxYJT...",
    },
    {
      number: "02",
      title: "Get your Chat ID",
      icon: "🆔",
      content: [
        "Send any message to your new bot",
        "Open this URL in your browser (replace TOKEN):",
        "`https://api.telegram.org/botTOKEN/getUpdates`",
        "Find `"chat":{"id":XXXXXXXXX}` in the JSON response",
        "That number is your **Chat ID**",
      ],
      tip: "Example Chat ID: 987654321",
    },
    {
      number: "03",
      title: "Configure alerts",
      icon: "⚙️",
      content: [
        "In your CryptoGuard dashboard, go to **Settings**",
        "Enter your **Bot Token** in the provided field",
        "Enter your **Chat ID**",
        "Click **Test Connection** to verify",
        "Enable desired alerts (new SAFE tokens, rug wallets detected)",
      ],
      tip: "You can also use a Group Chat ID to share alerts with your team!",
    },
    {
      number: "04",
      title: "Available alert types",
      icon: "🔔",
      content: [
        "🟢 **SAFE token detected** — Score ≥50, liquidity ≥$1K, top holder <40%",
        "🔴 **Rugger wallet identified** — Win rate >50% on RISKY tokens",
        "⚠️ **Liquidity alert** — SAFE token with liquidity >$10K",
        "📊 **Daily report** — 24h summary at your chosen time",
        "🚨 **Rug detected** — Tracked token turns RISKY",
      ],
      tip: "Alerts are sent in real-time after each scan (every 15 min)",
    },
    {
      number: "05",
      title: "Message format",
      icon: "📱",
      content: [
        "Each Telegram alert contains:",
        "• **Token name** and ticker ($SYMBOL)",
        "• **Contract address** (clickable)",
        "• **RugCheck score** and risk level",
        "• **Liquidity** in USD",
        "• **Direct DexScreener link**",
      ],
      tip: "Messages are Markdown-formatted for quick mobile reading",
    },
  ],
};

function renderContent(text: string) {
  // Bold **text**
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((p, i) =>
    i % 2 === 1 ? <strong key={i} className="text-white font-semibold">{p}</strong> : p
  );
}

export default function TelegramTutorial({ lang, onNav }: TelegramTutorialProps) {
  const [activeStep, setActiveStep] = useState(0);
  const isRtl = lang === "ar";

  // Fallback to EN if no translation for this lang
  const stepsData = (steps as any)[lang] || steps.en;

  const title = lang === "fr" ? "Tutoriel Alertes Telegram" :
                lang === "es" ? "Tutorial Alertas Telegram" :
                lang === "de" ? "Telegram-Benachrichtigungen" :
                lang === "pt" ? "Tutorial Alertas Telegram" :
                lang === "ar" ? "دليل تنبيهات تيليغرام" :
                "Telegram Alerts Tutorial";

  const subtitle = lang === "fr" ? "Recevez des alertes en temps réel sur vos tokens Solana directement dans Telegram" :
                   lang === "es" ? "Recibe alertas en tiempo real de tus tokens Solana directamente en Telegram" :
                   lang === "de" ? "Erhalten Sie Echtzeit-Benachrichtigungen zu Solana-Tokens direkt in Telegram" :
                   lang === "pt" ? "Receba alertas em tempo real sobre seus tokens Solana diretamente no Telegram" :
                   lang === "ar" ? "احصل على تنبيهات فورية لرموز Solana مباشرة في Telegram" :
                   "Receive real-time alerts for your Solana tokens directly in Telegram";

  return (
    <div className="min-h-screen bg-[#0f1117] py-12 px-4" dir={isRtl ? "rtl" : "ltr"}>
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 text-blue-400 text-sm font-medium px-4 py-2 rounded-full border border-blue-500/20 mb-4">
            <span>📱</span>
            <span>Telegram Integration</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">{title}</h1>
          <p className="text-gray-400 max-w-xl mx-auto">{subtitle}</p>
        </div>

        {/* Preview card */}
        <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-6 mb-10">
          <p className="text-gray-500 text-xs uppercase tracking-wider mb-3 font-medium">
            {lang === "fr" ? "Aperçu d'une alerte Telegram" : "Telegram alert preview"}
          </p>
          <div className="bg-[#1a1a2e] rounded-xl p-4 font-mono text-sm border border-[#2d2d4e]">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs flex-shrink-0 mt-0.5">
                🛡️
              </div>
              <div className="space-y-1 text-gray-300">
                <p className="text-green-400 font-bold">🟢 NOUVEAU TOKEN SAFE</p>
                <p><span className="text-gray-500">Token:</span> <span className="text-white font-semibold">MOONCAT</span> <span className="text-gray-400">($MCAT)</span></p>
                <p className="text-gray-400 text-xs">📍 DYnpFe2...k9mPq3</p>
                <p><span className="text-gray-500">Score:</span> <span className="text-green-400">72/100</span> · <span className="text-gray-500">Liquidité:</span> <span className="text-blue-400">$4,200</span></p>
                <p><span className="text-gray-500">Top holder:</span> <span className="text-yellow-400">23%</span></p>
                <p className="mt-2">
                  <span className="text-blue-400 underline cursor-pointer">🔗 Voir sur DexScreener</span>
                </p>
                <p className="text-gray-600 text-xs mt-1">⏰ {new Date().toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Steps navigation */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {stepsData.map((step: any, i: number) => (
            <button
              key={i}
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeStep === i
                  ? "bg-blue-600 text-white"
                  : "bg-[#161b22] text-gray-400 hover:text-white border border-[#30363d]"
              }`}
            >
              <span>{step.icon}</span>
              <span>{lang === "fr" || lang === "en" ? `Étape ${i + 1}` : `Step ${i + 1}`}</span>
            </button>
          ))}
        </div>

        {/* Active step */}
        {stepsData[activeStep] && (
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl p-7">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-2xl flex-shrink-0">
                {stepsData[activeStep].icon}
              </div>
              <div>
                <span className="text-blue-400 text-xs font-mono">{stepsData[activeStep].number}</span>
                <h2 className="text-xl font-bold text-white">{stepsData[activeStep].title}</h2>
              </div>
            </div>

            <ol className="space-y-3 mb-6">
              {stepsData[activeStep].content.map((line: string, j: number) => (
                <li key={j} className={`flex items-start gap-3 text-gray-300 ${line.startsWith("•") ? "ml-4" : ""}`}>
                  {!line.startsWith("•") && !line.startsWith(`\``) && (
                    <span className="w-6 h-6 rounded-full bg-[#21262d] border border-[#30363d] flex items-center justify-center text-xs text-gray-500 flex-shrink-0 mt-0.5">
                      {j + 1}
                    </span>
                  )}
                  {line.startsWith(`\``) ? (
                    <code className="bg-[#0d1117] border border-[#30363d] text-blue-300 px-3 py-1.5 rounded text-xs font-mono block w-full">
                      {line.replace(/`/g, "")}
                    </code>
                  ) : (
                    <span className="leading-relaxed">{renderContent(line)}</span>
                  )}
                </li>
              ))}
            </ol>

            {/* Tip */}
            <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-xl p-4 flex items-start gap-3">
              <span className="text-yellow-400 text-lg flex-shrink-0">💡</span>
              <p className="text-yellow-200/70 text-sm">{stepsData[activeStep].tip}</p>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between mt-6 gap-3">
              <button
                onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
                disabled={activeStep === 0}
                className="px-4 py-2 bg-[#21262d] border border-[#30363d] text-gray-300 rounded-lg text-sm disabled:opacity-30 hover:bg-[#2d333b] transition-colors"
              >
                {isRtl ? "التالي →" : "← Précédent"}
              </button>
              {activeStep < stepsData.length - 1 ? (
                <button
                  onClick={() => setActiveStep(Math.min(stepsData.length - 1, activeStep + 1))}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {lang === "fr" ? "Suivant →" : lang === "ar" ? "← السابق" : "Next →"}
                </button>
              ) : (
                <button
                  onClick={() => onNav("dashboard")}
                  className="px-5 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {lang === "fr" ? "✅ Accéder au Dashboard" : "✅ Go to Dashboard"}
                </button>
              )}
            </div>
          </div>
        )}

        {/* FAQ */}
        <div className="mt-10 grid md:grid-cols-2 gap-4">
          {[
            {
              q: lang === "fr" ? "Mon bot est-il sécurisé ?" : "Is my bot secure?",
              a: lang === "fr" ? "Oui, votre token bot est chiffré et stocké de manière sécurisée. Seul CryptoGuard peut l'utiliser." : "Yes, your bot token is encrypted and securely stored. Only CryptoGuard can use it.",
              icon: "🔒"
            },
            {
              q: lang === "fr" ? "Puis-je avoir plusieurs bots ?" : "Can I have multiple bots?",
              a: lang === "fr" ? "Vous pouvez configurer un bot pour chaque type d'alerte, ou utiliser un seul bot pour tout." : "You can set up one bot per alert type, or use a single bot for everything.",
              icon: "🤖"
            },
            {
              q: lang === "fr" ? "Le plan Free inclut-il Telegram ?" : "Does Free plan include Telegram?",
              a: lang === "fr" ? "Les alertes Telegram sont disponibles à partir du plan Pro." : "Telegram alerts are available from the Pro plan.",
              icon: "📋"
            },
            {
              q: lang === "fr" ? "Alertes sur groupe / canal ?" : "Group / channel alerts?",
              a: lang === "fr" ? "Oui ! Ajoutez votre bot à un groupe et utilisez le Chat ID du groupe pour partager les alertes." : "Yes! Add your bot to a group and use the group Chat ID to share alerts.",
              icon: "👥"
            },
          ].map((faq) => (
            <div key={faq.q} className="bg-[#161b22] border border-[#30363d] rounded-xl p-5">
              <div className="flex items-start gap-3">
                <span className="text-2xl">{faq.icon}</span>
                <div>
                  <h4 className="font-medium text-white mb-1 text-sm">{faq.q}</h4>
                  <p className="text-gray-400 text-xs leading-relaxed">{faq.a}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-10 text-center bg-gradient-to-r from-blue-900/20 to-purple-900/20 border border-blue-500/20 rounded-2xl p-8">
          <p className="text-2xl mb-2">🛡️</p>
          <h3 className="text-xl font-bold text-white mb-2">
            {lang === "fr" ? "Prêt à recevoir vos alertes ?" : "Ready to receive your alerts?"}
          </h3>
          <p className="text-gray-400 text-sm mb-5">
            {lang === "fr" ? "Activez les notifications Telegram depuis votre dashboard CryptoGuard" : "Enable Telegram notifications from your CryptoGuard dashboard"}
          </p>
          <button
            onClick={() => onNav("dashboard")}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition-colors"
          >
            {lang === "fr" ? "Configurer maintenant →" : "Configure now →"}
          </button>
        </div>

      </div>
    </div>
  );
        }
