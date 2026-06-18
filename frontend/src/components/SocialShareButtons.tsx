// Social Share buttons — let blog readers share without requiring author exposure
import { useState } from "react";
import { Twitter, Linkedin, Link2, Check, MessageCircle } from "lucide-react";
import { trackEvent } from "@/lib/analytics";

type Props = {
  url: string;
  title: string;
  slug?: string;
};

export default function SocialShareButtons({ url, title, slug }: Props) {
  const [copied, setCopied] = useState(false);

  const tweetText = `${title}\n\n👉 ${url}\n\nvia @CryptoIA_ca`;
  const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;
  const redditUrl = `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`;

  const share = (platform: string, href: string) => {
    trackEvent("blog_share_clicked", { platform, slug: slug || url });
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=600");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      trackEvent("blog_share_clicked", { platform: "copy", slug: slug || url });
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div
      data-testid="social-share-buttons"
      className="flex items-center gap-2 flex-wrap not-prose"
    >
      <span className="text-[11px] uppercase tracking-widest font-bold text-gray-500 mr-1">
        Partager
      </span>
      <button
        type="button"
        onClick={() => share("twitter", tweetUrl)}
        data-testid="share-twitter"
        aria-label="Share on X / Twitter"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-gray-200 hover:bg-white/[0.1] hover:border-white/20 transition-colors"
      >
        <Twitter className="w-3.5 h-3.5" /> X
      </button>
      <button
        type="button"
        onClick={() => share("linkedin", linkedinUrl)}
        data-testid="share-linkedin"
        aria-label="Share on LinkedIn"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-gray-200 hover:bg-white/[0.1] hover:border-white/20 transition-colors"
      >
        <Linkedin className="w-3.5 h-3.5" /> LinkedIn
      </button>
      <button
        type="button"
        onClick={() => share("reddit", redditUrl)}
        data-testid="share-reddit"
        aria-label="Share on Reddit"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-gray-200 hover:bg-white/[0.1] hover:border-white/20 transition-colors"
      >
        <MessageCircle className="w-3.5 h-3.5" /> Reddit
      </button>
      <button
        type="button"
        onClick={copyLink}
        data-testid="share-copy"
        aria-label="Copy link"
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/[0.05] border border-white/10 text-xs font-bold text-gray-200 hover:bg-white/[0.1] hover:border-white/20 transition-colors"
      >
        {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copié</> : <><Link2 className="w-3.5 h-3.5" /> Lien</>}
      </button>
    </div>
  );
}
