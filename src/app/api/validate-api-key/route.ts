import { NextRequest, NextResponse } from "next/server";
import { validateAPIKey } from "@/lib/ai-service";
import { AIProvider } from "@/lib/ai-config";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { provider, apiKey, model } = body;

    if (!provider || !apiKey || !model) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    const isValid = await validateAPIKey(
      provider as AIProvider,
      apiKey,
      model
    );

    return NextResponse.json({ valid: isValid });
  } catch (error) {
    console.error("Validation error:", error);
    return NextResponse.json(
      { error: "Validation failed", valid: false },
      { status: 500 }
    );
  }
}

