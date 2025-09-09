"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import LoginPopup from "./polkablocks/loginPopup";

const Header = () => {
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Check for stored user session on component mount
  useEffect(() => {
    const storedEmail = localStorage.getItem("polkablock_user_email");
    if (storedEmail) {
      setUserEmail(storedEmail);
    }
  }, []);

  const navigationItems = [
    { href: "/", label: "Home" },
    { href: "/explore", label: "Explore" },
    { href: "/create", label: "Create" },
    { href: "/dashboard", label: "Dashboard" },
  ];

  const handleLoginSuccess = (email: string) => {
    setUserEmail(email);
    localStorage.setItem("polkablock_user_email", email);
  };

  const handleLogout = () => {
    setUserEmail(null);
    localStorage.removeItem("polkablock_user_email");
  };

  return (
    <>
      <header className="sticky top-0 z-50 backdrop-blur-sm border-b border-gray-200/20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left: Logo & Brand */}
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Image
                  src="/logo.svg"
                  alt="Polkablock Logo"
                  className=""
                  width={40}
                  height={40}
                />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-white leading-tight">
                  Polkablock
                </h1>
                <p className="text-xs text-gray-200 leading-tight">
                  A web3 way of life
                </p>
              </div>
            </div>

            {/* Center: Navigation */}
            <nav className="hidden md:flex items-center justify-center flex-1 max-w-md mx-8">
              <div className="flex items-center space-x-1 rounded-none p-1">
                {navigationItems.map((item, index) => (
                  <Link
                    key={index}
                    href={item.href}
                    className="px-4 py-2 text-sm font-medium text-white hover:text-gray-900 hover:bg-white rounded-none transition-all duration-200 ease-in-out"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            {/* Right: Account Section */}
            <div className="flex items-center space-x-3 text-sm">
              {userEmail ? (
                // Logged in state
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                      <span className="text-white text-xs font-semibold">
                        {userEmail.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-gray-200 text-sm hidden sm:block">
                      {userEmail.length > 20
                        ? userEmail.substring(0, 20) + "..."
                        : userEmail}
                    </span>
                  </div>
                  <Link
                    href="/account"
                    className="px-3 py-2 text-gray-200 hover:text-purple-400 font-medium transition-colors duration-200"
                  >
                    Account
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-2 text-gray-200 hover:text-red-400 font-medium transition-colors duration-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                // Not logged in state
                <button
                  onClick={() => setShowLoginPopup(true)}
                  className="px-4 py-2 bg-white text-black hover:cursor-pointer font-medium rounded-lg transition-all duration-200"
                >
                  Get Started
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-200 hover:text-purple-400 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-purple-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                <svg
                  className="h-6 w-6"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile Navigation Menu */}
          <div className="md:hidden border-t border-gray-200/20">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-black/20">
              {navigationItems.map((item, index) => (
                <Link
                  key={index}
                  href={item.href}
                  className="block px-3 py-2 text-base font-medium text-gray-200 hover:text-purple-400 hover:bg-white/10 rounded-md transition-colors duration-200"
                >
                  {item.label}
                </Link>
              ))}
              <div className="border-t border-gray-200/20 pt-2 mt-2">
                {userEmail ? (
                  <div className="flex flex-col space-y-2">
                    <span className="px-3 py-2 text-gray-200 text-sm">
                      {userEmail}
                    </span>
                    <Link
                      href="/account"
                      className="px-3 py-2 text-gray-200 hover:text-purple-400 font-medium"
                    >
                      Account
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="px-3 py-2 text-left text-gray-200 hover:text-red-400 font-medium"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setShowLoginPopup(true)}
                    className="w-full px-3 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-medium rounded-md"
                  >
                    Get Started
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <LoginPopup
        isOpen={showLoginPopup}
        onClose={() => setShowLoginPopup(false)}
        onLoginSuccess={handleLoginSuccess}
      />
    </>
  );
};

export default Header;
