// src/App.tsx
import { useState, useEffect } from "react";
import Layout from "./components/Layout";
import TokenScreen from "./components/TokenScreen";
import ExtensionAuth from "./components/ExtensionAuth";
import PasswordCard from "./components/PasswordCard";
import UnlockScreen from "./components/UnlockScreen";
import AddPasswordModal from "./components/AddPasswordModal";
import PasswordGenerator from "./components/PasswordGenerator";
import Settings from "./components/Settings";
import { Plus, Search } from "lucide-react";
import { usePasswordVault } from "./hooks/usePasswordVault";

const isExtension = !!(window.chrome && chrome.runtime && chrome.runtime.id);

function App() {
  const {
    isInitialized,
    passwords,
    error,
    unlockVault,
    addPassword,
    searchPasswords,
    logout,
    walletAddress,
    loadPasswords,
  } = usePasswordVault();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState("passwords");
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    if (isExtension) {
      chrome.storage.local.get(["auth_token"], async (result) => {
        const hasToken = !!result.auth_token;
        setIsAuthenticated(hasToken);

        if (hasToken) {
          try {
            await loadPasswords();
          } catch (error) {
            console.error("Failed to load passwords:", error);
          }
        }
      });
    }
  }, [loadPasswords]);

  const handleLogout = () => {
    logout();
    if (isExtension) {
      setIsAuthenticated(false);
    }
  };

  if (isExtension && !isAuthenticated) {
    return (
      <ExtensionAuth
        onAuthSuccess={async () => {
          setIsAuthenticated(true);
          await loadPasswords();
        }}
      />
    );
  }

  if (!isInitialized && !isExtension) {
    return <UnlockScreen onUnlock={unlockVault} error={error} />;
  }

  const renderContent = () => {
    if (!isExtension && currentView === "token") {
      return <TokenScreen walletAddress={walletAddress || ""} />;
    }

    switch (currentView) {
      case "generator":
        return (
          <div className={isExtension ? "w-[320px]" : ""}>
            <PasswordGenerator />
          </div>
        );
      case "settings":
        return (
          <div className={isExtension ? "w-[320px]" : ""}>
            <Settings
              walletAddress={walletAddress || ""}
              onLogout={handleLogout}
            />
          </div>
        );
      default:
        if (isExtension) {
          return (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-[#c4ff9e]">
                  Password Vault
                </h1>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-[#c4ff9e]" />
                </div>
                <input
                  type="text"
                  className="input-primary pl-10 w-full"
                  placeholder="Search passwords..."
                  onChange={(e) => searchPasswords(e.target.value)}
                />
              </div>

              <div className="space-y-4 w-[320px]">
                {passwords.map((pass) => (
                  <PasswordCard key={pass.id} {...pass} />
                ))}
              </div>
            </>
          );
        } else {
          return (
            <>
              <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-[#c4ff9e]">
                  Password Vault
                </h1>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="btn-primary"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Password
                </button>
              </div>

              <div className="relative mb-6">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-[#c4ff9e]" />
                </div>
                <input
                  type="text"
                  className="input-primary pl-10"
                  placeholder="Search passwords..."
                  onChange={(e) => searchPasswords(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {passwords.map((pass) => (
                  <PasswordCard key={pass.id} {...pass} />
                ))}
              </div>

              <AddPasswordModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onAdd={addPassword}
              />
            </>
          );
        }
    }
  };

  return (
    <Layout
      walletAddress={walletAddress || ""}
      onLogout={handleLogout}
      onNavigate={setCurrentView}
      currentView={currentView}
    >
      <div
        className={isExtension ? "max-w-[320px] mx-auto" : "max-w-6xl mx-auto"}
      >
        {renderContent()}
      </div>
    </Layout>
  );
}

export default App;
