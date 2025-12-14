"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, BookOpen, Home as HomeIcon, Library, Settings } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useProcessing } from "@/lib/processing-context";
import { MeteorAnimation } from "@/components/MeteorAnimation";
import { ApiSetupDialog } from "@/components/ApiSetupDialog";

export default function Home() {
  const { t, locale } = useI18n();
  const { processingCount, incrementProcessing, decrementProcessing } = useProcessing();
  const [input, setInput] = useState("");
  const [showMeteor, setShowMeteor] = useState(false);
  const [showApiSetupDialog, setShowApiSetupDialog] = useState(false);
  const [isApiAvailable, setIsApiAvailable] = useState<boolean | null>(null);

  const inputSectionRef = useRef<HTMLElement>(null);
  const knowledgeLinkRef = useRef<HTMLAnchorElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Check API availability on mount (without showing dialog)
  useEffect(() => {
    const checkApiAvailability = async () => {
      try {
        const response = await fetch("/api/ai-config");
        if (response.ok) {
          const data = await response.json();
          const available = data.hasApiKey && data.isValid;
          setIsApiAvailable(available);
        } else {
          setIsApiAvailable(false);
        }
      } catch (error) {
        console.error("Failed to check API availability:", error);
        setIsApiAvailable(false);
      }
    };

    checkApiAvailability();
  }, []);

  // Warn user before leaving page if there are processing tasks
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (processingCount > 0) {
        e.preventDefault();
        // Modern browsers require returnValue to be set
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [processingCount]);


  const handleTransform = () => {
    const textToProcess = input.trim();
    if (!textToProcess || textToProcess.length < 10) return;

    // Check if API is available before proceeding
    if (!isApiAvailable) {
      setShowApiSetupDialog(true);
      return;
    }

    // Clear input immediately so user can continue typing
    setInput("");

    // Show meteor animation
    setShowMeteor(true);

    // Increment processing count
    incrementProcessing();

    // Process API call asynchronously in background
    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: textToProcess,
        locale,
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.error("API Error:", data.error);
          // If API key not configured, show the setup dialog
          if (data.error?.includes("API key") || data.error?.includes("No API")) {
            setShowApiSetupDialog(true);
          }
        }
      })
      .catch((error) => {
        console.error("Failed to process:", error);
      })
      .finally(() => {
        // Decrement processing count when done
        decrementProcessing();
      });
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 text-slate-900 font-sans relative overflow-hidden">
      {/* API Setup Dialog */}
      <ApiSetupDialog open={showApiSetupDialog} onOpenChange={setShowApiSetupDialog} />

      {/* Decorative Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Floating Orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDuration: '6s', animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/5 to-purple-200/5 rounded-full blur-3xl" />
      </div>

      {/* Navbar */}
      <nav className="border-b border-slate-200/50 bg-white/70 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-800 hover:text-blue-600 transition-colors">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>{t.appName}</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm font-medium text-slate-600">
              <Link href="/" className="text-blue-600 font-semibold inline-flex items-center gap-1.5">
                <HomeIcon className="w-4 h-4" />
                <span>{t.nav.home}</span>
              </Link>
              <KnowledgeLinkWithBadge ref={knowledgeLinkRef} />
            </div>
            <div className="flex items-center gap-2">
              <Link href="/settings" className="hover:text-blue-600 transition-colors inline-flex items-center gap-1.5 text-sm font-medium text-slate-600">
                <Settings className="w-4 h-4" />
                <span>{t.settings.title}</span>
              </Link>
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </nav>


      <main className="max-w-4xl mx-auto px-4 py-8 flex flex-col gap-8 relative z-10">

        {/* Hero Section */}
        <section className="text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-100/50 backdrop-blur-sm text-blue-700 rounded-full text-sm font-medium border border-blue-200/50 shadow-sm">
            <Sparkles className="w-4 h-4" />
            <span>{t.home.badge}</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-transparent">
              {t.home.title}
            </span>
            {" "}
            <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent animate-gradient bg-[length:200%_auto]">
              {t.home.titleHighlight}
            </span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            {t.home.subtitle}
          </p>
        </section>

        {/* Input Section */}
        <section
          ref={inputSectionRef}
          className="space-y-4 transition-all duration-500"
        >
          {/* Elegant Textarea Card */}
          <div className="relative group">
            {/* Glow effect on focus */}
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-400 to-purple-400 rounded-2xl opacity-0 group-focus-within:opacity-20 blur transition duration-500" />

            <div className="relative bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200/50 overflow-hidden transition-all duration-300 hover:shadow-2xl group-focus-within:shadow-2xl">
              {/* Top gradient bar */}
              <div className="h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500 bg-[length:200%_auto] animate-gradient" />

              <Textarea
                className="p-6 text-base bg-transparent border-0 focus-visible:ring-0 rounded-none transition-all duration-500 resize-none h-[200px] placeholder:text-slate-400"
                placeholder={t.home.placeholder}
                value={input}
                onChange={(e) => setInput(e.target.value)}
              />

              {/* Character count badge */}
              <div className="absolute bottom-4 right-4">
                <div className="px-3 py-1.5 bg-slate-100/80 backdrop-blur-sm text-xs text-slate-600 rounded-full border border-slate-200/50 font-medium">
                  {input.length} {t.home.characters}
                </div>
              </div>
            </div>
          </div>

          {/* Character count warnings */}
          {input.length > 0 && input.length < 200 && (
            <div className="flex items-start gap-3 p-3 bg-amber-50/80 backdrop-blur-sm border border-amber-200/50 rounded-xl text-sm text-amber-800 animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <span className="text-lg">⚠️</span>
              <span>{t.home.tooShort}</span>
            </div>
          )}
          {input.length > 20000 && (
            <div className="flex items-start gap-3 p-3 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl text-sm text-red-800 animate-in fade-in-0 slide-in-from-top-2 duration-300">
              <span className="text-lg">⚠️</span>
              <span>{t.home.tooLong}</span>
            </div>
          )}

          {/* Transform Button */}
          <div className="flex justify-center pt-4">
            <Button
              ref={buttonRef}
              size="lg"
              onClick={handleTransform}
              disabled={input.length < 10}
              className="relative bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-full px-10 py-6 text-lg font-semibold shadow-2xl shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/40 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 group overflow-hidden"
            >
              {/* Button shine effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

              <Sparkles className="mr-2 h-5 w-5 relative z-10" />
              <span className="relative z-10">{t.home.transformButton}</span>
            </Button>
          </div>
        </section>

        {/* Meteor Animation */}
        {showMeteor && (
          <>
            <MeteorAnimation
              startRef={buttonRef}
              endRef={knowledgeLinkRef}
              onComplete={() => setShowMeteor(false)}
            />
          </>
        )}

      </main>
    </div>
  );
}

// Knowledge Link with Badge Component
const KnowledgeLinkWithBadge = React.forwardRef<HTMLAnchorElement>((props, ref) => {
  const { t } = useI18n();
  const { processingCount } = useProcessing();
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => processingCount > 0 && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <Link
        ref={ref}
        href="/knowledge"
        className="hover:text-blue-600 transition-colors relative inline-flex items-center gap-2"
      >
        <Library className="w-4 h-4" />
        <span>{t.nav.myKnowledge}</span>
        {processingCount > 0 && (
          <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-bold text-white bg-blue-600 rounded-full animate-pulse">
            {processingCount}
          </span>
        )}
      </Link>

      {/* Tooltip */}
      {showTooltip && processingCount > 0 && (
        <div className="absolute top-full right-0 mt-2 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg whitespace-nowrap z-50 animate-in fade-in-0 zoom-in-95 duration-200">
          {t.nav.processingTasks} +{processingCount}
          <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-900 rotate-45"></div>
        </div>
      )}
    </div>
  );
});

KnowledgeLinkWithBadge.displayName = "KnowledgeLinkWithBadge";
