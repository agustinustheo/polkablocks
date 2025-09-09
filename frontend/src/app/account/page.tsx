"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Copy, Eye, EyeOff, Calendar, Key, Mail, Database } from "lucide-react";

interface WalletData {
  id: number;
  email: string;
  mnemonic: string;
  public_key: string;
  created_at: string;
}

export default function AccountPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState<{ [key: number]: boolean }>(
    {},
  );
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const storedEmail = localStorage.getItem("polkablock_user_email");
    if (!storedEmail) {
      router.push("/");
      return;
    }

    setUserEmail(storedEmail);
    fetchWallets(storedEmail);
  }, [router]);

  const fetchWallets = async (email: string) => {
    try {
      const response = await fetch(
        `http://localhost:3001/api/wallet/${encodeURIComponent(email)}`,
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to fetch wallets");
      }

      setWallets(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // You could add a toast notification here
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const toggleMnemonicVisibility = (walletId: number) => {
    setShowMnemonic((prev) => ({
      ...prev,
      [walletId]: !prev[walletId],
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Account Dashboard
              </h1>
              <div className="flex items-center space-x-2 text-blue-200">
                <Mail size={16} />
                <span>{userEmail}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white text-2xl font-bold">
                {wallets.length}
              </div>
              <div className="text-blue-200 text-sm">
                {wallets.length === 1 ? "Wallet" : "Wallets"} Generated
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 mb-8">
            <p className="text-red-200">{error}</p>
          </div>
        )}

        {wallets.length === 0 ? (
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-12 text-center">
            <Database className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">
              No Wallets Found
            </h2>
            <p className="text-gray-300 mb-6">
              You haven&apos;t generated any wallets yet. Create your first
              wallet to get started.
            </p>
            <button
              onClick={() => router.push("/")}
              className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
            >
              Generate First Wallet
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 sm:p-8 border border-white/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl flex items-center justify-center">
                      <Key className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white">
                        Wallet #{wallet.id}
                      </h3>
                      <div className="flex items-center space-x-2 text-blue-200 text-sm">
                        <Calendar size={14} />
                        <span>{formatDate(wallet.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Public Key */}
                  <div>
                    <label className="block text-blue-200 text-sm font-medium mb-2">
                      Public Key
                    </label>
                    <div className="bg-black/30 rounded-lg p-4 relative">
                      <p className="text-white font-mono text-sm break-all pr-10">
                        {wallet.public_key}
                      </p>
                      <button
                        onClick={() => copyToClipboard(wallet.public_key)}
                        className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded transition duration-200"
                        title="Copy to clipboard"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Mnemonic Phrase */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-blue-200 text-sm font-medium">
                        Mnemonic Phrase (Seed Words)
                      </label>
                      <button
                        onClick={() => toggleMnemonicVisibility(wallet.id)}
                        className="flex items-center space-x-1 text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        {showMnemonic[wallet.id] ? (
                          <>
                            <EyeOff size={14} />
                            <span className="text-xs">Hide</span>
                          </>
                        ) : (
                          <>
                            <Eye size={14} />
                            <span className="text-xs">Show</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="bg-black/30 rounded-lg p-4 relative">
                      {showMnemonic[wallet.id] ? (
                        <>
                          <p className="text-white font-mono text-sm leading-relaxed">
                            {wallet.mnemonic}
                          </p>
                          <button
                            onClick={() => copyToClipboard(wallet.mnemonic)}
                            className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded transition duration-200"
                            title="Copy to clipboard"
                          >
                            <Copy size={14} />
                          </button>
                        </>
                      ) : (
                        <p className="text-gray-400 text-sm">
                          •••••••••••• •••••••••••• •••••••••••• ••••••••••••
                        </p>
                      )}
                    </div>
                    <p className="text-yellow-300 text-xs mt-2">
                      ⚠️ Keep this mnemonic phrase safe and secure. Anyone with
                      access to it can control your wallet.
                    </p>
                  </div>

                  {/* JSON Export */}
                  <div>
                    <label className="block text-blue-200 text-sm font-medium mb-2">
                      Wallet Data (JSON)
                    </label>
                    <div className="bg-black/30 rounded-lg p-4 relative">
                      <pre className="text-white text-xs overflow-x-auto">
                        {JSON.stringify(
                          {
                            id: wallet.id,
                            email: wallet.email,
                            mnemonic: showMnemonic[wallet.id]
                              ? wallet.mnemonic
                              : "[HIDDEN]",
                            publicKey: wallet.public_key,
                            createdAt: wallet.created_at,
                          },
                          null,
                          2,
                        )}
                      </pre>
                      <button
                        onClick={() =>
                          copyToClipboard(
                            JSON.stringify(
                              {
                                id: wallet.id,
                                email: wallet.email,
                                mnemonic: wallet.mnemonic,
                                publicKey: wallet.public_key,
                                createdAt: wallet.created_at,
                              },
                              null,
                              2,
                            ),
                          )
                        }
                        className="absolute top-3 right-3 bg-blue-500 hover:bg-blue-600 text-white p-1.5 rounded transition duration-200"
                        title="Copy JSON to clipboard"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition duration-200"
          >
            Generate New Wallet
          </button>
        </div>
      </div>
    </div>
  );
}
