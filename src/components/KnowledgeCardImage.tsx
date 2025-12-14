"use client";

import React, { useRef, useState, useMemo } from "react";
import { Sparkles, Calendar, Download, Share2, Quote, Hash } from "lucide-react";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { useI18n } from "@/lib/i18n/context";
import { cn } from "@/lib/utils";

type KnowledgePoint = {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  tags: string[];
  createdAt: string;
};

interface KnowledgeCardImageProps {
  knowledgePoint: KnowledgePoint;
  onClose?: () => void;
}

// Theme interface
interface Theme {
  background: string;
  text: string;
  textMuted: string;
  accent: string;
  icon: string;
  pattern: string;
}

export function KnowledgeCardImage({ knowledgePoint, onClose }: KnowledgeCardImageProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  // Generate a random elegant theme on mount
  const [theme] = useState<Theme>(() => {
    const hue = Math.floor(Math.random() * 360);
    // Use rich, slightly darkened colors for elegance and readability (Monochromatic)
    const saturation = 30 + Math.floor(Math.random() * 30); // 30-60%
    const lightness = 15 + Math.floor(Math.random() * 15);  // 15-30%

    // Create a smooth monochromatic gradient
    const colorStart = `hsl(${hue}, ${saturation}%, ${lightness + 10}%)`;
    const colorEnd = `hsl(${hue}, ${saturation}%, ${lightness - 5}%)`;

    return {
      // "圆融" (Rounded/Soft) - using radial/conic or soft linear
      background: `linear-gradient(135deg, ${colorStart} 0%, ${colorEnd} 100%)`,
      text: "text-slate-50",
      textMuted: "text-slate-300/80",
      accent: "bg-white/10 border-white/10",
      icon: `hsl(${hue}, ${saturation + 20}%, ${lightness + 40}%)`, // Lighter version for icons
      // Subtle organic pattern
      pattern: "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.07) 0%, transparent 50%)"
    };
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}/${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`;
  };

  /**
   * Generates the High-Resolution Long Image Blob
   * Uses an iframe to isolate styles and ensure perfect layout for capture
   */
  const generateCardImageBlob = async (): Promise<Blob | null> => {
    // 1. Setup Iframe
    const frameWidth = 600; // Fixed width for high-quality export
    const iframe = document.createElement('iframe');
    Object.assign(iframe.style, {
      position: 'fixed',
      left: '-9999px',
      top: '-9999px',
      width: `${frameWidth}px`,
      height: '100vh', // Initial height
      border: 'none',
      zIndex: '-1'
    });
    document.body.appendChild(iframe);

    try {
      const doc = iframe.contentDocument;
      if (!doc) throw new Error("Iframe document not found");

      // 2. Inject Styles (Reset + Font + Layout)
      // We use inline styles heavily to ensure html2canvas captures exactly what we want
      // All random themes are dark mode now
      const textColor = '#f8fafc';
      const mutedColor = 'rgba(248, 250, 252, 0.6)';
      const accentBg = 'rgba(255, 255, 255, 0.1)';
      const accentBorder = 'rgba(255, 255, 255, 0.2)';

      doc.body.innerHTML = `
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700&family=Noto+Serif+SC:wght@700&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            font-family: "Noto Sans SC", -apple-system, sans-serif;
            width: ${frameWidth}px;
            background: transparent;
            -webkit-font-smoothing: antialiased;
          }
          .card {
            background: ${theme.background};
            position: relative;
            overflow: hidden;
            padding: 48px;
            display: flex;
            flex-direction: column;
            gap: 32px;
          }
          .card::before {
            content: "";
            position: absolute;
            inset: 0;
            background: ${theme.pattern};
            pointer-events: none;
            mix-blend-mode: overlay;
          }
          /* Noise Texture */
          .noise {
            position: absolute;
            inset: 0;
            opacity: 0.05;
            background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
            pointer-events: none;
          }
          .header { display: flex; flex-direction: column; gap: 16px; position: relative; z-index: 10; }
          .tags { display: flex; flex-wrap: wrap; gap: 8px; }
          .tag {
            padding: 4px 12px;
            font-size: 12px;
            border-radius: 99px;
            background: ${accentBg};
            color: ${textColor};
            border: 1px solid ${accentBorder};
            font-weight: 500;
          }
          .date { font-size: 13px; color: ${mutedColor}; display: flex; align-items: center; gap: 6px; font-family: monospace; letter-spacing: 0.05em; }
          .title {
            font-family: "Noto Serif SC", serif;
            font-size: 36px;
            line-height: 1.3;
            font-weight: 700;
            color: ${textColor};
            text-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .divider { height: 1px; width: 60px; background: ${mutedColor}; opacity: 0.5; margin: 8px 0; }
          
          .summary-box {
            position: relative;
            z-index: 10;
          }
          .summary {
            font-size: 18px;
            line-height: 1.7;
            color: ${textColor};
            opacity: 0.95;
            text-align: justify;
          }
          
          .key-points {
            display: flex;
            flex-direction: column;
            gap: 16px;
            position: relative;
            z-index: 10;
            background: ${accentBg};
            padding: 24px;
            border-radius: 12px;
            border: 1px solid ${accentBorder};
          }
          .kp-label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            color: ${mutedColor};
            font-weight: 700;
            margin-bottom: 8px;
          }
          .kp-item { display: flex; gap: 12px; align-items: start; }
          .kp-icon {
            margin-top: 4px;
            width: 6px;
            height: 6px;
            border-radius: 50%;
            background: ${theme.icon};
            box-shadow: 0 0 8px ${theme.icon};
            flex-shrink: 0;
          }
          .kp-text { color: ${textColor}; font-size: 15px; line-height: 1.6; opacity: 0.9; }
          

        </style>

        <div class="card">
          <div class="noise"></div>
          
          <div class="header">
            ${knowledgePoint.tags?.length > 0 ? `
              <div class="tags">
                ${knowledgePoint.tags.slice(0, 4).map(t => `<span class="tag">#${t}</span>`).join('')}
              </div>
            ` : ''}
            <div class="date">
              <span>CARDID-${knowledgePoint.id.slice(0, 6).toUpperCase()}</span>
              <span>•</span>
              <span>${formatDate(knowledgePoint.createdAt)}</span>
            </div>
            <h1 class="title">${knowledgePoint.title || t.knowledge.unnamed}</h1>
            <div class="divider"></div>
          </div>

          <div class="summary-box">
            <p class="summary">${knowledgePoint.summary}</p>
          </div>

          ${knowledgePoint.keyPoints?.length > 0 ? `
            <div class="key-points">
              <div class="kp-label">${t.knowledge.keyPoints || "KEY POINTS"}</div>
              ${knowledgePoint.keyPoints.slice(0, 6).map(kp => `
                <div class="kp-item">
                  <div class="kp-icon"></div>
                  <div class="kp-text">${kp}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}


        </div>
      `;

      // 3. Wait for Resources & Render
      // A small delay ensures fonts and DOM settle
      await new Promise(resolve => setTimeout(resolve, 300));

      const cardEl = doc.querySelector('.card') as HTMLElement;

      const canvas = await html2canvas(cardEl, {
        backgroundColor: null,
        scale: 3, // High resolution (3x)
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: frameWidth,
        windowWidth: frameWidth,
        // height: cardEl.scrollHeight // Auto height
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => resolve(blob), "image/png", 1.0);
      });

    } catch (e) {
      console.error("Export failed", e);
      return null;
    } finally {
      document.body.removeChild(iframe);
    }
  };

  const handleAction = async (action: 'download' | 'share') => {
    const setLoader = action === 'download' ? setIsDownloading : setIsSharing;
    setLoader(true);

    try {
      const blob = await generateCardImageBlob();
      if (!blob) throw new Error("Blob generation failed");

      const filename = `${(knowledgePoint.title || "card").slice(0, 20)}-${Date.now()}.png`;
      const file = new File([blob], filename, { type: "image/png" });

      if (action === 'share' && navigator.canShare?.({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: knowledgePoint.title,
          text: knowledgePoint.summary
        });
      } else {
        // Default to download for both if share unavailable, or copy for share fallback? 
        // User asked for "Download as PNG", so for download action we trigger download.
        if (action === 'download') {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          setTimeout(() => URL.revokeObjectURL(url), 1000);
        } else {
          // Share fallback -> Clipboard
          await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
          alert(t.knowledge.copiedToClipboard || "Copied to clipboard");
        }
      }
    } catch (error) {
      console.error(error);
      alert(t.knowledge.downloadFailed || "Action failed");
    } finally {
      setLoader(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-8 w-full">
      {/* 
        PREVIEW CARD 
        Uses Tailwind classes directly but mimics the Iframe style layout
        to ensure user sees what they will get (mostly) 
      */}
      <div
        ref={cardRef}
        className={cn(
          "relative w-full max-w-[420px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-500",
          "flex flex-col select-none"
        )}
        style={{
          background: theme.background
        }}
      >
        {/* Pattern Overlay */}
        <div
          className="absolute inset-0 opacity-100 pointer-events-none mix-blend-overlay"
          style={{ backgroundImage: theme.pattern }}
        />

        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-[0.05] pointer-events-none mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`
          }}
        />

        <div className={cn("relative z-10 p-8 md:p-10 flex flex-col gap-6 h-full", theme.text)}>

          {/* Header */}
          <div className="flex flex-col gap-4">
            {knowledgePoint.tags && knowledgePoint.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {knowledgePoint.tags.slice(0, 3).map((tag, i) => (
                  <span key={i} className={cn(
                    "px-3 py-1 text-[11px] uppercase tracking-wider font-semibold rounded-full border border-current opacity-70",
                    theme.accent
                  )}>
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            <div className={cn("flex items-center gap-2 text-xs font-mono opacity-60 uppercase tracking-widest", theme.textMuted)}>
              <Calendar className="w-3 h-3" />
              <span>{formatDate(knowledgePoint.createdAt)}</span>
              <span className="mx-1">•</span>
              <span>ID: {knowledgePoint.id.slice(0, 4)}</span>
            </div>

            <h1 className="text-3xl font-serif font-bold leading-tight tracking-tight">
              {knowledgePoint.title || t.knowledge.unnamed}
            </h1>

            <div className={cn("h-px w-20 opacity-40 my-1", theme.text === 'text-slate-100' ? 'bg-white' : 'bg-black')} />
          </div>

          {/* Body */}
          <div className="flex-1">
            <div className="relative">
              <Quote className={cn("absolute -left-1 -top-2 w-8 h-8 opacity-10", theme.text)} />
              <p className="text-lg leading-relaxed opacity-95 relative z-10 font-medium">
                {knowledgePoint.summary}
              </p>
            </div>
          </div>

          {/* Key Points */}
          {knowledgePoint.keyPoints && knowledgePoint.keyPoints.length > 0 && (
            <div className={cn(
              "rounded-xl p-6 border backdrop-blur-sm",
              theme.accent
            )}>
              <div className="flex items-center gap-2 mb-4 opacity-70">
                <Sparkles className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-widest">{t.knowledge.keyPoints || "KEY POINTS"}</span>
              </div>
              <div className="space-y-4">
                {knowledgePoint.keyPoints.slice(0, 5).map((point, i) => (
                  <div key={i} className="flex gap-3 items-start group">
                    <div className="mt-2 w-1.5 h-1.5 rounded-full shrink-0 transition-transform group-hover:scale-150"
                      style={{ backgroundColor: theme.icon }} />
                    <p className="text-sm leading-relaxed opacity-90">{point}</p>
                  </div>
                ))}
              </div>
            </div>
          )}



        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-4 w-full max-w-[420px]">
        <Button
          onClick={() => handleAction('download')}
          disabled={isDownloading}
          className="flex-1 h-12 rounded-xl bg-white text-slate-900 border-slate-200 hover:bg-slate-50 hover:border-slate-300 shadow-sm transition-all"
          variant="outline"
        >
          {isDownloading ? (
            <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin mr-2" />
          ) : (
            <Download className="w-4 h-4 mr-2" />
          )}
          {t.knowledge.download}
        </Button>
        <Button
          onClick={() => handleAction('share')}
          disabled={isSharing}
          className="flex-1 h-12 rounded-xl bg-slate-900 text-white hover:bg-slate-800 shadow-lg shadow-slate-900/10 transition-all"
        >
          {isSharing ? (
            <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
          ) : (
            <Share2 className="w-4 h-4 mr-2" />
          )}
          {t.knowledge.share}
        </Button>
      </div>
    </div>
  );
}
