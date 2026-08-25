"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { useOrganizations } from '@/hooks/useOrganizations';
import { AuthModal } from "@/app/components/AuthModal";
import { Navbar, NavSection } from "@/app/components/Navbar";

interface CheckResult {
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  embedding?: number[] | null;
  complaintDraft?: string;
  financialLossLikely?: boolean;
}

interface CircleReport {
  id: string;
  circleId: string;
  clusterId: string;
  text: string;
  riskScore: number;
  flags: string[];
  explanation: string;
  timestamp: string;
  clusterCount: number;
}

function RiskBadge({ score }: { score: number }) {
  const radius = 54;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(Math.max(score, 0), 100);
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  let strokeColor = "#10B981"; // Green (< 40)
  let badgeStyle = "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  let label = "Low Risk";

  if (score >= 40 && score < 80) {
    strokeColor = "#FFA000"; // Yellowish Orange (40 - 79)
    badgeStyle = "bg-[#2D2114] text-[#FFA000] border-[#FFA000]/30";
    label = "Medium Risk";
  } else if (score >= 80) {
    strokeColor = "#EF4444"; // Red (80 - 100)
    badgeStyle = "bg-red-500/15 text-red-400 border-red-500/30";
    label = "High Risk";
  }

  return (
    <div className="flex flex-col items-center justify-center shrink-0">
      <div className="relative w-36 h-36 flex items-center justify-center">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 130 130">
          {/* Background circle track */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            stroke="#282B34"
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress circle */}
          <circle
            cx="65"
            cy="65"
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        {/* Score Number in Center */}
        <span className="absolute text-5xl font-extrabold text-white tracking-tight font-sans">
          {score}
        </span>
      </div>

      {/* Pill Badge */}
      <span className={`mt-3 px-5 py-1.5 rounded-xl border text-xs sm:text-sm font-semibold tracking-wide ${badgeStyle}`}>
        {label}
      </span>
    </div>
  );
}

function MiniRiskBadge({ score }: { score: number }) {
  let colorClass = "";
  if (score < 40) colorClass = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
  else if (score < 80) colorClass = "bg-amber-500/20 text-[#FFA000] border-amber-500/40";
  else colorClass = "bg-red-500/20 text-red-400 border-red-500/40";

  return (
    <div className={`flex items-center justify-center w-10 h-10 rounded-full border ${colorClass} text-sm font-bold`}>
      {score}
    </div>
  );
}

