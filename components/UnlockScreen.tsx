import React, { useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { SolanaService } from '../lib/solana';

interface UnlockScreenProps {
  onUnlock: (masterPassword: string, publicKey: string, isInitialSetup: boolean) => Promise<void>;
  error: string | null;
}

export default function UnlockScreen({ onUnlock, error }: UnlockScreenProps) {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const isInitialSetup = !localStorage.getItem('vault_initialized');

  React.useEffect(() => {
    const checkBalance = async () => {
      if (publicKey) {
        try {
          const balance = await SolanaService.getBalance(publicKey);
          setBalance(balance);
        } catch (error) {
          console.error('Failed to get balance:', error);
          setBalance(0);
        }
      }
    };

    if (connected && publicKey) {
      checkBalance();
      const interval = setInterval(checkBalance, 2000);
      return () => clearInterval(interval);
    }
  }, [publicKey, connected]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey) {
      alert('Please connect your wallet first');
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (isInitialSetup && password !== confirmPassword) {
        throw new Error('Passwords do not match');
      }

      // Validate wallet before proceeding
      const isValid = await SolanaService.validateWallet(publicKey);
      if (!isValid) {
        throw new Error('Insufficient balance. You need at least 0.01 SOL.');
      }

      await onUnlock(password, publicKey.toString(), isInitialSetup);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to unlock vault. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="max-w-md w-full space-y-8 p-8 bg-black border border-[#c4ff9e] rounded-lg">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-[#c4ff9e] mb-2">Soolock</h1>
          <p className="text-[#c4ff9e]/70">
            {isInitialSetup ? 'Create your vault' : 'Welcome back'}
          </p>
        </div>

        <div className="flex justify-center">
          <WalletMultiButton />
        </div>

        {connected && (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-[#c4ff9e]">
                Master Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="input-primary mt-1"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter master password"
              />
            </div>

            {isInitialSetup && (
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#c4ff9e]">
                  Confirm Master Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  required
                  className="input-primary mt-1"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm master password"
                />
              </div>
            )}

            {error && (
              <p className="text-red-500 text-sm">{error}</p>
            )}

            {balance !== null && (
              <p className="text-[#c4ff9e]/70 text-sm">
                Balance: {balance.toFixed(4)} SOL
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading || !connected}
              className="btn-primary w-full"
            >
              {isLoading ? 'Processing...' : isInitialSetup ? 'Create Vault' : 'Unlock Vault'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}