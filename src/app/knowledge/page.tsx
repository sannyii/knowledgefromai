"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTitle, VisuallyHidden } from "@/components/ui/dialog";
import { BookOpen, Grid3x3, List, Trash2, Calendar, Sparkles, Loader2, Home as HomeIcon, Library, Tag } from "lucide-react";
import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { KnowledgeLinkWithBadge } from "@/components/KnowledgeLinkWithBadge";
import { useProcessing } from "@/lib/processing-context";
import { KnowledgeCardImage } from "@/components/KnowledgeCardImage";

type KnowledgePoint = {
  id: string;
  title: string;
  summary: string;
  keyPoints: string[];
  tags: string[];
  createdAt: string;
  originalText: string;
};

type ViewMode = "card" | "list" | "tags";

export default function KnowledgePage() {
  const { t } = useI18n();
  const { processingCount } = useProcessing();
  const [knowledgePoints, setKnowledgePoints] = useState<KnowledgePoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>("card");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedKnowledgePoint, setSelectedKnowledgePoint] = useState<KnowledgePoint | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const prevProcessingCountRef = useRef(0);
  const prevKnowledgePointsCountRef = useRef(0);

  useEffect(() => {
    fetchKnowledgePoints();
  }, []);

  // Auto-refresh when processing count decreases (task completed)
  useEffect(() => {
    // If processing count decreased (task completed), refresh the list
    if (prevProcessingCountRef.current > 0 && processingCount < prevProcessingCountRef.current) {
      // Small delay to ensure backend has saved the data
      // This allows the loading card to start transitioning out
      setTimeout(() => {
        // Skip loading state to prevent flicker - cards will smoothly transition
        fetchKnowledgePoints(true);
      }, 300);
    }
    prevProcessingCountRef.current = processingCount;
  }, [processingCount]);

  const fetchKnowledgePoints = async (skipLoadingState = false) => {
    try {
      if (!skipLoadingState) {
        setIsLoading(true);
      }
      const response = await fetch("/api/knowledge");
      const data = await response.json();
      if (response.ok) {
        const newPoints = data.data || [];
        prevKnowledgePointsCountRef.current = newPoints.length;
        setKnowledgePoints(newPoints);
      }
    } catch (error) {
      console.error("Failed to fetch knowledge points:", error);
    } finally {
      if (!skipLoadingState) {
        setIsLoading(false);
      }
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t.knowledge.deleteConfirm)) return;

    try {
      setDeletingId(id);
      const response = await fetch(`/api/knowledge?id=${id}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setKnowledgePoints(prev => prev.filter(kp => kp.id !== id));
      } else {
        alert(t.knowledge.deleteFailed);
      }
    } catch (error) {
      console.error("Failed to delete:", error);
      alert(t.knowledge.deleteFailed);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    // Format time as HH:mm
    const formatTime = (d: Date) => {
      const hours = d.getHours().toString().padStart(2, '0');
      const minutes = d.getMinutes().toString().padStart(2, '0');
      return `${hours}:${minutes}`;
    };

    if (days === 0) {
      // Today: show "今天 HH:mm"
      return `${t.knowledge.today} ${formatTime(date)}`;
    }
    if (days === 1) return t.knowledge.yesterday;
    if (days < 7) return t.knowledge.daysAgo.replace("{days}", days.toString());
    if (days < 30) return t.knowledge.weeksAgo.replace("{weeks}", Math.floor(days / 7).toString());
    if (days < 365) return t.knowledge.monthsAgo.replace("{months}", Math.floor(days / 30).toString());
    return t.knowledge.yearsAgo.replace("{years}", Math.floor(days / 365).toString());
  };

  // Get all unique tags with counts
  const getAllTags = () => {
    const tagCounts = new Map<string, number>();
    knowledgePoints.forEach(kp => {
      kp.tags?.forEach(tag => {
        if (tag && tag.trim()) {
          const trimmedTag = tag.trim();
          tagCounts.set(trimmedTag, (tagCounts.get(trimmedTag) || 0) + 1);
        }
      });
    });
    return Array.from(tagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count);
  };

  // Get filtered knowledge points by tag
  const getFilteredKnowledgePoints = () => {
    if (!selectedTag) return knowledgePoints;
    return knowledgePoints.filter(kp =>
      kp.tags?.some(tag => tag.trim() === selectedTag)
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="border-b bg-white/50 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
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

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{t.knowledge.title}</h1>
            <p className="text-slate-600">{t.knowledge.total.replace("{count}", (knowledgePoints.length + processingCount).toString())}</p>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 border border-slate-200">
            <Button
              variant={viewMode === "card" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setViewMode("card"); setSelectedTag(null); }}
              className={viewMode === "card" ? "bg-blue-600 text-white" : ""}
            >
              <Grid3x3 className="w-4 h-4 mr-2" />
              {t.knowledge.cardView}
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => { setViewMode("list"); setSelectedTag(null); }}
              className={viewMode === "list" ? "bg-blue-600 text-white" : ""}
            >
              <List className="w-4 h-4 mr-2" />
              {t.knowledge.listView}
            </Button>
            <Button
              variant={viewMode === "tags" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("tags")}
              className={viewMode === "tags" ? "bg-blue-600 text-white" : ""}
            >
              <Tag className="w-4 h-4 mr-2" />
              {t.knowledge.tagsView || "Tags"}
            </Button>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && knowledgePoints.length === 0 && processingCount === 0 && (
          <div className="text-center py-20">
            <BookOpen className="w-16 h-16 mx-auto text-slate-300 mb-4" />
            <h3 className="text-xl font-semibold text-slate-700 mb-2">{t.knowledge.noKnowledge}</h3>
            <p className="text-slate-500 mb-6">{t.knowledge.noKnowledgeDesc}</p>
            <Link href="/">
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Sparkles className="w-4 h-4 mr-2" />
                {t.knowledge.createKnowledge}
              </Button>
            </Link>
          </div>
        )}

        {/* Card View */}
        {!isLoading && (knowledgePoints.length > 0 || processingCount > 0) && viewMode === "card" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Loading Cards for Processing Tasks - shown first, will smoothly transition to content */}
            {Array.from({ length: processingCount }).map((_, index) => (
              <LoadingCard
                key={`loading-${index}`}
              />
            ))}
            {/* Actual Knowledge Points - with smooth transition in, replacing loading cards */}
            {knowledgePoints.map((kp, index) => (
              <Card
                key={kp.id}
                className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-2 h-auto cursor-pointer group"
                style={{ animationDelay: `${Math.min(index, processingCount) * 100}ms` }}
                onClick={() => setSelectedKnowledgePoint(kp)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg font-semibold pr-2 group-hover:text-blue-600 transition-colors">
                      {kp.title || t.knowledge.unnamed}
                    </CardTitle>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(kp.id);
                      }}
                      disabled={deletingId === kp.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deletingId === kp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                  {/* Tags */}
                  {kp.tags && kp.tags.length > 0 && kp.tags.filter(tag => tag && tag.trim()).length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {kp.tags.slice(0, 3).filter(tag => tag && tag.trim()).map((tag, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-1 bg-black text-white text-xs font-medium rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <CardDescription className="flex items-center gap-2 text-xs mt-2">
                    <Calendar className="w-3 h-3" />
                    {formatDate(kp.createdAt)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm text-slate-600 mb-4">
                    {kp.summary}
                  </p>
                  {kp.keyPoints.length > 0 && (
                    <div className="space-y-1">
                      {kp.keyPoints.slice(0, 3).map((point, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs text-slate-500">
                          <Sparkles className="w-3 h-3 mt-0.5 flex-shrink-0 text-blue-500" />
                          <span>{point}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* List View */}
        {!isLoading && (knowledgePoints.length > 0 || processingCount > 0) && viewMode === "list" && (
          <div className="space-y-4">
            {/* Loading Cards for Processing Tasks - shown first, will smoothly transition to content */}
            {Array.from({ length: processingCount }).map((_, index) => (
              <LoadingCard
                key={`loading-${index}`}
                isList={true}
              />
            ))}
            {/* Actual Knowledge Points - with smooth transition in, replacing loading cards */}
            {knowledgePoints.map((kp, index) => (
              <Card
                key={kp.id}
                className="border-slate-200 shadow-sm hover:shadow-md transition-all duration-500 animate-in fade-in-0 slide-in-from-bottom-2"
                style={{ animationDelay: `${Math.min(index, processingCount) * 100}ms` }}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-lg font-semibold">
                          {kp.title || t.knowledge.unnamed}
                        </CardTitle>
                        <span className="text-xs text-slate-400 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(kp.createdAt)}
                        </span>
                      </div>
                      {/* Tags */}
                      {kp.tags && kp.tags.length > 0 && kp.tags.filter(tag => tag && tag.trim()).length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {kp.tags.slice(0, 3).filter(tag => tag && tag.trim()).map((tag, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-1 bg-black text-white text-xs font-medium rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {kp.summary}
                      </p>
                      {kp.keyPoints.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {kp.keyPoints.map((point, i) => (
                            <span
                              key={i}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                            >
                              <Sparkles className="w-3 h-3" />
                              {point}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(kp.id)}
                      disabled={deletingId === kp.id}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                    >
                      {deletingId === kp.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Tags View */}
        {!isLoading && viewMode === "tags" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Tags List */}
            <div className="lg:col-span-1">
              <Card className="border-slate-200 shadow-sm sticky top-20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Tag className="w-5 h-5" />
                    {t.knowledge.allTags || "All Tags"}
                  </CardTitle>
                  <CardDescription>
                    {(t.knowledge.tagsDescription || `${getAllTags().length} unique tags`).replace("{count}", getAllTags().length.toString())}
                  </CardDescription>
                </CardHeader>
                <CardContent className="max-h-[calc(100vh-16rem)] overflow-y-auto">
                  {getAllTags().length === 0 ? (
                    <p className="text-sm text-slate-500 text-center py-8">
                      {t.knowledge.noTags || "No tags yet"}
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {getAllTags().map(({ tag, count }) => (
                        <button
                          key={tag}
                          onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                          className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all hover:shadow-md ${selectedTag === tag
                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                            : 'bg-white hover:bg-slate-50 border-slate-200'
                            }`}
                        >
                          <span className="font-medium truncate flex-1 text-left">{tag}</span>
                          <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${selectedTag === tag
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-600'
                            }`}>
                            {count}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Filtered Knowledge Points */}
            <div className="lg:col-span-2">
              {selectedTag ? (
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {t.knowledge.taggedWith || "Tagged with"}: <span className="text-blue-600">#{selectedTag}</span>
                    </h2>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedTag(null)}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      {t.knowledge.clearFilter || "Clear filter"}
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {getFilteredKnowledgePoints().map((kp) => (
                      <Card
                        key={kp.id}
                        className="border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer"
                        onClick={() => setSelectedKnowledgePoint(kp)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3 mb-2">
                                <CardTitle className="text-lg font-semibold">
                                  {kp.title || t.knowledge.unnamed}
                                </CardTitle>
                                <span className="text-xs text-slate-400 flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  {formatDate(kp.createdAt)}
                                </span>
                              </div>
                              {kp.tags && kp.tags.length > 0 && kp.tags.filter(tag => tag && tag.trim()).length > 0 && (
                                <div className="flex flex-wrap gap-2 mb-3">
                                  {kp.tags.filter(tag => tag && tag.trim()).map((tag, index) => (
                                    <span
                                      key={index}
                                      className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded ${tag.trim() === selectedTag
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-black text-white'
                                        }`}
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                                {kp.summary}
                              </p>
                              {kp.keyPoints.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {kp.keyPoints.slice(0, 3).map((point, i) => (
                                    <span
                                      key={i}
                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-md"
                                    >
                                      <Sparkles className="w-3 h-3" />
                                      {point}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(kp.id);
                              }}
                              disabled={deletingId === kp.id}
                              className="text-red-500 hover:text-red-600 hover:bg-red-50 flex-shrink-0"
                            >
                              {deletingId === kp.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-20">
                  <Tag className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-xl font-semibold text-slate-700 mb-2">
                    {t.knowledge.selectTag || "Select a tag"}
                  </h3>
                  <p className="text-slate-500">
                    {t.knowledge.selectTagDesc || "Click on a tag to see related knowledge points"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Knowledge Card Image Dialog */}
      <Dialog open={!!selectedKnowledgePoint} onOpenChange={(open) => !open && setSelectedKnowledgePoint(null)}>
        <DialogContent className="max-w-5xl w-[calc(100%-2rem)] max-h-[95vh] overflow-y-auto p-4 md:p-8" showCloseButton={true}>
          <VisuallyHidden>
            <DialogTitle>
              {selectedKnowledgePoint?.title || t.knowledge.unnamed}
            </DialogTitle>
          </VisuallyHidden>
          {selectedKnowledgePoint && (
            <KnowledgeCardImage
              knowledgePoint={selectedKnowledgePoint}
              onClose={() => setSelectedKnowledgePoint(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Loading Card Component with Gradient Animation
function LoadingCard({ isList = false, isTransitioning = false }: { isList?: boolean; isTransitioning?: boolean }) {
  if (isList) {
    return (
      <Card className={`border-slate-200 shadow-sm overflow-hidden relative transition-all duration-500 ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100'
        }`}>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 bg-[length:200%_100%] animate-gradient-flow" />
        <CardContent className="p-6 relative">
          <div className="space-y-4">
            {/* Title placeholder */}
            <div className="h-6 bg-blue-200/50 rounded-md w-3/4 animate-pulse" />
            {/* Summary placeholder */}
            <div className="space-y-2">
              <div className="h-4 bg-blue-200/40 rounded-md w-full animate-pulse" />
              <div className="h-4 bg-blue-200/40 rounded-md w-5/6 animate-pulse" />
            </div>
            {/* Key points placeholder */}
            <div className="flex flex-wrap gap-2">
              <div className="h-6 bg-blue-200/40 rounded-full w-24 animate-pulse" />
              <div className="h-6 bg-blue-200/40 rounded-full w-32 animate-pulse" />
              <div className="h-6 bg-blue-200/40 rounded-full w-20 animate-pulse" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`border-slate-200 shadow-sm hover:shadow-md transition-all duration-500 overflow-hidden relative h-auto ${isTransitioning ? 'opacity-0 scale-95' : 'opacity-100'
      }`}>
      <div className="absolute inset-0 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 bg-[length:200%_100%] animate-gradient-flow" />
      <CardHeader className="pb-3 relative">
        <div className="h-5 bg-blue-200/50 rounded-md w-2/3 animate-pulse mb-2" />
        <div className="h-3 bg-blue-200/40 rounded-md w-1/3 animate-pulse" />
      </CardHeader>
      <CardContent className="pt-0 relative">
        <div className="space-y-2 mb-4">
          <div className="h-3 bg-blue-200/40 rounded-md w-full animate-pulse" />
          <div className="h-3 bg-blue-200/40 rounded-md w-5/6 animate-pulse" />
          <div className="h-3 bg-blue-200/40 rounded-md w-4/6 animate-pulse" />
        </div>
        <div className="space-y-1">
          <div className="h-3 bg-blue-200/40 rounded-md w-full animate-pulse" />
          <div className="h-3 bg-blue-200/40 rounded-md w-3/4 animate-pulse" />
          <div className="h-3 bg-blue-200/40 rounded-md w-5/6 animate-pulse" />
        </div>
      </CardContent>
    </Card>
  );
}


