import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getPromptTemplate, formatPrompt, Locale } from "@/lib/prompts";
import { callAIService } from "@/lib/ai-service";
import { AIConfig, AIProvider } from "@/lib/ai-config";

export async function POST(req: Request) {
    try {
        const { text, locale = "zh" } = await req.json();

        if (!text || text.length < 10) {
            return NextResponse.json(
                { error: "Text is too short" },
                { status: 400 }
            );
        }

        // Get configuration from database only - no environment variable fallback
        const dbConfig = await prisma.aIConfig.findUnique({
            where: { id: "default" },
        });

        // Check if we have a valid configuration
        if (!dbConfig || !dbConfig.apiKey || !dbConfig.isValid) {
            return NextResponse.json(
                { error: "No API key configured. Please configure an API key in settings." },
                { status: 400 }
            );
        }

        const aiConfig: AIConfig = {
            provider: dbConfig.provider as AIProvider,
            model: dbConfig.model,
            apiKey: dbConfig.apiKey,
        };



        // Use prompt template based on locale
        const promptTemplate = getPromptTemplate((locale as Locale) || "zh");
        const prompt = formatPrompt(promptTemplate, text);

        // Call AI service
        const responseText = await callAIService(prompt, aiConfig);

        // Parse the response (Gemini may return markdown code blocks)
        let parsedResult;
        try {
            // Try to extract JSON from markdown code blocks if present
            const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                responseText.match(/(\{[\s\S]*\})/);
            const jsonString = jsonMatch ? jsonMatch[1] : responseText;
            parsedResult = JSON.parse(jsonString);
        } catch (parseError) {
            // If parsing fails, try to extract summary and key points manually
            console.warn("Failed to parse JSON response, attempting manual extraction:", parseError);
            const lines = responseText.split('\n').filter(line => line.trim());
            parsedResult = {
                summary: lines[0] || "无法生成摘要",
                keyPoints: lines.slice(1, 6).filter(line => line.trim().length > 0)
            };
        }

        // Validate result structure
        if (!parsedResult.summary || !parsedResult.keyPoints || !Array.isArray(parsedResult.keyPoints)) {
            return NextResponse.json(
                { error: "Invalid response format from AI" },
                { status: 500 }
            );
        }

        // Generate title if not provided
        const title = parsedResult.title || parsedResult.summary.substring(0, 30) + "...";

        // Ensure tags array exists and has exactly 3 items
        let tags: string[] = [];
        if (parsedResult.tags && Array.isArray(parsedResult.tags)) {
            tags = parsedResult.tags
                .filter((tag: unknown) => typeof tag === 'string' && tag.trim().length > 0)
                .slice(0, 3)
                .map((tag: string) => tag.trim());
        }
        // Pad with empty strings if needed to ensure exactly 3 tags
        while (tags.length < 3) {
            tags.push("");
        }

        // Save to DB
        const kp = await prisma.knowledgePoint.create({
            data: {
                title: title,
                originalText: text,
                summary: parsedResult.summary,
                keyPoints: JSON.stringify(parsedResult.keyPoints),
                tags: tags.some(t => t.trim()) ? JSON.stringify(tags) : null,
            }
        });

        return NextResponse.json({
            id: kp.id,
            title: kp.title,
            summary: parsedResult.summary,
            keyPoints: parsedResult.keyPoints,
            tags: tags,
            createdAt: kp.createdAt.toISOString()
        });

    } catch (error) {
        console.error("Error in summarize API:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal Server Error" },
            { status: 500 }
        );
    }
}
