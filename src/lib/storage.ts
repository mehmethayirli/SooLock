// src/lib/storage.ts
import { openDB, IDBPDatabase } from "idb";

export interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  website: string;
  lastModified: string;
  walletAddress: string;
}

const isExtension = !!(window.chrome && chrome.runtime && chrome.runtime.id);
const API_URL = "http://localhost:3000/api";

export class StorageManager {
  private db: IDBPDatabase | null = null;
  private static readonly DB_NAME = "soolockDB";
  private static readonly DB_VERSION = 1;

  async initialize(): Promise<void> {
    if (!isExtension) {
      this.db = await openDB(
        StorageManager.DB_NAME,
        StorageManager.DB_VERSION,
        {
          upgrade(db) {
            if (!db.objectStoreNames.contains("passwords")) {
              db.createObjectStore("passwords", { keyPath: "id" });
            }
          },
        }
      );
    }
  }

  private async getAuthToken(): Promise<string | null> {
    if (isExtension) {
      return new Promise((resolve) => {
        chrome.storage.local.get(["auth_token"], (result) => {
          resolve(result.auth_token || null);
        });
      });
    } else {
      return localStorage.getItem("auth_token");
    }
  }

  private getCurrentWallet(): string | null {
    return sessionStorage.getItem("wallet_public_key");
  }

  async getAllPasswords(): Promise<PasswordEntry[]> {
    const token = await this.getAuthToken();
    console.log("Extension token:", token); // Debug için

    if (!token) return [];

    if (isExtension) {
      try {
        console.log("Fetching passwords from API for extension..."); // Debug için
        const response = await fetch(`${API_URL}/passwords`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("API Response status:", response.status); // Debug için

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API Error:", errorText); // Debug için
          throw new Error("Failed to fetch passwords");
        }

        const result = await response.json();
        console.log("Received passwords:", result); // Debug için
        return result.data || [];
      } catch (error) {
        console.error("Failed to fetch passwords:", error);
        return [];
      }
    } else {
      if (!this.db) throw new Error("Database not initialized");
      const currentWallet = this.getCurrentWallet();
      if (!currentWallet) return [];

      const allPasswords = await this.db.getAll("passwords");
      return allPasswords.filter(
        (pass) => pass.walletAddress === currentWallet
      );
    }
  }

  async addPassword(entry: PasswordEntry): Promise<void> {
    if (!isExtension) {
      if (!this.db) throw new Error("Database not initialized");

      const walletAddress = this.getCurrentWallet();
      if (!walletAddress) throw new Error("No wallet connected");

      const passwordWithWallet = {
        ...entry,
        walletAddress,
      };

      await this.db.put("passwords", passwordWithWallet);

      const token = await this.getAuthToken();
      if (token) {
        try {
          const response = await fetch(`${API_URL}/passwords`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify(passwordWithWallet),
          });

          if (!response.ok) {
            throw new Error("Failed to sync with API");
          }
        } catch (error) {
          console.error("Failed to sync password:", error);
          throw error;
        }
      }
    } else {
      const token = await this.getAuthToken();
      if (!token) throw new Error("No auth token found");

      const response = await fetch(`${API_URL}/passwords`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error("Failed to save password");
      }
    }
  }

  async searchPasswords(query: string): Promise<PasswordEntry[]> {
    const passwords = await this.getAllPasswords();
    return passwords.filter(
      (entry) =>
        entry.title.toLowerCase().includes(query.toLowerCase()) ||
        entry.username.toLowerCase().includes(query.toLowerCase()) ||
        entry.website.toLowerCase().includes(query.toLowerCase())
    );
  }
}
