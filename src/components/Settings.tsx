"use client";

import Link from "next/link";
import { Settings as SettingsIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function Settings() {
  const { t } = useI18n();

  return (
    <Link href="/settings">
      <Button
        variant="ghost"
        size="sm"
        className="gap-2 text-slate-600 hover:text-blue-600"
      >
        <SettingsIcon className="w-4 h-4" />
        <span className="text-sm font-medium">{t.settings.title}</span>
      </Button>
    </Link>
  );
}

