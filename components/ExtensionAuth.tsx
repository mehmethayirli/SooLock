// src/components/ExtensionAuth.tsx
import React, { useState } from "react";
import { TokenService } from "../lib/tokenService";
import { Key, ExternalLink, AlertCircle } from "lucide-react";

interface ExtensionAuthProps {
  onAuthSuccess: () => void;
}

export default function ExtensionAuth({ onAuthSuccess }: ExtensionAuthProps) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsValidating(true);

    try {
      const response = await fetch("http://localhost:3000/api/passwords", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Token doğrulanamadı");
      }

      // Token'ı chrome storage'a kaydet
      await chrome.storage.local.set({ auth_token: token });
      onAuthSuccess();
    } catch (err) {
      console.error("Token validation error:", err);
      setError(err instanceof Error ? err.message : "Token doğrulama hatası");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="min-h-[600px] w-[400px] bg-black flex flex-col items-center justify-center px-6">
      <div className="w-full space-y-8 bg-black/40 backdrop-blur-sm border border-[#c4ff9e] rounded-xl p-8">
        {/* Logo ve Başlık */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold text-[#c4ff9e]">Soolock</h1>
          <p className="text-[#c4ff9e]/70 text-lg max-w-sm mx-auto">
            Zero-knowledge şifre yöneticisi configured by Mersenne
          </p>
        </div>

        {/* Token Giriş Formu */}
        <form onSubmit={handleSubmit} className="mt-12 space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="token"
              className="block text-sm font-medium text-[#c4ff9e]"
            >
              Erişim Tokenı
            </label>
            <div className="relative">
              <input
                id="token"
                type="text"
                required
                className="w-full bg-black/50 border border-[#c4ff9e]/30 focus:border-[#c4ff9e] text-[#c4ff9e] rounded-lg px-4 py-3 focus:outline-none transition-colors"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="sl_..."
                disabled={isValidating}
              />
            </div>
          </div>

          {error && (
            <div className="flex items-center p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-red-500 text-sm">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isValidating}
            className="w-full bg-[#c4ff9e] text-black font-medium py-3 px-4 rounded-lg hover:bg-[#b3ff80] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isValidating ? "Doğrulanıyor..." : "Devam Et"}
          </button>
        </form>

        {/* Alt Bilgi */}
        <div className="mt-8 text-center">
          <p className="text-sm text-[#c4ff9e]/60 space-x-1">
            <span>Henüz token almadınız mı?</span>
            <a
              href="http://localhost:5173"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#c4ff9e] hover:underline inline-flex items-center"
            >
              Web uygulamasını ziyaret edin
              <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </p>
        </div>

        {/* Güvenlik Notu */}
        <div className="mt-6 p-4 bg-[#c4ff9e]/5 rounded-lg">
          <p className="text-xs text-[#c4ff9e]/50 text-center leading-relaxed">
            Soolock, verilerinizi güvenli bir şekilde saklar ve yönetir.
            Token'ınızı kimseyle paylaşmayın ve güvenli bir yerde saklayın.
          </p>
        </div>
      </div>
    </div>
  );
}
