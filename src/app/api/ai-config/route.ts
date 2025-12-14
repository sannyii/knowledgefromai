import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateAPIKey } from "@/lib/ai-service";
import { AIProvider } from "@/lib/ai-config";

// GET - Retrieve current AI configuration
export async function GET() {
    try {
        // Get config from database only - no environment variable fallback
        const config = await prisma.aIConfig.findUnique({
            where: { id: "default" },
        });

        // Check if we have a valid database config
        if (config && config.apiKey && config.isValid) {
            return NextResponse.json({
                provider: config.provider,
                model: config.model,
                hasApiKey: true,
                isValid: config.isValid,
            });
        }

        // No valid configuration found - user must configure in settings
        return NextResponse.json({
            provider: config?.provider || "gemini",
            model: config?.model || "gemini-1.5-flash",
            hasApiKey: false,
            isValid: false,
        });
    } catch (error) {
        console.error("Error fetching AI config:", error);
        return NextResponse.json(
            { error: "Failed to fetch AI configuration" },
            { status: 500 }
        );
    }
}


// POST - Save AI configuration
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { provider, model, apiKey } = body;

        if (!provider || !model) {
            return NextResponse.json(
                { error: "Provider and model are required" },
                { status: 400 }
            );
        }

        // Validate the API key if provided
        let isValid = false;
        if (apiKey) {
            isValid = await validateAPIKey(provider as AIProvider, apiKey, model);
            if (!isValid) {
                return NextResponse.json(
                    { error: "API key validation failed", isValid: false },
                    { status: 400 }
                );
            }
        }

        // Upsert the configuration
        const config = await prisma.aIConfig.upsert({
            where: { id: "default" },
            update: {
                provider,
                model,
                apiKey: apiKey || null,
                isValid,
            },
            create: {
                id: "default",
                provider,
                model,
                apiKey: apiKey || null,
                isValid,
            },
        });

        return NextResponse.json({
            success: true,
            provider: config.provider,
            model: config.model,
            hasApiKey: !!config.apiKey,
            isValid: config.isValid,
        });
    } catch (error) {
        console.error("Error saving AI config:", error);
        return NextResponse.json(
            { error: "Failed to save AI configuration" },
            { status: 500 }
        );
    }
}
