"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import { signIn, signUp } from "@/app/actions/auth";
import { useAuth } from "@/app/providers/AuthProvider";

type Mode = "sign-in" | "sign-up";

interface AuthModalProps {
  onClose: () => void;
}

export function AuthModal({ onClose }: AuthModalProps) {
  const [mode, setMode] = useState<Mode>("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { refreshAuth } = useAuth();
  const backdropRef = useRef<HTMLDivElement>(null);

  // Close on Escape key
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function toggleMode(next: Mode) {
    setError(null);
    setMode(next);
  }

  async function handleSignInSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await signIn(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        await refreshAuth();
        onClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  async function handleSignUpSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      try {
        const result = await signUp(formData);
        if (result?.error) {
          setError(result.error);
          return;
        }
        await refreshAuth();
        onClose();
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <div
      ref={backdropRef}
      className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 select-none animate-fade-in"
      style={{
        backgroundColor: "rgba(0, 0, 0, 0.45)",
        backdropFilter: "blur(2.5px)",
      }}
      onClick={(e) => {
        if (e.target === backdropRef.current) onClose();
      }}
    >
      {/* Outer Card Container with crisp edges */}
      <div
        className="relative w-full max-w-[760px] min-h-[480px] sm:min-h-[460px] bg-[#EBECF0] rounded-[24px] sm:rounded-[32px] overflow-hidden shadow-[0_20px_45px_-8px_rgba(0,0,0,0.3),0_0_1px_1px_rgba(0,0,0,0.06)] border border-neutral-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Close Button */}
        <button
          onClick={onClose}
          aria-label="Close modal"
          className="absolute top-4 right-4 z-50 w-8 h-8 rounded-full bg-[#EBECF0] border border-neutral-300/80 shadow-[2px_2px_5px_#cbced1,-2px_-2px_5px_#ffffff] hover:shadow-[inset_1px_1px_3px_#cbced1,inset_-1px_-1px_3px_#ffffff] flex items-center justify-center text-neutral-500 hover:text-neutral-900 transition-all cursor-pointer active:scale-95"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* =========================================================================
            DESKTOP SLIDING LAYOUT (SM and above)
           ========================================================================= */}
        <div className="hidden sm:block relative w-full h-[460px]">
          {/* Form 1: SIGN IN Form (Left Half) */}
          <div
            className={`absolute top-0 left-0 w-1/2 h-full flex flex-col justify-center items-center px-8 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              mode === "sign-in"
                ? "opacity-100 pointer-events-auto z-10 translate-x-0"
                : "opacity-0 pointer-events-none z-0 -translate-x-6"
            }`}
          >
            <form onSubmit={handleSignInSubmit} className="w-full max-w-[270px] flex flex-col items-center">
              <h2 className="text-3xl font-extrabold text-[#181820] mb-6 tracking-tight">Sign in</h2>

              {/* Inset Inputs */}
              <div className="w-full space-y-3.5 mb-4">
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="w-full bg-[#EBECF0] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#181820] placeholder-neutral-400 border border-neutral-300/70 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:border-[#FB8C00] transition-all"
                />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  className="w-full bg-[#EBECF0] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#181820] placeholder-neutral-400 border border-neutral-300/70 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:border-[#FB8C00] transition-all"
                />
              </div>

              {/* Error Box */}
              {error && mode === "sign-in" && (
                <div className="w-full mb-3 px-3 py-2 rounded-xl text-[11px] text-red-600 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              {/* Neumorphic Sign In Button */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-2 px-8 py-2.5 rounded-xl bg-[#EBECF0] border border-neutral-300/80 text-[#181820] font-bold text-xs tracking-wider shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] active:scale-95 transition-all cursor-pointer uppercase disabled:opacity-50"
              >
                {isPending ? "Signing In..." : "SIGN IN"}
              </button>

              <button
                type="button"
                onClick={() => toggleMode("sign-up")}
                className="text-[11px] text-neutral-400 hover:text-neutral-700 transition-colors mt-4 cursor-pointer"
              >
                Need an account? Sign up
              </button>
            </form>
          </div>

          {/* Form 2: SIGN UP Form (Right Half) */}
          <div
            className={`absolute top-0 right-0 w-1/2 h-full flex flex-col justify-center items-center px-8 transition-all duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              mode === "sign-up"
                ? "opacity-100 pointer-events-auto z-10 translate-x-0"
                : "opacity-0 pointer-events-none z-0 translate-x-6"
            }`}
          >
            <form onSubmit={handleSignUpSubmit} className="w-full max-w-[270px] flex flex-col items-center">
              <h2 className="text-3xl font-extrabold text-[#181820] mb-5 tracking-tight">Create Account</h2>

              {/* Inset Inputs */}
              <div className="w-full space-y-3 mb-3.5">
                <input
                  name="display_name"
                  type="text"
                  required
                  placeholder="Name"
                  className="w-full bg-[#EBECF0] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#181820] placeholder-neutral-400 border border-neutral-300/70 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:border-[#FB8C00] transition-all"
                />
                <input
                  name="email"
                  type="email"
                  required
                  placeholder="Email"
                  className="w-full bg-[#EBECF0] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#181820] placeholder-neutral-400 border border-neutral-300/70 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:border-[#FB8C00] transition-all"
                />
                <input
                  name="password"
                  type="password"
                  required
                  placeholder="Password"
                  minLength={6}
                  className="w-full bg-[#EBECF0] rounded-xl px-4 py-2.5 text-xs sm:text-sm text-[#181820] placeholder-neutral-400 border border-neutral-300/70 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none focus:border-[#FB8C00] transition-all"
                />
              </div>

              {/* Error Box */}
              {error && mode === "sign-up" && (
                <div className="w-full mb-3 px-3 py-2 rounded-xl text-[11px] text-red-600 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              {/* Neumorphic Sign Up Button */}
              <button
                type="submit"
                disabled={isPending}
                className="mt-1 px-8 py-2.5 rounded-xl bg-[#EBECF0] border border-neutral-300/80 text-[#181820] font-bold text-xs tracking-wider shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] hover:shadow-[2px_2px_4px_#cbced1,-2px_-2px_4px_#ffffff] active:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] active:scale-95 transition-all cursor-pointer uppercase disabled:opacity-50"
              >
                {isPending ? "Creating..." : "SIGN UP"}
              </button>
            </form>
          </div>

          {/* =========================================================================
              SLIDING THEME ORANGE OVERLAY PANEL (#FB8C00 brand match)
             ========================================================================= */}
          <div
            className={`absolute top-0 left-0 w-1/2 h-full z-30 transition-transform duration-700 ease-[cubic-bezier(0.65,0,0.35,1)] ${
              mode === "sign-in" ? "translate-x-full" : "translate-x-0"
            }`}
          >
            <div className="w-full h-full bg-[#FB8C00] rounded-[24px] sm:rounded-[32px] flex flex-col justify-center items-center text-center px-8 shadow-[-4px_0_18px_rgba(0,0,0,0.12)] relative overflow-hidden">
              {/* Overlay Content 1: Shown in Sign-In state */}
              <div
                className={`transition-all duration-500 flex flex-col items-center ${
                  mode === "sign-in"
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none absolute"
                }`}
              >
                <h2 className="text-3xl font-extrabold text-white leading-tight mb-2 tracking-tight">
                  Welcome To<br />Aura Mail!
                </h2>
                <p className="text-white/90 text-xs sm:text-sm font-medium mb-6">
                  New Here?
                </p>
                <button
                  type="button"
                  onClick={() => toggleMode("sign-up")}
                  className="px-9 py-2.5 rounded-full bg-[#E67E00] hover:bg-[#D97700] text-white font-bold text-xs tracking-wider shadow-[0_4px_14px_rgba(0,0,0,0.2)] border border-white/30 hover:border-white/50 active:scale-95 transition-all cursor-pointer uppercase"
                >
                  SIGN UP
                </button>
              </div>

              {/* Overlay Content 2: Shown in Sign-Up state */}
              <div
                className={`transition-all duration-500 flex flex-col items-center ${
                  mode === "sign-up"
                    ? "opacity-100 scale-100 pointer-events-auto"
                    : "opacity-0 scale-95 pointer-events-none absolute"
                }`}
              >
                <h2 className="text-3xl font-extrabold text-white leading-tight mb-2 tracking-tight">
                  Welcome back To<br />Aura Mail!
                </h2>
                <p className="text-white/90 text-xs sm:text-sm font-medium mb-6">
                  Already have an account?
                </p>
                <button
                  type="button"
                  onClick={() => toggleMode("sign-in")}
                  className="px-9 py-2.5 rounded-full bg-[#E67E00] hover:bg-[#D97700] text-white font-bold text-xs tracking-wider shadow-[0_4px_14px_rgba(0,0,0,0.2)] border border-white/30 hover:border-white/50 active:scale-95 transition-all cursor-pointer uppercase"
                >
                  SIGN IN
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* =========================================================================
            MOBILE RESPONSIVE VIEW (< SM screens)
           ========================================================================= */}
        <div className="sm:hidden flex flex-col w-full p-5">
          {/* Top Brand Orange Header */}
          <div className="w-full bg-[#FB8C00] rounded-2xl p-5 text-center text-white mb-5 shadow-sm">
            <h2 className="text-2xl font-extrabold leading-tight">
              {mode === "sign-in" ? "Welcome To Aura Mail!" : "Welcome back To Aura Mail!"}
            </h2>
            <p className="text-white/90 text-xs mt-1">
              {mode === "sign-in" ? "New Here? Switch to create an account" : "Already have an account? Switch to sign in"}
            </p>
            {/* Toggle Pill Button */}
            <div className="mt-3 inline-flex p-1 bg-black/15 rounded-full border border-white/20">
              <button
                type="button"
                onClick={() => toggleMode("sign-in")}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                  mode === "sign-in"
                    ? "bg-white text-[#181820] shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => toggleMode("sign-up")}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                  mode === "sign-up"
                    ? "bg-white text-[#181820] shadow-sm"
                    : "text-white/80 hover:text-white"
                }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Mobile Form Content */}
          <div className="w-full flex flex-col items-center">
            <h3 className="text-xl font-extrabold text-[#181820] mb-3">
              {mode === "sign-in" ? "Sign in" : "Create Account"}
            </h3>

            <form
              onSubmit={mode === "sign-in" ? handleSignInSubmit : handleSignUpSubmit}
              className="w-full max-w-[280px] space-y-3"
            >
              {mode === "sign-up" && (
                <input
                  name="display_name"
                  type="text"
                  required
                  placeholder="Name"
                  className="w-full bg-[#EBECF0] rounded-xl px-4 py-2.5 text-xs text-[#181820] placeholder-neutral-400 border border-neutral-300/70 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none"
                />
              )}
              <input
                name="email"
                type="email"
                required
                placeholder="Email"
                className="w-full bg-[#EBECF0] rounded-xl px-4 py-2.5 text-xs text-[#181820] placeholder-neutral-400 border border-neutral-300/70 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none"
              />
              <input
                name="password"
                type="password"
                required
                placeholder="Password"
                minLength={6}
                className="w-full bg-[#EBECF0] rounded-xl px-4 py-2.5 text-xs text-[#181820] placeholder-neutral-400 border border-neutral-300/70 shadow-[inset_3px_3px_6px_#cbced1,inset_-3px_-3px_6px_#ffffff] focus:outline-none"
              />

              {error && (
                <div className="w-full px-3 py-2 rounded-xl text-[11px] text-red-600 bg-red-50 border border-red-200">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="w-full py-2.5 rounded-xl bg-[#EBECF0] border border-neutral-300/80 text-[#181820] font-bold text-xs tracking-wider shadow-[4px_4px_8px_#cbced1,-4px_-4px_8px_#ffffff] active:shadow-[inset_2px_2px_4px_#cbced1,inset_-2px_-2px_4px_#ffffff] active:scale-95 transition-all cursor-pointer uppercase"
              >
                {isPending
                  ? mode === "sign-in" ? "Signing In..." : "Creating..."
                  : mode === "sign-in" ? "SIGN IN" : "SIGN UP"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
