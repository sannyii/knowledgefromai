import { NextRequest, NextResponse } from "next/server";
import { getDefaultApiKey, getDefaultModel, getDefaultProvider } from "@/lib/ai-service";
import { AIProvider } from "@/lib/ai-config";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider") as AIProvider | null;

    // If provider is specified, return its API key
    if (provider) {
      const apiKey = getDefaultApiKey(provider);
      const model = getDefaultModel(provider);
      return NextResponse.json({
        apiKey: apiKey || null,
        model: model || null,
        provider,
      });
    }

    // Otherwise, return default provider's API key
    const defaultProvider = getDefaultProvider() || "gemini";
    const apiKey = getDefaultApiKey(defaultProvider);
    const model = getDefaultModel(defaultProvider);

    return NextResponse.json({
      apiKey: apiKey || null,
      model: model || null,
      provider: defaultProvider,
    });
  } catch (error) {
    console.error("Error fetching default API key:", error);
    return NextResponse.json(
      { error: "Failed to fetch default API key" },
      { status: 500 }
    );
  }
}

