"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, BookOpen } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { useProcessing } from "@/lib/processing-context";
import { MeteorAnimation } from "@/components/MeteorAnimation";

export default function Home() {
  const { t, locale } = useI18n();
  const { incrementProcessing, decrementProcessing } = useProcessing();
  const [input, setInput] = useState("");
  const [showMeteor, setShowMeteor] = useState(false);

  const inputSectionRef = useRef<HTMLElement>(null);
  const knowledgeLinkRef = useRef<HTMLAnchorElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleTransform = () => {
    const textToProcess = input.trim();
    if (!textToProcess || textToProcess.length < 10) return;

    // Clear input immediately so user can continue typing
    setInput("");

    // Show meteor animation
    setShowMeteor(true);

    // Increment processing count
    incrementProcessing();

    // Hide meteor animation after animation completes
    // 总时长：旋转800ms + 飞行1500ms + 延迟960ms + 旋转600ms + 渐隐400ms = 约4.3秒
    setTimeout(() => {
      setShowMeteor(false);
    }, 4300);

    // Process API call asynchronously in background - completely independent task
    // API key will be read from environment variables on server side
    fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: textToProcess,
        locale,
        // provider and model will use environment variables if not provided
      }),
    })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          console.error("API Error:", data.error);
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
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar Placeholder */}
      <nav className="border-b bg-white/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-800 hover:text-blue-600 transition-colors">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>{t.appName}</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm font-medium text-slate-600">
              <Link href="/" className="text-blue-600 font-semibold">{t.nav.home}</Link>
              <KnowledgeLinkWithBadge ref={knowledgeLinkRef} />
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12 flex flex-col gap-12">

        {/* Hero Section */}
        <section className="text-center space-y-4">
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900">
            {t.home.title} <span className="text-blue-600">{t.home.titleHighlight}</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-xl mx-auto">
            {t.home.subtitle}
          </p>
        </section>

        {/* Input Section */}
        <section
          ref={inputSectionRef}
          className="space-y-4 transition-all duration-500"
        >
          <div className="relative">
            <Textarea
              className="p-6 text-lg shadow-sm border-slate-200 focus-visible:ring-blue-500 rounded-xl transition-all duration-500 overflow-y-auto resize-none h-[240px]"
              placeholder={t.home.placeholder}
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <div className="absolute bottom-4 right-4 text-xs text-slate-400 pointer-events-none">
              {input.length} {t.home.characters}
            </div>
          </div>

          {/* Character count warnings */}
          {input.length > 0 && input.length < 200 && (
            <div className="text-sm text-yellow-600 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{t.home.tooShort}</span>
            </div>
          )}
          {input.length > 20000 && (
            <div className="text-sm text-red-600 flex items-start gap-2">
              <span className="mt-0.5">⚠️</span>
              <span>{t.home.tooLong}</span>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              ref={buttonRef}
              size="lg"
              onClick={handleTransform}
              disabled={input.length < 10}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-full px-8 shadow-lg shadow-blue-200 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {t.home.transformButton}
            </Button>
          </div>
        </section>

        {/* Meteor Animation */}
        {showMeteor && (
          <>
            <MeteorAnimation
              startRef={buttonRef}
              endRef={knowledgeLinkRef}
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