function getFlagIcon(flagText: string) {
  const lower = flagText.toLowerCase();
  if (lower.includes("link") || lower.includes("url") || lower.includes("domain") || lower.includes("http")) {
    return (
      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    );
  }
  if (lower.includes("urgent") || lower.includes("language") || lower.includes("deadline") || lower.includes("threat") || lower.includes("alert")) {
    return (
      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    );
  }
  if (lower.includes("sender") || lower.includes("mismatch") || lower.includes("impersonat") || lower.includes("from") || lower.includes("account")) {
    return (
      <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    );
  }
  return (
    <svg className="w-4 h-4 text-red-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

function TypewriterSubtitle() {
  const fullText = "Multi-signal AI-powered threat analysis.";
  const [displayedText, setDisplayedText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer: NodeJS.Timeout;

    if (!isDeleting && displayedText === fullText) {
      // Completed typing: pause for 3 seconds with blinking cursor
      timer = setTimeout(() => {
        setIsDeleting(true);
      }, 3000);
    } else if (isDeleting && displayedText === "") {
      // Completed deleting: wait 600ms before starting next cycle
      timer = setTimeout(() => {
        setIsDeleting(false);
      }, 600);
    } else {
      // Natural typing speed (55ms) and backspace speed (28ms)
      const speed = isDeleting ? 28 : 55;
      timer = setTimeout(() => {
        setDisplayedText(
          isDeleting
            ? fullText.substring(0, displayedText.length - 1)
            : fullText.substring(0, displayedText.length + 1)
        );
      }, speed);
    }

    return () => clearTimeout(timer);
  }, [displayedText, isDeleting]);

  return (
    <span className="inline-flex items-center justify-center min-h-[1.5em]">
      <span>{displayedText}</span>
      <span className="inline-block w-[2px] h-[1em] bg-[#FF5100] ml-1 animate-pulse rounded-full" />
    </span>
  );
}

export default function Home() {
  const [appMode, setAppMode] = useState<"personal" | "radar">("personal");
  const [activeSection, setActiveSection] = useState<NavSection>("home");
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);
  const { user, displayName, loading: authLoading } = useAuth();

  function handleSelectSection(section: NavSection) {
    setActiveSection(section);
    if (section === "groups") {
      setAppMode("radar");
      setTimeout(() => {
        const el = document.getElementById("active-tool-view");
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 95;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 50);
    } else if (section === "analyse") {
      setAppMode("personal");
      setTimeout(() => {
        const el = document.getElementById("active-tool-view");
        if (el) {
          const y = el.getBoundingClientRect().top + window.pageYOffset - 95;
          window.scrollTo({ top: y, behavior: "smooth" });
        }
      }, 50);
    } else if (section === "about") {
      const el = document.getElementById("about-section");
      if (el) {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 95;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    } else if (section === "features") {
      const el = document.getElementById("features-section");
      if (el) {
        const y = el.getBoundingClientRect().top + window.pageYOffset - 95;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
    } else if (section === "home") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  // Scroll Spy to highlight the current navbar item as user scrolls
  useEffect(() => {
    function handleScrollSpy() {
      const scrollPosition = window.scrollY + 160;
      const featuresEl = document.getElementById("features-section");
      const aboutEl = document.getElementById("about-section");
      const toolEl = document.getElementById("active-tool-view");

      if (featuresEl && scrollPosition >= featuresEl.offsetTop) {
        setActiveSection("features");
      } else if (aboutEl && scrollPosition >= aboutEl.offsetTop) {
        setActiveSection("about");
      } else if (toolEl && scrollPosition >= toolEl.offsetTop - 80) {
        setActiveSection(appMode === "radar" ? "groups" : "analyse");
      } else {
        setActiveSection("home");
      }
    }

    window.addEventListener("scroll", handleScrollSpy, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollSpy);
  }, [appMode]);
  
  const [activeTab, setActiveTab] = useState<"text" | "image">("text");
  const [language, setLanguage] = useState<"en" | "hi">("en");
  
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reporting
  const [reportCircleId, setReportCircleId] = useState<string>("");
  const [reportStatus, setReportStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Radar Feed
  const [selectedCircle, setSelectedCircle] = useState<string>("");
  const [feedReports, setFeedReports] = useState<CircleReport[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [showInviteInfo, setShowInviteInfo] = useState(false);
  const [showOrgActionForm, setShowOrgActionForm] = useState<"none"|"join"|"create">("none");

  // Organizations State from Hook
  const {
    organizations,
    loading: orgsLoading,
    createOrgName,
    joinInviteCode,
    actionStatus: orgActionStatus,
    actionMessage: orgActionMessage,
    newInviteCode,
    dispatch,
    handleCreateOrg,
    handleJoinOrg
  } = useOrganizations(user);

  useEffect(() => {
    if (organizations.length > 0) {
      if (!reportCircleId || !organizations.find(g => g.id === reportCircleId)) setReportCircleId(organizations[0].id);
      if (!selectedCircle || !organizations.find(g => g.id === selectedCircle)) setSelectedCircle(organizations[0].id);
    } else {
      setReportCircleId("");
      setSelectedCircle("");
    }
  }, [organizations]);




  // Copy button states
  const [shareAlertCopied, setShareAlertCopied] = useState(false);
  const [draftCopied, setDraftCopied] = useState(false);


  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  }

  async function handleCheck() {
    if (activeTab === "text" && !text.trim()) return;
    if (activeTab === "image" && !imageFile) return;

    setLoading(true);
    setResult(null);
    setError(null);
    setReportStatus("idle");

    try {
      let payload: any = {};
      
      if (activeTab === "text") {
        payload = { text, language };
      } else if (activeTab === "image" && imageFile && imagePreview) {
        // Strip data:image/...;base64,
        const base64Data = imagePreview.split(",")[1];
        payload = {
          imageBase64: base64Data,
          mimeType: imageFile.type,
          language,
        };
      }

      const res = await fetch("/api/check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error ?? "Something went wrong.");
      }

      const data: CheckResult = await res.json();
      setResult(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function handleReport() {
    if (!result) return;
    setReportStatus("loading");
    try {
      const res = await fetch(`/api/circles/${reportCircleId}/report`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: result.text,
          riskScore: result.riskScore,
          flags: result.flags,
          explanation: result.explanation,
          embedding: result.embedding,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to report");
      }
      setReportStatus("success");
    } catch (e) {
      console.error(e);
      setReportStatus("error");
    }
  }

  async function fetchFeed() {
    setFeedLoading(true);
    setFeedError(null);
    try {
      const res = await fetch(`/api/circles/${selectedCircle}/reports`);
      if (!res.ok) {
        throw new Error("Failed to fetch feed");
      }
      const data = await res.json();
      setFeedReports(data.reports || []);
    } catch (e: any) {
      setFeedError(e.message);
    } finally {
      setFeedLoading(false);
    }
  }

  // Fetch feed when switching to radar mode or changing circle
  useEffect(() => {
    if (appMode === "radar") {
      fetchFeed();
    }
  }, [appMode, selectedCircle]);

  return (
    <div className="min-h-screen bg-[#F0F0F0] text-[#1A1A1A] font-sans flex flex-col justify-between" onClick={() => profileMenuOpen && setProfileMenuOpen(false)}>
      {/* Floating Navbar */}
      <Navbar
        activeSection={activeSection}
        onSelectSection={handleSelectSection}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <div className="relative max-w-5xl mx-auto px-4 pt-20 sm:pt-22 md:pt-24 pb-6 sm:pb-8 w-full flex-1">
        {/* New Hero Section with Reference Map Asset */}
        <section id="home-section" className="relative w-full max-w-5xl mx-auto mb-8 sm:mb-12 select-none flex flex-col items-center justify-center scroll-mt-24 sm:scroll-mt-28">
          {/* Subtle Halftone Dot Patterns on Sides */}
          <div className="absolute -top-4 -left-8 sm:-left-16 w-48 sm:w-64 h-64 sm:h-80 pointer-events-none opacity-30 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_left,#000_30%,transparent_80%)]" />
          <div className="absolute -top-4 -right-8 sm:-right-16 w-48 sm:w-64 h-64 sm:h-80 pointer-events-none opacity-30 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:14px_14px] [mask-image:radial-gradient(ellipse_at_right,#000_30%,transparent_80%)]" />

          {/* Map Graphic Container */}
          <div className="relative w-full flex flex-col items-center justify-center">
            {/* 3D Map Graphic with Bottom Transparency Gradient Transition */}
            <div className="w-full max-w-4xl flex items-center justify-center px-2">
              <img
                src="/assets/landing-map.png"
                alt="Aura Mail Threat Map"
                style={{
                  maskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)",
                  WebkitMaskImage: "linear-gradient(to bottom, rgba(0,0,0,1) 40%, rgba(0,0,0,0) 95%)",
                }}
                className="w-full h-auto max-h-[300px] sm:max-h-[380px] md:max-h-[420px] object-contain opacity-80 drop-shadow-[0_10px_20px_rgba(0,0,0,0.03)] pointer-events-none"
              />
            </div>

            {/* Centered Typography & Action Buttons (Compact Layout Fitting Above the Fold) */}
            <div className="relative sm:absolute sm:inset-x-0 sm:bottom-0 md:bottom-2 lg:bottom-4 flex flex-col items-center justify-center text-center px-4 pt-3 sm:pt-0 pointer-events-none z-10">
              <h1 className="aura-title-animated font-bold text-3xl sm:text-4xl md:text-5xl lg:text-6xl tracking-tight uppercase leading-tight">
                AURA MAIL
              </h1>
              <p className="mt-1 text-xs sm:text-sm md:text-base text-[#4B5563] font-medium tracking-tight h-6 flex items-center justify-center">
                <TypewriterSubtitle />
              </p>

              {/* Action Buttons: Analyse & Scam Radar */}
              <div className="mt-4 sm:mt-5 flex flex-wrap items-center justify-center gap-3 sm:gap-4 pointer-events-auto">
                <button
                  id="hero-btn-analyse"
                  onClick={() => {
                    setAppMode("personal");
                    document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    appMode === "personal"
                      ? "bg-[#FF5100] text-white shadow-[0_12px_28px_-4px_rgba(255,81,0,0.55)] ring-2 ring-orange-400/50 hover:bg-[#E64900]"
                      : "bg-[#FF5100] text-white shadow-[0_10px_25px_-4px_rgba(255,81,0,0.4)] hover:bg-[#E64900]"
                  }`}
                >
                  <span>Analyse</span>
                </button>

                <button
                  id="hero-btn-scam-radar"
                  onClick={() => {
                    setAppMode("radar");
                    document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" });
                  }}
                  className={`px-6 sm:px-8 py-3 sm:py-3.5 rounded-2xl font-bold text-sm sm:text-base transition-all duration-200 active:scale-95 flex items-center justify-center gap-2 cursor-pointer ${
                    appMode === "radar"
                      ? "bg-[#FF5100] text-white shadow-[0_12px_28px_-4px_rgba(255,81,0,0.55)] ring-2 ring-orange-400/50 hover:bg-[#E64900]"
                      : "bg-[#FF5100] text-white shadow-[0_10px_25px_-4px_rgba(255,81,0,0.4)] hover:bg-[#E64900]"
                  }`}
                >
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-white"></span>
                  </span>
                  <span>Scam Radar</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Active Tool View */}
        <div id="active-tool-view" className="max-w-3xl mx-auto w-full scroll-mt-24 sm:scroll-mt-28">
        {appMode === "personal" ? (
          <>
            {/* Input card matching reference */}
            <div className="rounded-3xl border border-white/[0.08] bg-[#18191E] text-white p-6 sm:p-8 shadow-2xl mb-8">
              {/* Top Centered Tabs */}
              <div className="flex items-center justify-center gap-3 mb-6">
                <button
                  onClick={() => setActiveTab("text")}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    activeTab === "text"
                      ? "bg-[#FF5100] text-white shadow-[0_6px_18px_rgba(255,81,0,0.4)]"
                      : "bg-[#22242C] text-[#8E95A5] hover:text-white border border-white/10 hover:bg-[#2A2C36]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>Paste Text</span>
                </button>
                <button
                  onClick={() => setActiveTab("image")}
                  className={`px-5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                    activeTab === "image"
                      ? "bg-[#FF5100] text-white shadow-[0_6px_18px_rgba(255,81,0,0.4)]"
                      : "bg-[#22242C] text-[#8E95A5] hover:text-white border border-white/10 hover:bg-[#2A2C36]"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Upload Screenshot</span>
                </button>
              </div>

              {activeTab === "text" ? (
                <div className="relative">
                  <textarea
                    id="message-input"
                    rows={6}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Paste the suspicious message here..."
                    className="w-full rounded-2xl bg-[#20222A] border border-white/10 text-slate-100 placeholder-[#5D6474] px-5 py-4 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF5100] resize-y min-h-[140px] transition"
                  />
                </div>
              ) : (
                <div>
                  <div 
                    className="w-full border-2 border-dashed border-white/15 bg-[#20222A]/60 rounded-2xl p-8 text-center cursor-pointer hover:border-[#FF5100]/60 hover:bg-[#20222A] transition-all"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef}
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                    <div className="text-slate-300 text-sm flex flex-col items-center gap-2">
                      <svg className="w-8 h-8 text-[#FF5100]/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {imageFile ? (
                        <span className="text-[#FF5100] font-semibold">{imageFile.name}</span>
                      ) : (
                        <span className="text-[#8E95A5]">Click to browse or drag a screenshot here</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Bottom Centered Action Button */}
              <div className="mt-6 flex flex-col items-center justify-center">
                <button
                  id="check-button"
                  onClick={handleCheck}
                  disabled={loading || (activeTab === "text" ? !text.trim() : !imageFile)}
                  className="px-8 py-3.5 rounded-2xl font-bold text-sm sm:text-base tracking-wide transition-all duration-200
                    bg-[#FF5100] hover:bg-[#E64900] text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer
                    shadow-[0_8px_24px_rgba(255,81,0,0.45)] active:scale-95 flex items-center justify-center gap-2.5"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      <span>Analysing…</span>
                    </span>
                  ) : (
                    <>
                      <svg className="w-5 h-5 stroke-[2.2]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <span>Analyse Message</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Image Preview */}
            {activeTab === "image" && imagePreview && result && (
              <div className="rounded-3xl border border-white/[0.08] bg-[#18191E] p-4 shadow-2xl mb-6 flex justify-center animate-fade-in">
                <img src={imagePreview} alt="Screenshot preview" className="max-h-48 rounded-xl border border-white/20 object-contain" />
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400 mb-6 animate-fade-in">
                ⚠️ {error}
              </div>
            )}

            {/* Results card exactly matching reference */}
            {result && (
              <div
                id="results-card"
                className="rounded-3xl border border-white/[0.08] bg-[#18191E] text-white p-6 sm:p-8 shadow-2xl mb-8 animate-fade-in"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                  {/* Left Side: Circular Risk Gauge */}
                  <div className="flex flex-col items-center shrink-0">
                    <RiskBadge score={result.riskScore} />
                  </div>

                  {/* Middle Divider on md screens */}
                  <div className="hidden md:block w-[1px] self-stretch bg-white/[0.08]" />

                  {/* Right Side: Red Flags Detected & Explanation */}
                  <div className="flex-1 space-y-5 w-full">
                    {/* Heading 1: Red Flags Detected */}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white mb-3 tracking-tight">
                        Red Flags Detected
                      </h2>
                      {result.flags.length > 0 ? (
                        <div className="flex flex-wrap gap-2.5">
                          {result.flags.map((flag) => (
                            <div
                              key={flag}
                              className="px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-medium bg-[#2B1B1E] text-[#F87171] border border-red-900/60 flex items-center gap-2"
                            >
                              {getFlagIcon(flag)}
                              <span>{flag}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-400">No high-risk flags detected.</p>
                      )}
                    </div>

                    {/* Heading 2: Explanation */}
                    <div>
                      <h2 className="text-base sm:text-lg font-bold text-white mb-2 tracking-tight">
                        Explanation
                      </h2>
                      <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed font-normal">
                        {result.explanation}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Copy Alert Button */}
                <div className="mt-6 pt-5 border-t border-white/[0.08] flex justify-end">
                  <button
                    id="copy-alert-button"
                    onClick={async () => {
                      const verdictLabel = result.riskScore < 40 ? "Low Risk" : result.riskScore < 80 ? "Medium Risk" : "High Risk";
                      const flagLines = result.flags.length > 0
                        ? result.flags.map(f => `• ${f}`).join("\n")
                        : "• None detected";
                      const preview = result.text.length > 200
                        ? result.text.slice(0, 200) + "…"
                        : result.text;
                      const shareText = [
                        `🚨 SCAM ALERT — Aura Mail Threat Analysis`,
                        ``,
                        `Risk Score: ${result.riskScore}/100 (${verdictLabel})`,
                        ``,
                        `Key Red Flags:`,
                        flagLines,
                        ``,
                        `What this means: ${result.explanation}`,
                        ``,
                        `Analysed message:`,
                        `"${preview}"`,
                        ``,
                        `— Checked with Aura Mail`,
                      ].join("\n");
                      try {
                        await navigator.clipboard.writeText(shareText);
                        setShareAlertCopied(true);
                        setTimeout(() => setShareAlertCopied(false), 2000);
                      } catch {
                        // fallback
                      }
                    }}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border border-white/15 bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                  >
                    {shareAlertCopied ? "✓ Copied!" : "📤 Copy Alert to Share"}
                  </button>
                </div>

                {/* Chakshu complaint draft — shown when riskScore >= 75 and draft is non-empty */}
                {result.riskScore >= 75 && result.complaintDraft && result.complaintDraft.trim() !== "" && (
                  <div className="mt-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4 sm:p-5 space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-bold text-amber-300 flex items-center gap-2">
                        📋 Chakshu Complaint Draft
                      </h3>
                      <button
                        id="copy-draft-button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(result.complaintDraft!);
                            setDraftCopied(true);
                            setTimeout(() => setDraftCopied(false), 2000);
                          } catch {
                            // clipboard blocked
                          }
                        }}
                        className="flex-shrink-0 px-3 py-1 rounded-lg text-xs font-semibold border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 transition-all active:scale-95 cursor-pointer"
                      >
                        {draftCopied ? "✓ Copied!" : "Copy Draft"}
                      </button>
                    </div>

                    {/* Channel routing note */}
                    {result.financialLossLikely ? (
                      <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2.5 text-xs text-red-300 leading-relaxed">
                        ⚠️ <strong>This message suggests money may have already been sent or lost.</strong> The right channel is the{" "}
                        <strong>Cyber Crime Helpline: 1930</strong> or{" "}
                        <a
                          href="https://cybercrime.gov.in"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline hover:text-red-200"
                        >
                          cybercrime.gov.in
                        </a>
                        {" "}— not Chakshu. File the draft below as supporting documentation.
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 leading-relaxed">
                        <strong className="text-slate-300">Chakshu</strong> is the Government of India's portal (under DoT's Sanchar Saathi) for reporting <em>suspected</em> telecom fraud.{" "}
                        <a
                          href="https://sancharsaathi.gov.in/Home/ss-feedback.jsp"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#FF5100] hover:underline"
                        >
                          File at Sanchar Saathi →
                        </a>
                      </p>
                    )}

                    {/* The draft text itself */}
                    <pre className="whitespace-pre-wrap font-mono text-xs text-slate-300 bg-black/40 rounded-xl px-3.5 py-3 border border-white/10 leading-relaxed">
                      {result.complaintDraft}
                    </pre>
                  </div>
                )}

                {/* Report to Circle section */}
                <div className="mt-5 pt-5 border-t border-white/[0.08]">
                  <h3 className="text-sm font-semibold text-slate-100 mb-1">
                    Warn Your Circle
                  </h3>
                  <p className="text-xs text-slate-400 mb-3">
                    If this is a scam, share it with your community to protect others from falling for it.
                  </p>
                  <div className="flex gap-2 items-center">
                    <select
                      value={reportCircleId}
                      onChange={(e) => setReportCircleId(e.target.value)}
                      className="flex-1 rounded-xl bg-[#20222A] border border-white/15 text-slate-100 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[#FF5100]"
                      disabled={organizations.length === 0}
                    >
                      {organizations.length === 0 ? (
                        <option value="" className="bg-[#18191E]">No organizations available</option>
                      ) : (
                        organizations.map(org => (
                          <option key={org.id} value={org.id} className="bg-[#18191E]">{org.name}</option>
                        ))
                      )}
                    </select>
                    <button
                      onClick={handleReport}
                      disabled={reportStatus === "loading" || reportStatus === "success" || !reportCircleId}
                      className="px-5 py-2 rounded-xl text-sm font-bold bg-[#FF5100] hover:bg-[#E64900] text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-sm"
                    >
                      {reportStatus === "loading" ? "Reporting..." : reportStatus === "success" ? "✓ Reported" : "Report"}
                    </button>
                  </div>
                  {organizations.length === 0 && !orgsLoading && (
                    <div className="mt-4 p-4 rounded-xl border border-dashed border-white/20 bg-white/5 text-center space-y-2">
                      <p className="text-sm text-slate-300">You need to join or create a circle before reporting.</p>
                      <button 
                        onClick={() => { setAppMode("radar"); document.getElementById("active-tool-view")?.scrollIntoView({ behavior: "smooth" }); }}
                        className="text-[#7CB8F2] text-xs font-bold hover:underline"
                      >
                        Go to Scam Radar to manage organizations →
                      </button>
                    </div>
                  )}
                  {reportStatus === "success" && (
                    <p className="text-xs text-emerald-400 mt-2">
                      Successfully reported! View it in the Scam Radar tab.
                    </p>
                  )}
                  {reportStatus === "error" && (
                    <p className="text-xs text-red-400 mt-2">
                      Failed to report. Please try again.
                    </p>
                  )}
                </div>
              </div>
            )}
          </>
        ) : (
          /* RADAR VIEW */
          <div className="animate-fade-in mb-8">
            {!user ? (
              <div className="rounded-3xl border border-black/10 bg-[#232323] text-white p-6 sm:p-8 shadow-2xl mb-8 space-y-8 text-center">
                <h2 className="text-xl font-bold text-slate-100 mb-2">Sign in to use Scam Radar</h2>
                <p className="text-sm text-slate-400 mb-6">Join circles and report scams with your community.</p>
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="px-6 py-3 rounded-2xl text-sm font-bold bg-[#31487A] hover:bg-[#7CB8F2] hover:text-[#0f172a] text-white transition-colors cursor-pointer"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <>
                <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mb-6">
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <select
                      value={selectedCircle}
                      onChange={(e) => {
                        setSelectedCircle(e.target.value);
                        setShowInviteInfo(false);
                        dispatch({ type: 'DISMISS_INVITE_CODE' });
                        dispatch({ type: 'DISMISS_ACTION_MESSAGE' });
                      }}
                      className="flex-1 sm:flex-none rounded-2xl bg-[#232323] border border-black/10 text-slate-100 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#7CB8F2] shadow-xl"
                      disabled={organizations.length === 0}
                    >
                      {organizations.length === 0 ? (
                        <option value="" className="bg-[#232323]">No organizations available</option>
                      ) : (
                        organizations.map(org => (
                          <option key={org.id} value={org.id} className="bg-[#232323]">{org.name}</option>
                        ))
                      )}
                    </select>
                    
                    {organizations.length > 0 && (
                      <button
                        onClick={() => {
                          setShowInviteInfo(!showInviteInfo);
                          dispatch({ type: 'DISMISS_INVITE_CODE' });
                          dispatch({ type: 'DISMISS_ACTION_MESSAGE' });
                        }}
                        className="px-3 py-2.5 rounded-2xl text-sm font-bold bg-[#232323] hover:bg-[#31487A] text-white border border-black/10 shadow-xl transition-colors cursor-pointer"
                      >
                        {showInviteInfo ? "Hide Invite" : "Invite Others"}
                      </button>
                    )}
                  </div>
                  
                  <div className="flex w-full sm:w-auto items-center gap-2">
                    <button
                      onClick={() => setShowOrgActionForm(prev => prev === "join" ? "none" : "join")}
                      className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer border shadow-xl ${showOrgActionForm === "join" ? "bg-[#31487A] text-white border-[#7CB8F2]" : "bg-[#232323] text-slate-300 border-black/10 hover:bg-[#31487A] hover:text-white"}`}
                    >
                      Join Organization
                    </button>
                    <button
                      onClick={() => setShowOrgActionForm(prev => prev === "create" ? "none" : "create")}
                      className={`px-4 py-2.5 rounded-2xl text-sm font-bold transition-colors cursor-pointer border shadow-xl ${showOrgActionForm === "create" ? "bg-[#31487A] text-white border-[#7CB8F2]" : "bg-[#232323] text-slate-300 border-black/10 hover:bg-[#31487A] hover:text-white"}`}
                    >
                      Create Organization
                    </button>
                    <button
                      onClick={fetchFeed}
                      disabled={feedLoading}
                      className="px-4 py-2.5 rounded-2xl text-sm font-bold bg-[#232323] hover:bg-[#31487A] text-white border border-black/10 shadow-xl disabled:opacity-50 transition-colors cursor-pointer"
                    >
                      {feedLoading ? "↻" : "↻"}
                    </button>
                  </div>
                </div>

            {/* Persistent Invite Info */}
            {showInviteInfo && organizations.find(g => g.id === selectedCircle)?.invite_code && (
              <div className="p-5 rounded-2xl border border-[#7CB8F2]/30 bg-[#7CB8F2]/10 text-center space-y-3 mb-6 animate-fade-in">
                <p className="text-sm font-semibold text-[#7CB8F2]">Invite others to {organizations.find(g => g.id === selectedCircle)?.name}</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono bg-black/40 px-4 py-2 rounded-xl text-slate-200 border border-white/10">
                    {organizations.find(g => g.id === selectedCircle)?.invite_code}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(organizations.find(g => g.id === selectedCircle)?.invite_code ?? '')}
                    className="px-3 py-2 bg-[#7CB8F2]/20 hover:bg-[#7CB8F2]/30 text-[#7CB8F2] rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-400">Share this code with people you want to join your circle.</p>
              </div>
            )}

            {/* Action Message (Join/Create Success or Error) */}
            {orgActionMessage && (
              <div className={`p-4 rounded-xl text-sm mb-6 flex justify-between items-center animate-fade-in ${orgActionStatus === "error" ? "bg-red-500/10 text-red-400 border border-red-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"}`}>
                <span>{orgActionMessage}</span>
                <button onClick={() => dispatch({ type: 'DISMISS_ACTION_MESSAGE' })} className="text-xs opacity-70 hover:opacity-100 cursor-pointer">✕</button>
              </div>
            )}

            {/* Success Creation Invite Info */}
            {newInviteCode && (
              <div className="p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 text-center space-y-3 mb-6 animate-fade-in">
                <p className="text-sm font-semibold text-amber-300">Organization created! Here is your invite code:</p>
                <div className="flex items-center justify-center gap-2">
                  <code className="text-lg font-mono bg-black/40 px-4 py-2 rounded-xl text-slate-200 border border-white/10">
                    {newInviteCode}
                  </code>
                  <button
                    onClick={() => navigator.clipboard.writeText(newInviteCode)}
                    className="px-3 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-xl font-semibold text-sm transition-colors cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-xs text-slate-400">Share this code with people you want to join your circle.</p>
                <button
                  onClick={() => dispatch({ type: 'DISMISS_INVITE_CODE' })}
                  className="text-xs text-slate-400 hover:text-slate-200 underline cursor-pointer mt-2"
                >
                  Dismiss
                </button>
              </div>
            )}

            {feedError && (
              <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-5 py-4 text-sm text-red-400 mb-6">
                ⚠️ {feedError}
              </div>
            )}

            {/* Permanent Join Organization Inline Form */}
            {showOrgActionForm === "join" && (
              <div className="mb-6 p-5 rounded-2xl bg-[#181818] border border-white/5 animate-fade-in">
                <h3 className="font-semibold text-slate-200 mb-4">Have an invite code?</h3>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={joinInviteCode}
                    onChange={(e) => dispatch({ type: 'SET_INPUT', field: 'joinInviteCode', value: e.target.value })}
                    placeholder="Paste invite code here"
                    className="flex-1 rounded-xl bg-[#232323] border border-white/10 text-slate-100 px-4 py-2 text-sm focus:outline-none focus:border-[#7CB8F2]"
                  />
                  <button
                    onClick={handleJoinOrg}
                    disabled={orgActionStatus === "loading" || !joinInviteCode.trim()}
                    className="sm:w-32 py-2.5 rounded-xl text-sm font-bold bg-[#232323] border border-white/15 hover:border-white/30 text-white disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {orgActionStatus === "loading" ? "Joining..." : "Join Organization"}
                  </button>
                </div>
              </div>
            )}

            {/* Permanent Create Organization Inline Form */}
            {showOrgActionForm === "create" && (
              <div className="mb-6 p-5 rounded-2xl bg-[#181818] border border-white/5 animate-fade-in">
                <h3 className="font-semibold text-slate-200 mb-4">Create a New Organization</h3>
                <div className="flex gap-3 flex-col sm:flex-row">
                  <input
                    type="text"
                    value={createOrgName}
                    onChange={(e) => dispatch({ type: 'SET_INPUT', field: 'createOrgName', value: e.target.value })}
                    placeholder="e.g. Acme Corp Security Team"
                    className="flex-1 rounded-xl bg-[#232323] border border-white/10 text-slate-100 px-4 py-2 text-sm focus:outline-none focus:border-[#7CB8F2]"
                  />
                  <button
                    onClick={handleCreateOrg}
                    disabled={orgActionStatus === "loading" || !createOrgName.trim()}
                    className="sm:w-32 py-2.5 rounded-xl text-sm font-bold bg-[#31487A] hover:bg-[#7CB8F2] hover:text-[#0f172a] text-white disabled:opacity-50 transition-colors cursor-pointer"
                  >
                    {orgActionStatus === "loading" ? "Creating..." : "Create Organization"}
                  </button>
                </div>
              </div>
            )}

            {organizations.length === 0 && !orgsLoading ? (
              <div className="rounded-3xl border border-black/10 bg-[#232323] text-white p-6 sm:p-8 shadow-2xl mb-8 space-y-8 text-center animate-fade-in">
                <h2 className="text-xl font-bold text-slate-100 mb-2">Welcome to Scam Radar</h2>
                <p className="text-sm text-slate-400">You are not in any organizations yet. Use the buttons above to join a circle or create your own to start sharing reports with your community.</p>
              </div>
            ) : (

            <div className="space-y-4">
              {feedReports.length === 0 && !feedLoading ? (
                <div className="text-center py-12 border border-dashed border-black/15 bg-[#232323] rounded-3xl text-white">
                  <p className="text-slate-300 text-sm">No reports in this circle yet.</p>
                </div>
              ) : (
                feedReports.map((report) => (
                  <div key={report.id} className="rounded-3xl border border-black/10 bg-[#232323] text-white p-5 flex gap-4 shadow-xl">
                    <div className="flex-shrink-0">
                      <MiniRiskBadge score={report.riskScore} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <p className="text-xs text-slate-400">
                        Reported {new Date(report.timestamp).toLocaleString()}
                      </p>
                      
                      {report.clusterCount > 1 && (
                        <div className="inline-flex items-center gap-1.5 bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1 rounded-md text-[10px] font-bold tracking-wide uppercase">
                          <span>⚠️</span>
                          {report.clusterCount} people in this circle reported similar messages
                        </div>
                      )}
                      
                      <p className="text-sm text-slate-200 line-clamp-3 italic opacity-90 border-l-2 border-[#7CB8F2] pl-2.5">
                        "{report.text}"
                      </p>

                      <div className="bg-[#181818] rounded-xl p-3 text-sm text-slate-300 border border-white/10">
                        {report.explanation}
                      </div>

                      {report.flags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {report.flags.map((flag, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-0.5 rounded bg-white/5 text-slate-300 border border-white/10">
                              {flag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
            )}
              </>
            )}
          </div>
        )}
        </div>

        {/* About Section matching Reference Image */}
        <section id="about-section" className="w-full max-w-5xl mx-auto mt-16 sm:mt-24 mb-12 sm:mb-16 select-none scroll-mt-24 sm:scroll-mt-28">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 items-center">
            {/* Left Column: Text Content */}
            <div className="md:col-span-6 space-y-5 sm:space-y-6">
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111827] tracking-tight font-sans">
                About Aura Mail
              </h2>
              <p className="text-sm sm:text-base md:text-lg text-[#525B6A] leading-relaxed font-normal">
                Aura Mail is an AI-powered platform that analyzes messages and emails to detect potential threats, phishing attempts, and malicious content.
              </p>
              <p className="text-sm sm:text-base md:text-lg text-[#525B6A] leading-relaxed font-normal">
                Our multi-signal analysis engine combines natural language processing and contextual intelligence to deliver accurate risk assessments in real time.
              </p>
            </div>

            {/* Right Column: Illustration Card */}
            <div className="md:col-span-6 flex justify-center">
              <div className="w-full max-w-md bg-white/95 backdrop-blur-md rounded-3xl p-6 sm:p-10 shadow-[0_12px_40px_rgba(0,0,0,0.06)] border border-neutral-100/90 relative overflow-hidden flex items-center justify-center min-h-[300px] sm:min-h-[340px]">
                {/* Dot Matrix Halftone Textures */}
                <div className="absolute top-6 right-6 w-16 h-16 opacity-35 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:10px_10px]" />
                <div className="absolute bottom-6 left-6 w-16 h-16 opacity-35 bg-[radial-gradient(#94a3b8_1.5px,transparent_1.5px)] [background-size:10px_10px]" />

                {/* Center SVG Illustration */}
                <svg
                  className="relative w-60 sm:w-72 h-auto overflow-visible"
                  viewBox="0 0 280 220"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <defs>
                    <filter id="glass-shadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="2" dy="8" stdDeviation="6" floodOpacity="0.18" />
                    </filter>
                    <clipPath id="lens-clip">
                      <circle cx="170" cy="114" r="39" />
                    </clipPath>
                  </defs>

                  {/* Circular Ambient Disc */}
                  <circle cx="140" cy="110" r="86" fill="#F1F3F6" />

                  {/* Envelope Base */}
                  <rect x="25" y="55" width="165" height="105" rx="8" fill="#1E232C" />
                  
                  {/* Envelope Lines */}
                  <path
                    d="M28 58 L108 122 L187 58"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M28 158 L90 108"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M187 158 L125 108"
                    stroke="white"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Animated Magnifying Glass Assembly */}
                  <g className="magnifying-glass-scanner" filter="url(#glass-shadow)">
                    {/* Handle */}
                    <rect
                      x="196"
                      y="140"
                      width="20"
                      height="54"
                      rx="8"
                      transform="rotate(-45 196 140)"
                      fill="#FF5100"
                    />

                    {/* Magnifying Glass Outer Ring & Lens */}
                    <circle
                      cx="170"
                      cy="114"
                      r="44"
                      fill="white"
                      stroke="#FF5100"
                      strokeWidth="9"
                    />

                    {/* Scanned Lines & Micro Laser Sweep Inside Lens */}
                    <g clipPath="url(#lens-clip)">
                      {/* Subtle Laser Scanner Sweep Line */}
                      <g className="scan-laser-line">
                        <line x1="135" y1="114" x2="205" y2="114" stroke="#FF5100" strokeWidth="1.5" strokeDasharray="3 3" />
                      </g>

                      {/* Inspected Content Lines */}
                      <line
                        x1="150"
                        y1="104"
                        x2="190"
                        y2="104"
                        stroke="#4B5563"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="150"
                        y1="114"
                        x2="190"
                        y2="114"
                        stroke="#1E232C"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                      <line
                        x1="150"
                        y1="124"
                        x2="182"
                        y2="124"
                        stroke="#FF5100"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                      />
                    </g>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section matching Reference Image */}
        <section id="features-section" className="w-full max-w-5xl mx-auto mt-10 sm:mt-16 mb-20 select-none scroll-mt-24 sm:scroll-mt-28">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold text-[#111827] text-center mb-10 sm:mb-12 font-sans tracking-tight">
            Features
          </h2>

          {/* Top Row: 3 Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6 mb-5 sm:mb-6">
            {/* Card 1: AI Content Analysis */}
            <div className="bg-[#18191E] border border-white/[0.08] rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center shadow-xl hover:-translate-y-1 transition-transform duration-200">
              <div className="w-14 h-14 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#FF5100]" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Brain Contours with Circuit Dots */}
                  <path d="M18 10C15 10 12 12.5 12 16C10 16.5 8 18.5 8 21.5C8 23.5 9 25 10.5 26C9 27.5 8 29.5 8 32C8 35.5 11 38 14.5 38C15.5 38 16.5 37.5 17.5 37" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M30 10C33 10 36 12.5 36 16C38 16.5 40 18.5 40 21.5C40 23.5 39 25 37.5 26C39 27.5 40 29.5 40 32C40 35.5 37 38 33.5 38C32.5 38 31.5 37.5 30.5 37" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M24 10V38" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                  <path d="M18 18H24M15 26H24M18 32H24" stroke="#FF5100" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M30 18H24M33 26H24M30 32H24" stroke="#FF5100" strokeWidth="2" strokeLinecap="round"/>
                  <circle cx="18" cy="18" r="1.5" fill="#FF5100"/>
                  <circle cx="15" cy="26" r="1.5" fill="#FF5100"/>
                  <circle cx="30" cy="18" r="1.5" fill="#FF5100"/>
                  <circle cx="33" cy="26" r="1.5" fill="#FF5100"/>
                  {/* Sparkles */}
                  <path d="M38 9L39 12L42 13L39 14L38 17L37 14L34 13L37 12L38 9Z" fill="#FF5100"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-5 mb-2.5 tracking-tight">
                AI Content Analysis
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                Analyzes email and message content using advanced AI models.
              </p>
            </div>

            {/* Card 2: Link Safety Check */}
            <div className="bg-[#18191E] border border-white/[0.08] rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center shadow-xl hover:-translate-y-1 transition-transform duration-200">
              <div className="w-14 h-14 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#FF5100]" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Shield */}
                  <path d="M24 7L38 12.5V23C38 31.5 32 39 24 42C16 39 10 31.5 10 23V12.5L24 7Z" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Checkmark */}
                  <path d="M18 24L22.5 28.5L30.5 19.5" stroke="#FF5100" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-5 mb-2.5 tracking-tight">
                Link Safety Check
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                Detects harmful, phishing, and suspicious links in real time.
              </p>
            </div>

            {/* Card 3: Multilingual Support */}
            <div className="bg-[#18191E] border border-white/[0.08] rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center shadow-xl hover:-translate-y-1 transition-transform duration-200">
              <div className="w-14 h-14 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#FF5100]" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Globe circle */}
                  <circle cx="24" cy="24" r="16" stroke="#FF5100" strokeWidth="2.5"/>
                  {/* Latitude / Longitude lines */}
                  <line x1="8" y1="24" x2="40" y2="24" stroke="#FF5100" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 16H36" stroke="#FF5100" strokeWidth="2" strokeLinecap="round"/>
                  <path d="M12 32H36" stroke="#FF5100" strokeWidth="2" strokeLinecap="round"/>
                  <ellipse cx="24" cy="24" rx="8" ry="16" stroke="#FF5100" strokeWidth="2"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-5 mb-2.5 tracking-tight">
                Multilingual Support
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                Supports analysis of messages in multiple languages.
              </p>
            </div>
          </div>

          {/* Bottom Row: 2 Feature Cards Centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6 max-w-3xl mx-auto">
            {/* Card 4: Organization Threat Circles */}
            <div className="bg-[#18191E] border border-white/[0.08] rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center shadow-xl hover:-translate-y-1 transition-transform duration-200">
              <div className="w-14 h-14 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#FF5100]" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Triangle Network Nodes */}
                  <circle cx="24" cy="12" r="4.5" stroke="#FF5100" strokeWidth="2.5"/>
                  <circle cx="13" cy="34" r="4.5" stroke="#FF5100" strokeWidth="2.5"/>
                  <circle cx="35" cy="34" r="4.5" stroke="#FF5100" strokeWidth="2.5"/>
                  <line x1="21.5" y1="16" x2="15.5" y2="30" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="26.5" y1="16" x2="32.5" y2="30" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="17.5" y1="34" x2="30.5" y2="34" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-5 mb-2.5 tracking-tight">
                Organization Threat Circles
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                Maps communication patterns and identifies internal and external risks.
              </p>
            </div>

            {/* Card 5: Auto Complaint Drafting */}
            <div className="bg-[#18191E] border border-white/[0.08] rounded-3xl p-7 sm:p-8 flex flex-col items-center text-center shadow-xl hover:-translate-y-1 transition-transform duration-200">
              <div className="w-14 h-14 flex items-center justify-center">
                <svg className="w-12 h-12 text-[#FF5100]" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                  {/* Document with folded corner */}
                  <path d="M14 9C14 7.89543 14.8954 7 16 7H28L36 15V39C36 40.1046 35.1046 41 34 41H16C14.8954 41 14 40.1046 14 39V9Z" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M28 7V15H36" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  {/* Document lines */}
                  <line x1="20" y1="22" x2="30" y2="22" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="20" y1="28" x2="30" y2="28" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                  <line x1="20" y1="34" x2="27" y2="34" stroke="#FF5100" strokeWidth="2.5" strokeLinecap="round"/>
                </svg>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-white mt-5 mb-2.5 tracking-tight">
                Auto Complaint Drafting
              </h3>
              <p className="text-xs sm:text-sm text-[#9CA3AF] leading-relaxed">
                Generates complaint drafts with all relevant details and evidence.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Auth modal — rendered as an overlay, outside all layout containers */}
      {authModalOpen && (
        <AuthModal onClose={() => setAuthModalOpen(false)} />
      )}
    </div>
  );
}
