// src/hooks/usePasswordVault.ts
import { useState, useEffect } from "react";
import { StorageManager, PasswordEntry } from "../lib/storage";

const isExtension = !!(window.chrome && chrome.runtime && chrome.runtime.id);

export function usePasswordVault() {
  const [storageManager] = useState(() => new StorageManager());
  const [isInitialized, setIsInitialized] = useState(false);
  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);

  useEffect(() => {
    const initializeStorage = async () => {
      try {
        await storageManager.initialize();
        const publicKey = sessionStorage.getItem("wallet_public_key");
        if (
          publicKey &&
          localStorage.getItem(`vault_initialized_${publicKey}`)
        ) {
          setIsInitialized(true);
          setWalletAddress(publicKey);
          await loadPasswords();
        }
      } catch (err) {
        console.error("Failed to initialize storage:", err);
        setError("Failed to initialize storage");
      }
    };

    initializeStorage();
  }, []);

  const loadPasswords = async () => {
    try {
      const allPasswords = await storageManager.getAllPasswords();
      setPasswords(allPasswords);
    } catch (err) {
      console.error("Failed to load passwords:", err);
      setError("Failed to load passwords");
    }
  };

  const unlockVault = async (
    masterPassword: string,
    publicKey: string,
    isInitialSetup: boolean
  ) => {
    try {
      if (isInitialSetup) {
        localStorage.setItem(`vault_initialized_${publicKey}`, "true");
      }

      sessionStorage.setItem("wallet_public_key", publicKey);
      localStorage.setItem("auth_token", masterPassword);

      setIsInitialized(true);
      setWalletAddress(publicKey);

      // API'ye token'ı kaydet
      try {
        const response = await fetch("http://localhost:3000/api/tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            token: masterPassword,
            walletAddress: publicKey,
          }),
        });

        if (!response.ok) {
          console.error("Failed to save token to API:", await response.text());
        }
      } catch (err) {
        console.error("Token save error:", err);
      }

      await loadPasswords();
    } catch (err) {
      setError(
        isInitialSetup ? "Failed to create vault" : "Invalid master password"
      );
      throw err;
    }
  };

  const addPassword = async (
    title: string,
    username: string,
    password: string,
    website: string
  ) => {
    try {
      const currentWallet = sessionStorage.getItem("wallet_public_key");
      if (!currentWallet) throw new Error("No wallet connected");

      const newPassword: PasswordEntry = {
        id: crypto.randomUUID(),
        title,
        username,
        password,
        website,
        lastModified: new Date().toISOString(),
        walletAddress: currentWallet,
      };

      await storageManager.addPassword(newPassword);
      await loadPasswords();
    } catch (err) {
      console.error("Failed to add password:", err);
      setError("Failed to add password");
      throw err;
    }
  };

  const searchPasswords = async (query: string) => {
    try {
      const results = await storageManager.searchPasswords(query);
      setPasswords(results);
    } catch (err) {
      console.error("Failed to search passwords:", err);
      setError("Failed to search passwords");
      throw err;
    }
  };

  const logout = () => {
    const clearData = () => {
      setIsInitialized(false);
      setWalletAddress(null);
      setPasswords([]);
      sessionStorage.removeItem("wallet_public_key");
      localStorage.removeItem("auth_token");
    };

    if (isExtension) {
      chrome.storage.local.clear(() => {
        clearData();
      });
    } else {
      clearData();
    }
  };

  return {
    isInitialized,
    passwords,
    error,
    unlockVault,
    addPassword,
    searchPasswords,
    logout,
    walletAddress,
    loadPasswords,
  };
}
