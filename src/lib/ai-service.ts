import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, AIConfig } from "./ai-config";

// Valid Gemini models (without "models/" prefix for SDK usage)
// These should match the models in ai-config.tsx
const VALID_GEMINI_MODELS = [
  "gemini-3-pro-preview",  // from "models/gemini-3-pro-preview"
  "gemini-1.5-flash",
  "gemini-1.5-pro",
];

/**
 * Validates and normalizes Gemini model name
 * Google Generative AI SDK requires model names WITHOUT "models/" prefix
 * Removes "models/" or "gmodels/" prefixes and validates against known models
 */
function normalizeGeminiModel(model: string): string {
  // Remove "models/" or "gmodels/" prefix if present
  // SDK expects just the model name like "gemini-3-pro-preview" or "gemini-1.5-flash"
  let normalized = model.replace(/^(models|gmodels)\//, "");
  
  // Check if normalized model matches a valid model
  if (VALID_GEMINI_MODELS.includes(normalized)) {
    return normalized; // Return without "models/" prefix for SDK
  }
  
  // If invalid, return default model
  console.warn(`Invalid Gemini model "${model}", using default "gemini-1.5-flash"`);
  return "gemini-1.5-flash";
}

export async function validateAPIKey(
  provider: AIProvider,
  apiKey: string,
  model: string
): Promise<boolean> {
  try {
    const testPrompt = "test";
    switch (provider) {
      case "gemini":
        const normalizedModel = normalizeGeminiModel(model);
        const genAI = new GoogleGenerativeAI(apiKey);
        const aiModel = genAI.getGenerativeModel({ model: normalizedModel });
        await aiModel.generateContent(testPrompt);
        return true;
      case "openai":
        const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 5,
          }),
        });
        return openaiResponse.ok;
      case "deepseek":
        const deepseekResponse = await fetch("https://api.deepseek.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            messages: [{ role: "user", content: testPrompt }],
            max_tokens: 5,
          }),
        });
        return deepseekResponse.ok;
      case "qwen":
        const qwenResponse = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            input: {
              messages: [{ role: "user", content: testPrompt }],
            },
            parameters: {
              max_tokens: 5,
            },
          }),
        });
        return qwenResponse.ok;
      case "anthropic":
        const anthropicResponse = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
          },
          body: JSON.stringify({
            model,
            max_tokens: 5,
            messages: [{ role: "user", content: testPrompt }],
          }),
        });
        return anthropicResponse.ok;
      default:
        return false;
    }
  } catch (error) {
    console.error("API key validation error:", error);
    return false;
  }
}

export async function callAIService(
  prompt: string,
  config: AIConfig
): Promise<string> {
  const apiKey = config.apiKey || getDefaultApiKey(config.provider);

  if (!apiKey) {
    throw new Error(
      `API key is not configured for ${config.provider}. Please set it in settings or environment variables.`
    );
  }

  switch (config.provider) {
    case "gemini":
      return callGemini(prompt, apiKey, config.model);
    case "openai":
      return callOpenAI(prompt, apiKey, config.model);
    case "deepseek":
      return callDeepSeek(prompt, apiKey, config.model);
    case "qwen":
      return callQwen(prompt, apiKey, config.model);
    case "anthropic":
      return callAnthropic(prompt, apiKey, config.model);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider}`);
  }
}

export function getDefaultApiKey(provider: AIProvider): string | undefined {
  switch (provider) {
    case "gemini":
      return process.env.GEMINI_API_KEY;
    case "openai":
      return process.env.OPENAI_API_KEY;
    case "deepseek":
      return process.env.DEEPSEEK_API_KEY;
    case "qwen":
      return process.env.QWEN_API_KEY;
    case "anthropic":
      return process.env.ANTHROPIC_API_KEY;
    default:
      return undefined;
  }
}

export function getDefaultModel(provider: AIProvider): string | undefined {
  switch (provider) {
    case "gemini":
      const geminiModel = process.env.GEMINI_MODEL;
      return geminiModel ? normalizeGeminiModel(geminiModel) : undefined;
    case "openai":
      return process.env.OPENAI_MODEL;
    case "deepseek":
      return process.env.DEEPSEEK_MODEL;
    case "qwen":
      return process.env.QWEN_MODEL;
    case "anthropic":
      return process.env.ANTHROPIC_MODEL;
    default:
      return undefined;
  }
}

export function getDefaultProvider(): AIProvider | undefined {
  const envProvider = process.env.AI_PROVIDER;
  if (envProvider && ["gemini", "openai", "deepseek", "qwen", "anthropic"].includes(envProvider)) {
    return envProvider as AIProvider;
  }
  return undefined;
}

async function callGemini(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  try {
    // Normalize model name to ensure it's valid
    const normalizedModel = normalizeGeminiModel(model);
    
    console.log(`[Gemini API] Using model: ${normalizedModel}`);
    
    const genAI = new GoogleGenerativeAI(apiKey);
    const aiModel = genAI.getGenerativeModel({ model: normalizedModel });
    
    console.log(`[Gemini API] Calling generateContent...`);
    const result = await aiModel.generateContent(prompt);
    const response = await result.response;
    
    if (!response) {
      throw new Error("No response from Gemini API");
    }
    
    const text = response.text();
    console.log(`[Gemini API] Successfully received response`);
    return text;
  } catch (error: any) {
    console.error(`[Gemini API Error] Model: ${model}, Error:`, error);
    
    // Provide more detailed error information
    if (error?.message?.includes("404")) {
      throw new Error(
        `Gemini model "${model}" not found (404). ` +
        `Please check if the model name is correct. ` +
        `Valid models: ${VALID_GEMINI_MODELS.join(", ")}`
      );
    }
    
    if (error?.message?.includes("403")) {
      throw new Error(
        `Access denied (403) for Gemini model "${model}". ` +
        `Please check your API key permissions.`
      );
    }
    
    // Re-throw with original error message if it's already informative
    throw new Error(
      `Gemini API error: ${error?.message || String(error)}`
    );
  }
}

async function callOpenAI(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function callDeepSeek(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`DeepSeek API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function callQwen(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch("https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: {
        messages: [{ role: "user", content: prompt }],
      },
      parameters: {
        temperature: 0.7,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Qwen API error: ${error.message || response.statusText}`);
  }

  const data = await response.json();
  return data.output?.choices?.[0]?.message?.content || "";
}

async function callAnthropic(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json();
  return data.content?.[0]?.text || "";
}

