"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAIConfig, AIProvider, AI_PROVIDERS } from "@/lib/ai-config";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { KnowledgeLinkWithBadge } from "@/components/KnowledgeLinkWithBadge";
import { BookOpen, ArrowLeft, Check, Home as HomeIcon, X, Loader2 } from "lucide-react";

type ValidationStatus = "idle" | "validating" | "success" | "error";

export default function SettingsPage() {
  const { t } = useI18n();
  const { config, setConfig, getAvailableModels } = useAIConfig();
  // Local state for form inputs (not saved until user clicks save)
  const [localProvider, setLocalProvider] = useState<AIProvider>(config.provider || "gemini");
  const [localModel, setLocalModel] = useState<string>(config.model || "gemini-1.5-flash");
  const [apiKey, setApiKey] = useState(config.apiKey || "");
  const [saved, setSaved] = useState(false);
  const [validationStatus, setValidationStatus] = useState<ValidationStatus>("idle");
  const [saveError, setSaveError] = useState<string>("");
  const [isLoadingDefaults, setIsLoadingDefaults] = useState(true);

  // Load configuration from database on mount
  useEffect(() => {
    const loadConfig = async () => {
      try {
        // Load from database only - no environment variable fallback
        const response = await fetch("/api/ai-config");
        if (response.ok) {
          const data = await response.json();
          if (data.provider) {
            setLocalProvider(data.provider);
          }
          if (data.model) {
            setLocalModel(data.model);
          }
          // If database config has a valid API key, mark as validated
          if (data.hasApiKey && data.isValid) {
            setValidationStatus("success");
          }
        }
      } catch (error) {
        console.error("Failed to load configuration:", error);
      } finally {
        setIsLoadingDefaults(false);
      }
    };

    loadConfig();
  }, []); // Only run on mount


  // Sync local state with config when config changes externally (e.g., from another tab or after save)
  // But don't interfere with user's current editing
  useEffect(() => {
    if (!isLoadingDefaults) {
      // Only update if the values are actually different to avoid unnecessary re-renders
      setLocalProvider(prev => config.provider && config.provider !== prev ? config.provider : prev);
      setLocalModel(prev => config.model && config.model !== prev ? config.model : prev);
      setApiKey(prev => config.apiKey !== undefined && config.apiKey !== prev ? config.apiKey : prev);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.provider, config.model, config.apiKey, isLoadingDefaults]);

  const availableModels = getAvailableModels(localProvider);

  const handleProviderChange = async (provider: AIProvider) => {
    const models = getAvailableModels(provider);
    const newModel = models[0]?.id || "";
    setLocalProvider(provider);
    setLocalModel(newModel);
    // Reset validation status when provider changes
    setValidationStatus("idle");
    setSaveError("");

    // Load default API key for the new provider from environment variables
    // Only if current API key is empty or matches the saved config (meaning it's from env/default)
    const currentApiKeyIsFromConfig = !apiKey || apiKey === config.apiKey;
    if (currentApiKeyIsFromConfig) {
      try {
        const response = await fetch(`/api/default-api-key?provider=${provider}`);
        if (response.ok) {
          const data = await response.json();
          if (data.apiKey) {
            setApiKey(data.apiKey);
          }
          // Also update model if available from env
          if (data.model) {
            setLocalModel(data.model);
          }
        } else {
          // If no default API key found, clear the field
          setApiKey("");
        }
      } catch (error) {
        console.error("Failed to load default API key:", error);
        // On error, clear the field
        setApiKey("");
      }
    }
  };

  const handleModelChange = (model: string) => {
    setLocalModel(model);
    // Reset validation status when model changes
    setValidationStatus("idle");
    setSaveError("");
  };

  const handleValidate = async () => {
    const keyToValidate = apiKey.trim();

    if (!keyToValidate) {
      setValidationStatus("error");
      setSaveError(t.settings.validateFailed || "验证失败：请先输入API密钥");
      return;
    }

    setValidationStatus("validating");
    setSaveError("");

    try {
      const response = await fetch("/api/validate-api-key", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: localProvider,
          apiKey: keyToValidate,
          model: localModel,
        }),
      });

      const data = await response.json();

      if (data.valid) {
        setValidationStatus("success");
        setSaveError("");
      } else {
        setValidationStatus("error");
        setSaveError(t.settings.validateFailed || "验证失败");
      }
    } catch (error) {
      console.error("Validation error:", error);
      setValidationStatus("error");
      setSaveError(t.settings.validateError || "验证出错");
    }
  };

  const handleSave = async () => {
    const keyToSave = apiKey.trim();

    // If API key is provided, validate it first
    if (keyToSave) {
      if (validationStatus !== "success") {
        setSaveError(t.settings.saveError || "保存失败：请先验证API密钥");
        return;
      }
    }

    // Check if provider and model are valid
    if (!localProvider || !localModel) {
      setSaveError("请选择服务提供商和模型");
      return;
    }

    try {
      // Save to database via API
      const response = await fetch("/api/ai-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          provider: localProvider,
          model: localModel,
          apiKey: keyToSave || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save");
      }

      // Also update context for client-side usage
      setConfig({
        provider: localProvider,
        model: localModel,
        apiKey: keyToSave || undefined,
      });

      setSaved(true);
      setSaveError("");
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error("Save error:", error);
      setSaveError(t.settings.saveError || "保存失败");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="border-b bg-white/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-800 hover:text-blue-600 transition-colors">
            <BookOpen className="w-6 h-6 text-blue-600" />
            <span>{t.appName}</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="flex gap-4 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-blue-600 transition-colors inline-flex items-center gap-1.5">
                <HomeIcon className="w-4 h-4" />
                <span>{t.nav.home}</span>
              </Link>
              <KnowledgeLinkWithBadge />
            </div>
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-blue-600 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t.settings.back || "返回"}</span>
        </Link>

        {/* Settings Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{t.settings.title}</CardTitle>
            <CardDescription>{t.settings.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Provider Selection */}
            <div className="space-y-2">
              <Label htmlFor="provider" className="text-base font-medium">
                {t.settings.provider}
              </Label>
              <Select
                value={localProvider}
                onValueChange={(value) => handleProviderChange(value as AIProvider)}
              >
                <SelectTrigger id="provider" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                    <SelectItem key={key} value={key}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Model Selection */}
            <div className="space-y-2">
              <Label htmlFor="model" className="text-base font-medium">
                {t.settings.model}
              </Label>
              <Select
                value={localModel}
                onValueChange={handleModelChange}
              >
                <SelectTrigger id="model" className="h-11">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model) => (
                    <SelectItem key={model.id} value={model.id}>
                      {model.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API Key Input */}
            <div className="space-y-2">
              <Label htmlFor="apiKey" className="text-base font-medium">
                {t.settings.apiKey}
              </Label>
              <div className="flex gap-2">
                <Input
                  id="apiKey"
                  type="password"
                  placeholder={t.settings.apiKeyPlaceholder}
                  value={apiKey}
                  onChange={(e) => {
                    setApiKey(e.target.value);
                    // Reset validation status when user types
                    if (validationStatus !== "idle") {
                      setValidationStatus("idle");
                    }
                    setSaveError("");
                  }}
                  className="h-11 flex-1"
                />
                <Button
                  onClick={handleValidate}
                  variant="outline"
                  className="h-11 min-w-[100px]"
                  disabled={validationStatus === "validating"}
                >
                  {validationStatus === "validating" ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.settings.validating || "验证中..."}
                    </>
                  ) : (
                    t.settings.validate || "验证"
                  )}
                </Button>
              </div>

              {/* Validation Status Indicator */}
              {validationStatus === "success" && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="w-4 h-4" />
                  <span>{t.settings.validateSuccess || "验证成功"}</span>
                </div>
              )}
              {validationStatus === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-600">
                  <X className="w-4 h-4" />
                  <span>{saveError || (t.settings.validateFailed || "验证失败")}</span>
                </div>
              )}

              {/* Privacy Notice */}
              <p className="text-xs text-slate-500 mt-1">
                {t.settings.apiKeyHint}
              </p>
              <p className="text-xs text-amber-600 mt-1 font-medium">
                {t.settings.apiKeyPrivacy}
              </p>
            </div>

            {/* Error Message */}
            {saveError && validationStatus !== "error" && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-3 rounded-md">
                <X className="w-4 h-4" />
                <span>{saveError}</span>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                onClick={handleSave}
                className="min-w-[100px]"
                disabled={saved}
              >
                {saved ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    {t.settings.saveSuccess || "已保存"}
                  </>
                ) : (
                  t.settings.save
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

