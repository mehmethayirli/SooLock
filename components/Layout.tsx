// src/components/Layout.tsx
import React from "react";
import { Shield, Settings, Key, List } from "lucide-react";
import Sidebar from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  walletAddress?: string;
  onLogout: () => void;
  onNavigate: (view: string) => void;
  currentView: string;
}

const isExtension = !!(window.chrome && chrome.runtime && chrome.runtime.id);

export default function Layout({
  children,
  walletAddress,
  onLogout,
  onNavigate,
  currentView,
}: LayoutProps) {
  const menuItems = [
    { icon: Shield, label: "Passwords", href: "passwords" },
    { icon: Key, label: "Generator", href: "generator" },
    { icon: List, label: "Categories", href: "categories" },
    { icon: Settings, label: "Settings", href: "settings" },
  ];

  return (
    // Ana container
    <div className="flex h-screen bg-black">
      {/* Sol sidebar */}
      <Sidebar
        menuItems={menuItems}
        walletAddress={walletAddress}
        onLogout={onLogout}
        onNavigate={onNavigate}
        currentView={currentView}
      />

      {/* Ana içerik alanı */}
      <main className="flex-1 overflow-y-auto bg-black">
        {}
        <div
          className={isExtension ? "px-4 py-6" : "container mx-auto px-6 py-8"}
        >
          {children}
        </div>
      </main>
    </div>
  );
}
