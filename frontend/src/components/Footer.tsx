import { useTranslation } from "react-i18next";

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-white/[0.06] bg-[#0a0a0f]/80 backdrop-blur-sm">
      <div className="px-6 py-8">
        {/* AI Powered Banner */}
        <div className="mb-6 flex items-center gap-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-3">
          <span className="text-lg">🤖</span>
          <p className="text-xs text-indigo-300 leading-relaxed">
            <span className="font-bold text-indigo-200">{t("footer.aiPoweredTitle")}</span>{" "}
            {t("footer.aiPoweredBody")}
          </p>
        </div>

        {/* Legal Disclaimer */}
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-6 mb-6">
          <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-4 flex items-center gap-2">
            <span className="inline-block w-4 h-[2px] bg-indigo-400 rounded-full" />
            {t("footer.legalTitle")}
            <span className="inline-block w-4 h-[2px] bg-indigo-400 rounded-full" />
          </h3>

          <div className="space-y-4 text-[11px] leading-relaxed text-gray-500">
            <p>
              <span className="text-gray-400 font-semibold">{t("footer.privacyLabel")}</span>{" "}
              {t("footer.privacyBody")}
            </p>
            <p>
              <span className="text-gray-400 font-semibold">{t("footer.noOfferLabel")}</span>{" "}
              {t("footer.noOfferBody")}
            </p>
            <p>
              <span className="text-gray-400 font-semibold">{t("footer.noAdviceLabel")}</span>{" "}
              {t("footer.noAdviceBody")}
            </p>
            <p>
              <span className="text-gray-400 font-semibold">{t("footer.testimonialsLabel")}</span>{" "}
              {t("footer.testimonialsBody")}
            </p>
            <p>
              <span className="text-gray-400 font-semibold">{t("footer.riskLabel")}</span>{" "}
              {t("footer.riskBody")}
            </p>
            <p>
              <span className="text-gray-400 font-semibold">{t("footer.acceptanceLabel")}</span>{" "}
              {t("footer.acceptanceBody")}
            </p>
          </div>
        </div>

        {/* Copyright + Affiliation link */}
        <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/[0.04] flex-wrap">
          <p className="text-xs text-gray-600 font-medium tracking-wide">
            {t("footer.copyright", { year })}
          </p>
          <a
            href="/affiliation"
            data-testid="footer-affiliation-link"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300/80 hover:text-emerald-200 transition-colors group"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {t("footer.affiliationCta")}
            <span className="opacity-60 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all">→</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
