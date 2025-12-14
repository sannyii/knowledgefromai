"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Globe, Check, ChevronDown } from "lucide-react";

const languages = [
  { code: "zh" as const, label: "中文", flag: "🇨🇳" },
  { code: "en" as const, label: "English", flag: "🇺🇸" },
];

export function LanguageSwitcher() {
  const { locale, setLocale } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 0 });

  const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

  // Handle mounting for Portal
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Calculate dropdown position when opened
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right
      });
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (langCode: typeof locale) => {
    console.log('Language selected:', langCode);
    setLocale(langCode);
    setIsOpen(false);
  };

  const handleToggle = () => {
    console.log('Toggle clicked, current isOpen:', isOpen);
    setIsOpen(!isOpen);
  };

  const dropdown = isOpen && isMounted ? (
    <div
      ref={dropdownRef}
      className="fixed w-40 bg-white rounded-lg shadow-2xl border border-slate-200 py-1 z-[99999]"
      style={{
        top: `${dropdownPosition.top}px`,
        right: `${dropdownPosition.right}px`,
      }}
    >
      {languages.map((lang) => (
        <button
          key={lang.code}
          onClick={() => handleSelect(lang.code)}
          className={`w-full flex items-center gap-3 px-4 py-2 text-sm hover:bg-slate-50 transition-colors ${locale === lang.code ? "bg-blue-50 text-blue-600" : "text-slate-700"
            }`}
        >
          <span className="text-lg">{lang.flag}</span>
          <span className="flex-1 text-left">{lang.label}</span>
          {locale === lang.code && (
            <Check className="w-4 h-4 text-blue-600" />
          )}
        </button>
      ))}
    </div>
  ) : null;

  return (
    <>
      <div className="relative">
        <Button
          ref={buttonRef}
          variant="ghost"
          size="sm"
          onClick={handleToggle}
          className="gap-2 text-slate-600 hover:text-blue-600"
        >
          <Globe className="w-4 h-4" />
          <span className="text-sm font-medium">{currentLanguage.label}</span>
          <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </Button>
      </div>
      {isMounted && dropdown && createPortal(dropdown, document.body)}
    </>
  );
}
