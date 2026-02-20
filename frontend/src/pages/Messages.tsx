import { useEffect, useState } from "react";
import AdminLayout from "@/components/AdminLayout";
import {
  getMessages,
  getEbooks,
  markMessageRead,
  deleteMessage,
  addEbook,
  updateEbook,
  deleteEbook,
  type ContactMessage,
  type Ebook,
} from "@/lib/api";
import { toast } from "sonner";
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
  Plus,
  Trash2,
  Edit3,
  X,
  Save,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import Footer from "@/components/Footer";

const PLAN_OPTIONS = ["free", "premium", "advanced", "pro", "elite"];
const CATEGORY_OPTIONS = ["Guides", "Cheat Sheets", "Templates", "Calendriers", "Infographies", "Extras"];
const FORMAT_OPTIONS = ["PDF", "XLSX", "PNG", "ZIP", "DOCX"];

interface EbookFormData {
  title: string;
  description: string;
  file_path: string;
  plan_required: string;
  active: boolean;
  category: string;
  format: string;
  size: string;
}

const EMPTY_EBOOK_FORM: EbookFormData = {
  title: "",
  description: "",
  file_path: "",
  plan_required: "free",
  active: true,
  category: "Guides",
  format: "PDF",
  size: "",
};

export default function MessagesPage() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [ebooks, setEbooks] = useState<Ebook[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedMsg, setExpandedMsg] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<"messages" | "ebooks">("messages");

  // Ebook form state
  const [showEbookForm, setShowEbookForm] = useState(false);
  const [editingEbookId, setEditingEbookId] = useState<number | null>(null);
  const [ebookForm, setEbookForm] = useState<EbookFormData>(EMPTY_EBOOK_FORM);

  const loadData = () => {
    setLoading(true);
    Promise.all([getMessages(), getEbooks()])
      .then(([msgData, ebData]) => {
        setMessages(msgData.messages || []);
        setEbooks(ebData.ebooks || []);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, []);

  // --- Message Actions ---
  const handleMarkRead = async (id: number) => {
    await markMessageRead(id);
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, read: true } : m)));
    toast.success("Message marqué comme lu");
  };

  const handleDeleteMessage = async (id: number) => {
    if (!confirm("Supprimer ce message ?")) return;
    await deleteMessage(id);
    setMessages((prev) => prev.filter((m) => m.id !== id));
    toast.success("Message supprimé");
  };

  // --- Ebook Actions ---
  const openCreateEbook = () => {
    setEditingEbookId(null);
    setEbookForm(EMPTY_EBOOK_FORM);
    setShowEbookForm(true);
  };

  const openEditEbook = (ebook: Ebook) => {
    setEditingEbookId(ebook.id);
    setEbookForm({
      title: ebook.title,
      description: ebook.description,
      file_path: ebook.file_path,
      plan_required: ebook.plan_required,
      active: ebook.active,
      category: ebook.category || "Guides",
      format: ebook.format || "PDF",
      size: ebook.size || "",
    });
    setShowEbookForm(true);
  };

  const handleSaveEbook = async () => {
    if (!ebookForm.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!ebookForm.description.trim()) {
      toast.error("La description est requise");
      return;
    }

    if (editingEbookId) {
      // Update
      await updateEbook(editingEbookId, ebookForm);
      toast.success("Ebook mis à jour");
    } else {
      // Create
      await addEbook(ebookForm as Omit<Ebook, "id" | "created_at" | "downloads">);
      toast.success("Ebook créé avec succès");
    }
    setShowEbookForm(false);
    setEditingEbookId(null);
    setEbookForm(EMPTY_EBOOK_FORM);
    loadData();
  };

  const handleDeleteEbook = async (id: number) => {
    if (!confirm("Supprimer cet ebook ?")) return;
    await deleteEbook(id);
    toast.success("Ebook supprimé");
    loadData();
  };

  const handleToggleEbookActive = async (ebook: Ebook) => {
    await updateEbook(ebook.id, { active: !ebook.active });
    toast.success(ebook.active ? "Ebook désactivé" : "Ebook activé");
    loadData();
  };

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
          {messages.filter((m) => !m.read).length > 0 && (
            <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center">
              {messages.filter((m) => !m.read).length}
            </span>
          )}
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
                      {!msg.read && (
                        <button
                          onClick={() => handleMarkRead(msg.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                        >
                          <Eye className="w-3 h-3" /> Marquer comme lu
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteMessage(msg.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all"
                      >
                        <Trash2 className="w-3 h-3" /> Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      ) : (
        /* Ebooks Section */
        <div>
          {/* Add Ebook Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={openCreateEbook}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="w-4 h-4" />
              Ajouter un ebook
            </button>
          </div>

          {/* Ebooks Grid */}
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

                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          <Shield className="w-2.5 h-2.5" />
                          {eb.plan_required}
                        </span>
                        {eb.category && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {eb.category}
                          </span>
                        )}
                        {eb.format && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            {eb.format}
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/[0.04] text-gray-400">
                          <Download className="w-2.5 h-2.5" />
                          {eb.downloads} téléchargements
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          eb.active ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                        }`}>
                          {eb.active ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                          {eb.active ? "Actif" : "Inactif"}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => openEditEbook(eb)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 hover:bg-indigo-500/20 transition-all"
                        >
                          <Edit3 className="w-3 h-3" /> Modifier
                        </button>
                        <button
                          onClick={() => handleToggleEbookActive(eb)}
                          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                            eb.active
                              ? "bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20"
                              : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20"
                          }`}
                        >
                          {eb.active ? <XCircle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {eb.active ? "Désactiver" : "Activer"}
                        </button>
                        <button
                          onClick={() => handleDeleteEbook(eb.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 hover:bg-red-500/20 transition-all"
                        >
                          <Trash2 className="w-3 h-3" /> Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ebook Create/Edit Modal */}
      {showEbookForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-white/[0.08] rounded-2xl w-full max-w-lg p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">
                {editingEbookId ? "Modifier l'ebook" : "Ajouter un ebook"}
              </h2>
              <button
                onClick={() => { setShowEbookForm(false); setEditingEbookId(null); }}
                className="p-1.5 rounded-lg hover:bg-white/[0.06] transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Titre *</label>
                <input
                  value={ebookForm.title}
                  onChange={(e) => setEbookForm({ ...ebookForm, title: e.target.value })}
                  placeholder="Guide du Trading Crypto"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Description *</label>
                <textarea
                  value={ebookForm.description}
                  onChange={(e) => setEbookForm({ ...ebookForm, description: e.target.value })}
                  placeholder="Description de l'ebook..."
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
                />
              </div>

              {/* Category & Format */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Catégorie</label>
                  <select
                    value={ebookForm.category}
                    onChange={(e) => setEbookForm({ ...ebookForm, category: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Format</label>
                  <select
                    value={ebookForm.format}
                    onChange={(e) => setEbookForm({ ...ebookForm, format: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {FORMAT_OPTIONS.map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Size & Plan Required */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Taille</label>
                  <input
                    value={ebookForm.size}
                    onChange={(e) => setEbookForm({ ...ebookForm, size: e.target.value })}
                    placeholder="2.4 MB"
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Plan requis</label>
                  <select
                    value={ebookForm.plan_required}
                    onChange={(e) => setEbookForm({ ...ebookForm, plan_required: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                  >
                    {PLAN_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* File Path */}
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1.5">Chemin du fichier</label>
                <input
                  value={ebookForm.file_path}
                  onChange={(e) => setEbookForm({ ...ebookForm, file_path: e.target.value })}
                  placeholder="/ebooks/mon-guide.pdf"
                  className="w-full px-4 py-2.5 rounded-xl bg-[#0A0E1A] border border-white/[0.08] text-white text-sm placeholder:text-gray-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                />
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setEbookForm({ ...ebookForm, active: !ebookForm.active })}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    ebookForm.active ? "bg-emerald-500" : "bg-gray-600"
                  }`}
                >
                  <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                    ebookForm.active ? "translate-x-6" : "translate-x-0.5"
                  }`} />
                </button>
                <span className="text-sm font-medium text-gray-300">
                  {ebookForm.active ? "Actif" : "Inactif"}
                </span>
              </div>

              {/* Submit */}
              <button
                onClick={handleSaveEbook}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                {editingEbookId ? "Mettre à jour" : "Créer l'ebook"}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}