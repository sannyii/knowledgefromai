import { NextRequest, NextResponse } from "next/server";

// This endpoint is no longer needed as we don't use environment variables
// It returns empty values since API keys must be configured in settings/database
export async function GET(request: NextRequest) {
    const { searchParams } = new URL(request.url);
    const provider = searchParams.get("provider");

    if (!provider) {
        return NextResponse.json(
            { error: "Provider parameter is required" },
            { status: 400 }
        );
    }

    // No environment variables are used for API keys anymore
    // All API keys must be configured via the settings page and stored in the database
    // Return empty response - the settings page will handle this gracefully
    return NextResponse.json({
        apiKey: null,
        model: null,
    });
}
