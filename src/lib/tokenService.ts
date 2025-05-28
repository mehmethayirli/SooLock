import CryptoJS from "crypto-js";

const API_URL = "http://localhost:3000/api";

export class TokenService {
  private static readonly TOKEN_PREFIX = "sl_";
  private static readonly TOKEN_EXPIRY = 30 * 24 * 60 * 60 * 1000; // 30 gün
  private static readonly TOKEN_PATTERN = /^sl_[A-Za-z0-9+/=]+\.[a-f0-9]{64}$/;

  static generateToken(walletAddress: string): string {
    const timestamp = Date.now();
    const randomPart = CryptoJS.lib.WordArray.random(16).toString();
    const data = `${walletAddress}:${timestamp}:${randomPart}`;
    const hash = CryptoJS.SHA256(data).toString();
    const token = `${this.TOKEN_PREFIX}${Buffer.from(data).toString(
      "base64"
    )}.${hash}`;

    // Tokeni API'ye kaydet
    fetch(`${API_URL}/tokens`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        token,
        walletAddress,
      }),
    }).catch((error) => {
      console.error("Failed to save token:", error);
    });

    // Local storage'a da kaydet
    localStorage.setItem("auth_token", token);

    return token;
  }

  static async validateToken(token: string): Promise<boolean> {
    try {
      // Format kontrolü
      if (!this.TOKEN_PATTERN.test(token)) {
        console.log("Invalid token format");
        return false;
      }

      // API üzerinden doğrula
      const response = await fetch(`${API_URL}/passwords`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      return response.ok;
    } catch (error) {
      console.error("Token validation error:", error);
      return false;
    }
  }

  static getWalletFromToken(token: string): string | null {
    try {
      if (!this.TOKEN_PATTERN.test(token)) {
        return null;
      }

      const [data] = token.slice(this.TOKEN_PREFIX.length).split(".");
      const decodedData = Buffer.from(data, "base64").toString();
      const [walletAddress] = decodedData.split(":");
      return walletAddress;
    } catch {
      return null;
    }
  }
}
