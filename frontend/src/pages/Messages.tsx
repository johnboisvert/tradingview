import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import { getMessages, getEbooks, type ContactMessage, type Ebook } from "@/lib/api";
import {
  MessageSquare,
  BookOpen,
  Mail,
  Clock,
  Eye,
  Download,
  ChevronDown,
  ChevronUp,
  User,
  FileText,
  Shield,
} from "lucide-react";

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "ebooks">("messages");

  useEffect(() => {
    Promise.all([getMessages(), getEbooks()])
      .then(([msgData, ebData]) => {
        setMessages(msgData.messages || []);
        setEbooks(ebData.ebooks || []);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <h1 className="text-2xl font-extrabold tracking-tight mb-1">Messages & Ebooks</h1>
      <p className="text-sm text-gray-400 mb-6">Consultez les messages de contact et gérez les ebooks.</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "messages"
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
              : "bg-[#111827] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          Messages ({messages.length})
        </button>
        <button
          onClick={() => setActiveTab("ebooks")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
            activeTab === "ebooks"
              ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/20"
              : "bg-[#111827] text-gray-400 border border-white/[0.06] hover:bg-white/[0.04]"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Ebooks ({ebooks.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === "messages" ? (
        /* Messages List */
        <div className="space-y-3">
          {messages.length === 0 ? (
            <div className="bg-[#111827] border border-white/[0.06] rounded-2xl p-12 text-center">
              <Mail className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucun message.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`bg-[#111827] border rounded-2xl overflow-hidden transition-all ${
                  msg.read ? "border-white/[0.06]" : "border-indigo-500/20 shadow-lg shadow-indigo-500/5"
                }`}
              >
                <button
                  onClick={() => setExpandedMsg(expandedMsg === msg.id ? null : msg.id)}
                  className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.02] transition-colors"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    msg.read ? "bg-white/[0.04]" : "bg-indigo-500/10"
                  }`}>
                    <User className={`w-5 h-5 ${msg.read ? "text-gray-500" : "text-indigo-400"}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-sm font-bold text-white truncate">{msg.name}</span>
                      {!msg.read && (
                        <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-gray-400 truncate">{msg.subject}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1 text-[11px] text-gray-500">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(msg.created_at).toLocaleDateString("fr-FR")}</span>
                    </div>
                    {expandedMsg === msg.id ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </button>

                {expandedMsg === msg.id && (
                  <div className="px-4 pb-4 border-t border-white/[0.04]">
                    <div className="mt-3 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      <div className="flex items-center gap-2 mb-2 text-xs text-gray-500">
                        <Mail className="w-3 h-3" />
                        <span>{msg.email}</span>
                      </div>
                      <p className="text-sm text-gray-300 leading-relaxed">{msg.message}</p>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-all">
                        <Eye className="w-3 h-3" /> Marquer comme lu
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Ebooks Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ebooks.length === 0 ? (
            <div className="col-span-full bg-[#111827] border border-white/[0.06] rounded-2xl p-12 text-center">
              <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">Aucun ebook configuré.</p>
            </div>
          ) : (
            ebooks.map((eb) => (
              <div
                key={eb.id}
                className={`bg-[#111827] border rounded-2xl p-5 transition-all hover:shadow-xl hover:shadow-black/20 ${
                  eb.active ? "border-white/[0.06] hover:border-indigo-500/20" : "border-red-500/10 opacity-60"
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center flex-shrink-0 border border-indigo-500/10">
                    <FileText className="w-6 h-6 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white mb-1 truncate">{eb.title}</h3>
                    <p className="text-xs text-gray-400 line-clamp-2 mb-3">{eb.description}</p>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                        <Shield className="w-2.5 h-2.5" />
                        {eb.plan_required}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.04] text-gray-400">
                        <Download className="w-2.5 h-2.5" />
                        {eb.downloads} téléchargements
                      </span>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        eb.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                      }`}>
                        {eb.active ? "Actif" : "Inactif"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </AdminLayout>
  );
}