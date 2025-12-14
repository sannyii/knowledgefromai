"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useI18n } from "@/lib/i18n/context";
import { Settings, ExternalLink, AlertCircle } from "lucide-react";

interface ApiSetupDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ApiSetupDialog({ open, onOpenChange }: ApiSetupDialogProps) {
    const { t } = useI18n();

    const providers = [
        { name: "Gemini (Google)", url: "https://aistudio.google.com/apikey" },
        { name: "OpenAI", url: "https://platform.openai.com/api-keys" },
        { name: "DeepSeek", url: "https://platform.deepseek.com/api_keys" },
        { name: "Claude (Anthropic)", url: "https://console.anthropic.com/account/keys" },
        { name: "通义千问 (Qwen)", url: "https://dashscope.console.aliyun.com/apiKey" },
        { name: "Kimi (月之暗面)", url: "https://platform.moonshot.cn/console/api-keys" },
        { name: "豆包 (Doubao)", url: "https://console.volcengine.com/ark/region:ark+cn-beijing/apiKey" },
    ];

    return (

        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="w-5 h-5" />
                        {t.settings.setupRequired || "需要配置 API"}
                    </DialogTitle>
                    <DialogDescription>
                        {t.settings.setupDescription ||
                            "检测到尚未配置 AI 服务，请前往设置页面配置 API 密钥以使用知识转化功能。"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <p className="text-sm text-slate-600">
                        {t.settings.getApiKeyHint || "您可以从以下服务商获取 API 密钥："}
                    </p>

                    <div className="grid grid-cols-1 gap-2">
                        {providers.map((provider) => (
                            <a
                                key={provider.name}
                                href={provider.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center justify-between p-2 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-300 transition-colors text-sm"
                            >
                                <span className="text-slate-700">{provider.name}</span>
                                <ExternalLink className="w-4 h-4 text-slate-400" />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        {t.settings.later || "稍后再说"}
                    </Button>
                    <Link href="/settings">
                        <Button className="gap-2">
                            <Settings className="w-4 h-4" />
                            {t.settings.goToSettings || "前往设置"}
                        </Button>
                    </Link>
                </div>
            </DialogContent>
        </Dialog>
    );
}
