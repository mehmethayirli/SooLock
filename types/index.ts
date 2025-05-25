export interface Password {
  id: string;
  title: string;
  username: string;
  password: string;
  website: string;
  lastModified: string;
}

export interface PasswordVaultState {
  isInitialized: boolean;
  passwords: Password[];
  error: string | null;
  masterKey: string | null;
  walletAddress: string | null;
  unlockVault: (
    masterPassword: string,
    publicKey: string,
    isInitialSetup: boolean
  ) => Promise<void>;
  addPassword: (
    title: string,
    username: string,
    password: string,
    website: string
  ) => Promise<void>;
  searchPasswords: (query: string) => Promise<void>;
  logout: () => void;
}
