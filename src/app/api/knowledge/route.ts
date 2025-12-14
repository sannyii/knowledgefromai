import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get("limit") || "100");
        const offset = parseInt(searchParams.get("offset") || "0");

        // Get all knowledge points, ordered by creation date (newest first)
        const knowledgePoints = await prisma.knowledgePoint.findMany({
            orderBy: {
                createdAt: "desc"
            },
            take: limit,
            skip: offset
        });

        // Transform data for frontend
        const formatted = knowledgePoints.map(kp => ({
            id: kp.id,
            title: kp.title || "未命名知识点",
            summary: kp.summary,
            keyPoints: JSON.parse(kp.keyPoints || "[]"),
            tags: kp.tags ? JSON.parse(kp.tags) : [],
            createdAt: kp.createdAt.toISOString(),
            originalText: kp.originalText.substring(0, 200) + (kp.originalText.length > 200 ? "..." : "")
        }));

        return NextResponse.json({
            data: formatted,
            total: formatted.length
        });

    } catch (error) {
        console.error("Error fetching knowledge points:", error);
        return NextResponse.json(
            { error: "Failed to fetch knowledge points" },
            { status: 500 }
        );
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get("id");

        if (!id) {
            return NextResponse.json(
                { error: "Knowledge point ID is required" },
                { status: 400 }
            );
        }

        await prisma.knowledgePoint.delete({
            where: { id }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error deleting knowledge point:", error);
        return NextResponse.json(
            { error: "Failed to delete knowledge point" },
            { status: 500 }
        );
    }
}

