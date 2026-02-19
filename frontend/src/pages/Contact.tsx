import { useState } from "react";
import Sidebar from "../components/Sidebar";
import { sendContactMessage } from "@/lib/api";
import { toast } from "sonner";

export default function Contact() {
  const [form, setForm] = useState({ name: "", email: "", subject: "general", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      toast.error("Veuillez remplir tous les champs obligatoires.");
      return;
    }
    setSending(true);
    try {
      await sendContactMessage({
        name: form.name,
        email: form.email,
        subject: form.subject,
        message: form.message,
      });
      setSent(true);
      toast.success("Message envoyé avec succès !");
      setForm({ name: "", email: "", subject: "general", message: "" });
      setTimeout(() => setSent(false), 5000);
    } catch {
      toast.error("Erreur lors de l'envoi du message.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#030712]">
      <Sidebar />
      <main className="flex-1 ml-[260px] p-7 max-w-6xl mx-auto">
        {/* Background */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute w-[500px] h-[500px] rounded-full bg-cyan-500/5 blur-[80px] top-[-150px] left-[200px]" />
          <div className="absolute w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-[80px] bottom-[-150px] right-[-50px]" />
        </div>

        <div className="relative z-10">
          {/* Header */}
          <div className="text-center mb-10 pt-8">
            <h1 className="text-5xl font-black bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 bg-clip-text text-transparent">
              📬 Contact
            </h1>
            <p className="text-gray-400 mt-3 text-lg max-w-lg mx-auto">
              Une question ? Un problème ? Contactez notre équipe de support.
            </p>
          </div>

          {sent && (
            <div className="max-w-xl mx-auto mb-6 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center text-emerald-400 font-semibold">
              ✅ Votre message a été envoyé avec succès ! Nous vous répondrons dans les plus brefs délais.
            </div>
          )}

          {/* Info Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[
              { icon: "📧", title: "Email", value: "support@cryptoia.com" },
              { icon: "💬", title: "Discord", value: "discord.gg/cryptoia" },
              { icon: "⏰", title: "Réponse", value: "< 24 heures" },
            ].map((info) => (
              <div key={info.title} className="bg-slate-800/50 border border-white/5 rounded-2xl p-6 text-center hover:border-blue-500/20 transition-all hover:-translate-y-1">
                <div className="text-3xl mb-3">{info.icon}</div>
                <div className="text-sm font-bold text-white mb-1">{info.title}</div>
                <div className="text-sm text-cyan-400">{info.value}</div>
              </div>
            ))}
          </div>

          {/* Form */}
          <div className="bg-slate-900/70 backdrop-blur-xl border border-white/5 rounded-3xl p-8 max-w-2xl mx-auto shadow-2xl">
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-5">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nom *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-900/90 border-2 border-white/5 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all"
                    placeholder="Votre nom"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 bg-slate-900/90 border-2 border-white/5 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all"
                    placeholder="votre@email.com"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5 mb-5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Sujet</label>
                <select
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900/90 border-2 border-white/5 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all"
                >
                  <option value="general">Question générale</option>
                  <option value="bug">Signaler un bug</option>
                  <option value="feature">Suggestion de fonctionnalité</option>
                  <option value="billing">Facturation / Abonnement</option>
                  <option value="partnership">Partenariat</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5 mb-6">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Message *</label>
                <textarea
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  required
                  rows={5}
                  className="w-full px-4 py-3 bg-slate-900/90 border-2 border-white/5 rounded-xl text-white text-sm focus:border-blue-500 focus:ring-0 outline-none transition-all resize-none"
                  placeholder="Décrivez votre demande..."
                />
              </div>
              <button
                type="submit"
                disabled={sending}
                className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-blue-500/20 transition-all hover:-translate-y-0.5 disabled:opacity-50"
              >
                {sending ? "⏳ Envoi en cours..." : "📤 Envoyer le message"}
              </button>
            </form>
          </div>

          {/* FAQ */}
          <div className="mt-10 bg-slate-900/50 border border-white/5 rounded-3xl p-8 max-w-2xl mx-auto">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">❓ FAQ</h2>
            {[
              { q: "Comment annuler mon abonnement ?", a: "Rendez-vous dans Mon Compte > Abonnement > Annuler." },
              { q: "Les données sont-elles en temps réel ?", a: "Oui, nos données sont mises à jour toutes les 30 secondes via CoinGecko et d'autres APIs." },
              { q: "Puis-je utiliser CryptoIA sur mobile ?", a: "Oui, la plateforme est responsive et fonctionne sur tous les appareils." },
            ].map((faq, i) => (
              <div key={i} className="mb-4 pb-4 border-b border-white/5 last:border-0 last:mb-0 last:pb-0">
                <h3 className="text-sm font-bold text-white mb-1">{faq.q}</h3>
                <p className="text-sm text-gray-400">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}