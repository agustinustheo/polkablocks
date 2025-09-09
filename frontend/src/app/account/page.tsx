"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Eye,
  EyeOff,
  Calendar,
  Key,
  Mail,
  Database,
  Plus,
} from "lucide-react";

interface WalletData {
  id: number;
  email: string;
  mnemonic: string;
  public_key: string;
  created_at: string;
}

interface UserProfile {
  id: number;
  email: string;
  walletCount: number;
  lastLogin: string;
  createdAt: string;
}

export default function AccountPage() {
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState<{ [key: number]: boolean }>(
    {},
  );
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const storedToken = localStorage.getItem("polkablock_session_token");
    if (!storedToken) {
      router.push("/");
      return;
    }

    setSessionToken(storedToken);
    fetchUserData(storedToken);
  }, [router]);

  const fetchUserData = async (token: string) => {
    try {
      // Fetch user profile and wallets in parallel
      const [profileResponse, walletsResponse] = await Promise.all([
        fetch("http://localhost:3001/api/auth/profile", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
        fetch("http://localhost:3001/api/wallet/my-wallets", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }),
      ]);

      if (!profileResponse.ok || !walletsResponse.ok) {
        if (profileResponse.status === 401 || walletsResponse.status === 401) {
          // Token expired, redirect to login
          localStorage.removeItem("polkablock_session_token");
          localStorage.removeItem("polkablock_user_email");
          router.push("/");
          return;
        }
        throw new Error("Failed to fetch user data");
      }

      const profileData = await profileResponse.json();
      const walletsData = await walletsResponse.json();

      if (profileData.success) {
        setProfile(profileData.data);
      }

      if (walletsData.success) {
        setWallets(walletsData.data || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const generateNewWallet = async () => {
    if (!sessionToken) return;

    setGenerating(true);
    setError("");

    try {
      const response = await fetch(
        "http://localhost:3001/api/wallet/generate",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${sessionToken}`,
            "Content-Type": "application/json",
          },
        },
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Failed to generate wallet");
      }

      // Add new wallet to the list
      setWallets((prev) => [data.data, ...prev]);

      // Update profile wallet count
      if (profile) {
        setProfile((prev) =>
          prev ? { ...prev, walletCount: prev.walletCount + 1 } : null,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to generate wallet",
      );
    } finally {
      setGenerating(false);
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
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 mb-8 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Account Dashboard
              </h1>
              {profile && (
                <div className="flex items-center space-x-4 text-gray-600">
                  <div className="flex items-center space-x-2">
                    <Mail size={16} />
                    <span>{profile.email}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar size={16} />
                    <span>Joined {formatDate(profile.createdAt)}</span>
                  </div>
                </div>
              )}
            </div>
            <div className="text-right">
              <div className="text-gray-900 text-2xl font-bold">
                {wallets.length}
              </div>
              <div className="text-gray-600 text-sm">
                {wallets.length === 1 ? "Wallet" : "Wallets"} Generated
              </div>
            </div>
          </div>

          {/* Generate New Wallet Button */}
          <div className="mt-6">
            <button
              onClick={generateNewWallet}
              disabled={generating}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              {generating ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Generating Wallet...</span>
                </>
              ) : (
                <>
                  <Plus size={20} />
                  <span>Generate New Wallet</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Wallets List */}
        {wallets.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-sm border">
            <Database className="mx-auto h-16 w-16 text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No Wallets Found
            </h2>
            <p className="text-gray-600 mb-6">
              You haven't generated any wallets yet. Create your first wallet to
              get started.
            </p>
            <button
              onClick={generateNewWallet}
              disabled={generating}
              className="bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate First Wallet"}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {wallets.map((wallet) => (
              <div
                key={wallet.id}
                className="bg-white rounded-2xl p-6 sm:p-8 border shadow-sm"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gray-900 rounded-xl flex items-center justify-center">
                      <Key className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        Wallet #{wallet.id}
                      </h3>
                      <div className="flex items-center space-x-2 text-gray-600 text-sm">
                        <Calendar size={14} />
                        <span>{formatDate(wallet.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Public Key */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Public Key
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4 relative border">
                      <p className="text-gray-900 font-mono text-sm break-all pr-10">
                        {wallet.public_key}
                      </p>
                      <button
                        onClick={() => copyToClipboard(wallet.public_key)}
                        className="absolute top-3 right-3 bg-gray-900 hover:bg-gray-800 text-white p-1.5 rounded transition duration-200"
                        title="Copy to clipboard"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Mnemonic Phrase */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-gray-700 text-sm font-medium">
                        Mnemonic Phrase (Seed Words)
                      </label>
                      <button
                        onClick={() => toggleMnemonicVisibility(wallet.id)}
                        className="flex items-center space-x-1 text-gray-600 hover:text-gray-800 transition-colors"
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
                    <div className="bg-gray-50 rounded-lg p-4 relative border">
                      {showMnemonic[wallet.id] ? (
                        <>
                          <p className="text-gray-900 font-mono text-sm leading-relaxed">
                            {wallet.mnemonic}
                          </p>
                          <button
                            onClick={() => copyToClipboard(wallet.mnemonic)}
                            className="absolute top-3 right-3 bg-gray-900 hover:bg-gray-800 text-white p-1.5 rounded transition duration-200"
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
                    <p className="text-yellow-600 text-xs mt-2">
                      ⚠️ Keep this mnemonic phrase safe and secure. Anyone with
                      access to it can control your wallet.
                    </p>
                  </div>

                  {/* JSON Export */}
                  <div>
                    <label className="block text-gray-700 text-sm font-medium mb-2">
                      Wallet Data (JSON)
                    </label>
                    <div className="bg-gray-50 rounded-lg p-4 relative border">
                      <pre className="text-gray-900 text-xs overflow-x-auto">
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
                        className="absolute top-3 right-3 bg-gray-900 hover:bg-gray-800 text-white p-1.5 rounded transition duration-200"
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
      </div>
    </div>
  );
}
