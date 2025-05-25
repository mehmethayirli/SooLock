// src/components/TokenScreen.tsx
import React, { useState, useEffect } from "react";
import { Copy } from "lucide-react";
import { TokenService } from "../lib/tokenService";

interface TokenScreenProps {
  walletAddress: string;
}

export default function TokenScreen({ walletAddress }: TokenScreenProps) {
  const [token, setToken] = useState("");
  const [copied, setCopied] = useState(false);

  const generateNewToken = () => {
    console.log("Generating new token for wallet:", walletAddress); // Debug log
    const newToken = TokenService.generateToken(walletAddress);
    console.log("Generated token:", newToken); // Debug log

    // API'ye token'ı kaydet
    fetch("http://localhost:3000/api/tokens", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token: newToken,
        walletAddress,
      }),
    })
      .then((response) => {
        if (!response.ok) {
          console.error("Failed to save token to API");
        } else {
          console.log("Token saved to API successfully");
        }
      })
      .catch((error) => {
        console.error("Token save error:", error);
      });

    setToken(newToken);
    // Local storage'a kaydet
    localStorage.setItem("auth_token", newToken);
  };

  const copyToken = async () => {
    try {
      await navigator.clipboard.writeText(token);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Token kopyalama hatası:", err);
    }
  };

  useEffect(() => {
    // Log current stored token
    console.log(
      "Current token in localStorage:",
      localStorage.getItem("auth_token")
    );
  }, [token]);

  return (
    <div>
      <p className="text-[#c4ff9e]/70 mb-6">
        Extension'ı kullanabilmek için bir erişim tokenı oluşturmanız
        gerekmektedir. Bu token ile extension'a giriş yapabilirsiniz.
      </p>

      {token ? (
        <div className="mb-6">
          <div className="flex items-center">
            <input
              type="text"
              readOnly
              value={token}
              className="input-primary flex-1 mr-2"
            />
            <button
              onClick={copyToken}
              className="btn-primary px-3"
              title="Kopyala"
            >
              <Copy className="h-5 w-5" />
            </button>
          </div>
          {copied && (
            <p className="text-[#c4ff9e]/70 text-sm mt-2">Token kopyalandı!</p>
          )}
        </div>
      ) : (
        <button onClick={generateNewToken} className="btn-primary w-full mb-6">
          Token Oluştur
        </button>
      )}

      <div className="text-[#c4ff9e]/60 text-sm space-y-2">
        <p>📝 Önemli Notlar:</p>
        <ul className="list-disc list-inside space-y-1">
          <li>Token 30 gün boyunca geçerlidir</li>
          <li>Tokenı güvenli bir şekilde saklayınız</li>
          <li>İstediğiniz zaman yeni token oluşturabilirsiniz</li>
          <li>Yeni token oluşturduğunuzda eski token geçersiz olur</li>
        </ul>
      </div>
    </div>
  );
}
