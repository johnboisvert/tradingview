import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Home, ArrowLeft } from "lucide-react";
import Footer from "@/components/Footer";

export default function NotFound() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-[#0A0E1A] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="text-8xl font-black bg-gradient-to-r from-indigo-500 to-purple-500 bg-clip-text text-transparent mb-4">
          404
        </div>
        <h1 className="text-xl font-bold text-white mb-2">{t("pages.notFound.title")}</h1>
        <p className="text-sm text-gray-400 mb-8">
          {t("pages.notFound.desc")}
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-bold hover:shadow-lg hover:shadow-indigo-500/20 transition-all"
            data-testid="notfound-dashboard"
          >
            <Home className="w-4 h-4" />
            {t("pages.notFound.dashboard")}
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] text-gray-300 text-sm font-bold hover:bg-white/[0.1] transition-all"
            data-testid="notfound-back"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("pages.notFound.back")}
          </button>
        </div>
      </div>
    <Footer />
    </div>
  );
}
