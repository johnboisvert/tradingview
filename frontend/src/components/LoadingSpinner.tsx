import { Loader2 } from "lucide-react";

export default function LoadingSpinner() {
  return (
    <div className="min-h-screen bg-[#030712] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-indigo-500/20 animate-pulse" />
          <Loader2 className="w-8 h-8 text-indigo-400 animate-spin absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        </div>
        <p className="text-sm text-gray-400 font-medium animate-pulse">Chargement…</p>
      </div>
    </div>
  );
}