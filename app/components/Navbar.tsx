"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";

export type NavSection = "home" | "analyse" | "about" | "features" | "groups";

interface NavbarProps {
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  onOpenAuth: () => void;
}

export function Navbar({ activeSection, onSelectSection, onOpenAuth }: NavbarProps) {
  const { user, displayName, signOut } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const lastScrollY = useRef(0);

  // Handle auto-hide navbar on scroll
  useEffect(() => {
    function handleScroll() {
      const currentScrollY = window.scrollY;
      
      // Always show near the top of the page
      if (currentScrollY < 30) {
        setIsVisible(true);
      } else if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        // Scrolling down -> hide navbar
        setIsVisible(false);
        setProfileOpen(false);
      } else if (currentScrollY < lastScrollY.current) {
        // Scrolling up -> show navbar
        setIsVisible(true);
      }
      
      lastScrollY.current = currentScrollY;
    }

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Build nav items based on auth state
  const navItems: { id: NavSection; label: string }[] = [
    { id: "home", label: "Home" },
    { id: "analyse", label: "Analyse" },
    { id: "about", label: "About" },
    { id: "features", label: "Features" },
    ...(user ? [{ id: "groups" as NavSection, label: "Groups" }] : []),
  ];



  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-profile-dropdown]") && !target.closest("[data-mobile-menu]")) {
        setProfileOpen(false);
        setMobileMenuOpen(false);
      }
    }
    if (profileOpen || mobileMenuOpen) {
      window.addEventListener("click", handleClickOutside);
      return () => window.removeEventListener("click", handleClickOutside);
    }
  }, [profileOpen, mobileMenuOpen]);

  // Format initials and display name
  const initials = (() => {
    if (displayName && displayName.trim().length > 0) {
      const parts = displayName.trim().split(/[\s_-]+/);
      if (parts.length >= 2) {
        return (parts[0][0] + parts[1][0]).toUpperCase();
      }
      return displayName.substring(0, 2).toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "AF";
  })();

  const rawName = displayName || (user?.email ? user.email.split("@")[0] : "Aura Forensics");
  const formattedHandle = rawName.replace(/\s+/g, "_");
  const formattedTitle = rawName.replace(/_/g, " ");
  const analystId = user?.id ? `AM-${user.id.substring(0, 4).toUpperCase()}` : "AM-7734";

  async function handleSignOut() {
    setSignOutError(null);
    try {
      await signOut();
      setProfileOpen(false);
      setMobileMenuOpen(false);
      if (activeSection === "groups") {
        onSelectSection("home");
      }
    } catch (err: any) {
      setSignOutError(err.message || "Failed to sign out");
    }
  }

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 pt-3 sm:pt-5 px-3 sm:px-8 md:px-12 select-none transition-all duration-300 ease-in-out pointer-events-none ${
        isVisible ? "translate-y-0 opacity-100" : "-translate-y-28 opacity-0"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 bg-white/70 sm:bg-[#ECECEC]/80 backdrop-blur-lg px-4 sm:px-6 py-2 sm:py-2.5 rounded-2xl sm:rounded-3xl border border-white/90 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
        
        {/* Left: Aura Mail Logo with Network Nodes Icon */}
        <div
          onClick={() => {
            onSelectSection("home");
            setMobileMenuOpen(false);
          }}
          className="pointer-events-auto flex items-center gap-2.5 sm:gap-3 cursor-pointer group shrink-0"
        >
          <img
            src="/assets/aura-network-logo.png"
            alt="Aura Mail Logo"
            className="w-7 h-7 sm:w-8 sm:h-8 object-contain transition-transform duration-200 group-hover:scale-105"
          />
          <span className="text-base sm:text-xl font-bold tracking-tight text-[#18181B] font-sans whitespace-nowrap">
            Aura Mail
          </span>
        </div>

        {/* Center: Desktop Capsule Navigation (Matches Image 3) */}
        <nav
          aria-label="Main Navigation"
          className="pointer-events-auto relative hidden md:flex items-center border border-neutral-300/80 rounded-full px-5 py-1 bg-transparent"
        >
          {navItems.map((item, index) => {
            const isActive = activeSection === item.id;
            return (
              <div key={item.id} className="flex items-center">
                {index > 0 && (
                  <span className="text-neutral-300/90 mx-3 select-none text-xs font-light">|</span>
                )}
                <button
                  data-nav-id={item.id}
                  onClick={() => onSelectSection(item.id)}
                  className={`relative flex flex-col items-center py-1 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? "text-[#FF5100] font-semibold"
                      : "text-[#3F3F46] hover:text-[#18181B]"
                  }`}
                >
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="w-3.5 h-[2.5px] bg-[#FF5100] rounded-full mt-0.5 animate-fade-in" />
                  )}
                </button>
              </div>
            );
          })}
        </nav>

        {/* Right: Action Buttons & Auth Profile */}
        <div className="pointer-events-auto flex items-center gap-2 shrink-0">
          {/* Desktop Auth State */}
          <div data-profile-dropdown className="relative">
            {user ? (
              <div>
                {/* Logged in avatar + name + chevron */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileOpen((prev) => !prev);
                  }}
                  className="flex items-center gap-2 cursor-pointer p-1 rounded-full hover:bg-neutral-200/50 transition-colors"
                  aria-expanded={profileOpen}
                  aria-label="User Account Menu"
                >
                  <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white border-2 border-[#FF5100] flex items-center justify-center text-[#181820] font-bold text-xs sm:text-sm shadow-sm shrink-0">
                    {initials}
                  </div>
                  <span className="text-sm font-medium text-[#181820] hidden sm:inline-block max-w-[120px] truncate">
                    {formattedHandle}
                  </span>
                  <svg
                    className={`w-3.5 h-3.5 text-[#181820] transition-transform duration-200 hidden sm:block ${
                      profileOpen ? "rotate-180" : ""
                    }`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {/* Profile Dropdown */}
                {profileOpen && (
                  <div
                    onClick={(e) => e.stopPropagation()}
                    className="absolute right-0 mt-3 w-60 sm:w-64 bg-white rounded-2xl border border-neutral-100 shadow-[0_12px_36px_rgba(0,0,0,0.12)] p-4 z-50 animate-fade-in"
                  >
                    <div className="pb-3">
                      <p className="text-[15px] font-bold text-[#181820] truncate">{formattedTitle}</p>
                      <p className="text-xs text-[#8A8F98] mt-0.5">Analyst ID: {analystId}</p>
                    </div>
                    <div className="border-t border-neutral-100 my-1" />
                    <div className="py-1">
                      <button
                        onClick={() => {
                          onSelectSection("groups");
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-sm font-medium text-[#181820] hover:bg-[#FFF8F0] hover:text-[#FF5100] transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-2.5">
                          <svg
                            className="w-4 h-4 text-[#606772] group-hover:text-[#FF5100] transition-colors"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.8}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                            />
                          </svg>
                          <span>Groups</span>
                        </div>
                      </button>
                    </div>
                    <div className="border-t border-neutral-100 my-1" />
                    <div className="pt-2">
                      {signOutError && <p className="text-[11px] text-red-500 mb-1.5 px-2">{signOutError}</p>}
                      <button
                        onClick={handleSignOut}
                        className="w-full py-1.5 text-center text-sm font-semibold text-[#EF4444] hover:text-red-700 transition-colors cursor-pointer"
                      >
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Image 3: Orange Sign In / Sign Up Button */
              <button
                onClick={onOpenAuth}
                className="relative inline-flex items-center justify-center bg-[#FF5100] hover:bg-[#E64900] text-white px-4 sm:px-6 py-2 sm:py-2.5 rounded-xl sm:rounded-2xl text-xs sm:text-sm font-semibold shadow-[0_8px_18px_-3px_rgba(255,81,0,0.45)] hover:shadow-[0_12px_24px_-3px_rgba(255,81,0,0.6)] active:scale-95 transition-all duration-200 cursor-pointer select-none whitespace-nowrap"
              >
                <span className="hidden sm:inline">Sign In / Sign Up</span>
                <span className="sm:hidden">Sign In</span>
              </button>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <div data-mobile-menu className="relative md:hidden">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMobileMenuOpen((prev) => !prev);
              }}
              aria-label="Toggle navigation menu"
              className="w-9 h-9 rounded-xl bg-white/95 backdrop-blur-md border border-neutral-200 shadow-sm flex items-center justify-center text-[#181820] hover:text-[#FF5100] transition-colors cursor-pointer active:scale-95"
            >
              {mobileMenuOpen ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>

            {/* Mobile Dropdown Menu Card */}
            {mobileMenuOpen && (
              <div
                onClick={(e) => e.stopPropagation()}
                className="absolute right-0 mt-3 w-56 bg-white/98 backdrop-blur-xl rounded-2xl border border-neutral-200/90 shadow-[0_16px_40px_rgba(0,0,0,0.15)] p-3 z-50 animate-fade-in"
              >
                <div className="space-y-1">
                  {navItems.map((item) => {
                    const isActive = activeSection === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          onSelectSection(item.id);
                          setMobileMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors cursor-pointer ${
                          isActive
                            ? "bg-[#FFF3E0] text-[#FF5100] font-bold"
                            : "text-[#181820] hover:bg-neutral-100/80"
                        }`}
                      >
                        <span>{item.label}</span>
                        {isActive && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5100]" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {user ? (
                  <div className="mt-3 pt-3 border-t border-neutral-100">
                    <div className="px-3.5 py-1 mb-2">
                      <p className="text-xs font-bold text-[#181820] truncate">{formattedTitle}</p>
                      <p className="text-[10px] text-neutral-400">Analyst ID: {analystId}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full py-2 text-center text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                    >
                      Sign Out
                    </button>
                  </div>
                ) : (
                  <div className="mt-2 pt-2 border-t border-neutral-100 sm:hidden">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        onOpenAuth();
                      }}
                      className="w-full py-2.5 bg-[#FF5100] text-white text-xs font-semibold rounded-xl shadow-md active:scale-95 transition-all text-center"
                    >
                      Sign In / Sign Up
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
