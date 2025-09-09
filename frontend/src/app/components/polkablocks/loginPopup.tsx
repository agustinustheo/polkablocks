"use client";

import { useState } from "react";
import {
  X,
  Mail,
  Lock,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";

interface AuthPopupProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (email: string, sessionToken: string) => void;
}

interface AuthResponse {
  success: boolean;
  data: {
    id: number;
    email: string;
    sessionToken: string;
    createdAt?: string;
    lastLogin?: string;
  };
  message: string;
  error?: string;
  details?: string[];
}

type AuthMode = "login" | "register";

export default function AuthPopup({
  isOpen,
  onClose,
  onAuthSuccess,
}: AuthPopupProps) {
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [passwordStrength, setPasswordStrength] = useState<string>("");

  if (!isOpen) return null;

  const resetState = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError("");
    setPasswordStrength("");
    setShowPassword(false);
  };

  const handleModeSwitch = (newMode: AuthMode) => {
    setMode(newMode);
    resetState();
  };

  const calculatePasswordStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 8) score += 20;
    if (/[a-z]/.test(pwd)) score += 20;
    if (/[A-Z]/.test(pwd)) score += 20;
    if (/\d/.test(pwd)) score += 20;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) score += 20;

    if (score < 40) return "weak";
    if (score < 80) return "medium";
    return "strong";
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (mode === "register" && value) {
      setPasswordStrength(calculatePasswordStrength(value));
    }
  };

  const validateForm = () => {
    if (!email || !password) {
      setError("Email and password are required");
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address");
      return false;
    }

    if (mode === "register") {
      if (password.length < 8) {
        setError("Password must be at least 8 characters long");
        return false;
      }

      if (password !== confirmPassword) {
        setError("Passwords do not match");
        return false;
      }

      if (passwordStrength === "weak") {
        setError("Please choose a stronger password");
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    setError("");

    try {
      const endpoint =
        mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const requestBody =
        mode === "login" ? { email, password } : { email, password };

      const response = await fetch(`http://localhost:3001${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || data.message || `${mode} failed`);
      }

      // Success
      onAuthSuccess(data.data.email, data.data.sessionToken);
      onClose();
      resetState();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(`An error occurred during ${mode}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case "weak":
        return "text-red-500";
      case "medium":
        return "text-yellow-500";
      case "strong":
        return "text-green-500";
      default:
        return "text-gray-400";
    }
  };

  const getPasswordStrengthWidth = () => {
    switch (passwordStrength) {
      case "weak":
        return "w-1/3";
      case "medium":
        return "w-2/3";
      case "strong":
        return "w-full";
      default:
        return "w-0";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 relative bg-gradient-to-r from-[#FF2670] to-[#FF2670]/80">
          <h2 className="text-xl font-bold text-white">
            {mode === "login" ? "Sign In" : "Create Account"}
          </h2>
          <p className="text-white text-sm mt-1">
            {mode === "login"
              ? "Welcome back! Sign in to your account"
              : "Sign up to create your Polkadot wallet"}
          </p>
          <button
            onClick={() => {
              onClose();
              resetState();
            }}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email Address
              </label>
              <div className="relative">
                <Mail
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 text-black rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
                  placeholder="Enter your email address"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <div className="relative">
                <Lock
                  className="absolute left-3 top-3 text-gray-400"
                  size={20}
                />
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  required
                  className="w-full pl-10 pr-12 py-3 border text-black border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
                  placeholder={
                    mode === "login"
                      ? "Enter your password"
                      : "Create a strong password"
                  }
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Password Strength Indicator (Register Mode) */}
              {mode === "register" && password && (
                <div className="mt-2">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-600">Password strength:</span>
                    <span
                      className={`font-medium ${getPasswordStrengthColor()}`}
                    >
                      {passwordStrength || "weak"}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        passwordStrength === "weak"
                          ? "bg-red-500"
                          : passwordStrength === "medium"
                            ? "bg-yellow-500"
                            : "bg-green-500"
                      } ${getPasswordStrengthWidth()}`}
                    ></div>
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password Field (Register Mode) */}
            {mode === "register" && (
              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock
                    className="absolute left-3 top-3 text-gray-400"
                    size={20}
                  />
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirmPassword"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent outline-none transition-all"
                    placeholder="Confirm your password"
                    disabled={loading}
                  />
                  {confirmPassword && (
                    <div className="absolute right-3 top-3">
                      {password === confirmPassword ? (
                        <CheckCircle className="text-green-500" size={20} />
                      ) : (
                        <AlertTriangle className="text-red-500" size={20} />
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-6 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  {mode === "login" ? "Signing In..." : "Creating Account..."}
                </div>
              ) : mode === "login" ? (
                "Sign In"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mt-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Mode Switch */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {mode === "login"
                ? "Don't have an account?"
                : "Already have an account?"}
              <button
                onClick={() =>
                  handleModeSwitch(mode === "login" ? "register" : "login")
                }
                className="ml-2 text-gray-900 font-semibold hover:underline"
                disabled={loading}
              >
                {mode === "login" ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
