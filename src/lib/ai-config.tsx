"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type AIProvider = "gemini" | "openai" | "deepseek" | "qwen" | "anthropic";

export interface ModelConfig {
  id: string;
  name: string;
  provider: AIProvider;
}

export const AI_PROVIDERS: Record<AIProvider, { name: string; models: ModelConfig[] }> = {
  gemini: {
    name: "Gemini (Google)",
    models: [
      { id: "models/gemini-3-pro-preview", name: "Gemini 3 Pro Preview", provider: "gemini" },
      { id: "gemini-1.5-flash", name: "Gemini 1.5 Flash", provider: "gemini" },
      { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", provider: "gemini" },
    ],
  },
  openai: {
    name: "OpenAI",
    models: [
      { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
      { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
      { id: "gpt-4-turbo", name: "GPT-4 Turbo", provider: "openai" },
      { id: "gpt-3.5-turbo", name: "GPT-3.5 Turbo", provider: "openai" },
    ],
  },
  deepseek: {
    name: "DeepSeek",
    models: [
      { id: "deepseek-chat", name: "DeepSeek Chat", provider: "deepseek" },
      { id: "deepseek-coder", name: "DeepSeek Coder", provider: "deepseek" },
    ],
  },
  qwen: {
    name: "通义千问 (Qwen)",
    models: [
      { id: "qwen-turbo", name: "Qwen Turbo", provider: "qwen" },
      { id: "qwen-plus", name: "Qwen Plus", provider: "qwen" },
      { id: "qwen-max", name: "Qwen Max", provider: "qwen" },
    ],
  },
  anthropic: {
    name: "Claude (Anthropic)",
    models: [
      { id: "claude-3-5-sonnet-20241022", name: "Claude 3.5 Sonnet", provider: "anthropic" },
      { id: "claude-3-opus-20240229", name: "Claude 3 Opus", provider: "anthropic" },
      { id: "claude-3-sonnet-20240229", name: "Claude 3 Sonnet", provider: "anthropic" },
    ],
  },
};

export interface AIConfig {
  provider: AIProvider;
  model: string;
  apiKey?: string;
}

interface AIConfigContextType {
  config: AIConfig;
  setConfig: (config: AIConfig) => void;
  getAvailableModels: (provider: AIProvider) => ModelConfig[];
}

const AIConfigContext = createContext<AIConfigContextType | undefined>(undefined);

const defaultConfig: AIConfig = {
  provider: "gemini",
  model: "gemini-1.5-flash",
};

export function AIConfigProvider({ children }: { children: ReactNode }) {
  // Only use environment variables, no localStorage or user settings
  const [config] = useState<AIConfig>(() => {
    // Get default provider and model from environment variables
    // This will be fetched from server-side API if needed
    return defaultConfig;
  });

  // setConfig is kept for API compatibility but does nothing
  const setConfig = (_newConfig: AIConfig) => {
    // No-op: settings are disabled, only use environment variables
    console.warn("Settings are disabled. Using environment variables only.");
  };

  const getAvailableModels = (provider: AIProvider): ModelConfig[] => {
    return AI_PROVIDERS[provider]?.models || [];
  };

  return (
    <AIConfigContext.Provider value={{ config, setConfig, getAvailableModels }}>
      {children}
    </AIConfigContext.Provider>
  );
}

export function useAIConfig() {
  const context = useContext(AIConfigContext);
  if (context === undefined) {
    throw new Error("useAIConfig must be used within an AIConfigProvider");
  }
  return context;
}

