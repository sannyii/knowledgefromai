"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Library } from "lucide-react";
import { useI18n } from "@/lib/i18n/context";
import { useProcessing } from "@/lib/processing-context";

export const KnowledgeLinkWithBadge = React.forwardRef<HTMLAnchorElement>(
  (props, ref) => {
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
          className="hover:text-blue-600 transition-colors relative inline-flex items-center gap-1.5"
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
  }
);

KnowledgeLinkWithBadge.displayName = "KnowledgeLinkWithBadge";

