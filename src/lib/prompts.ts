/**
 * Prompt templates for knowledge extraction
 */

export type Locale = "zh" | "en";

export const KNOWLEDGE_EXTRACTION_PROMPTS = {
  zh: `请分析以下文本内容，并生成结构化的知识摘要。

要求：
1. 生成一个简洁的标题（10-20字，概括核心主题）
2. 生成一个简洁的摘要（2-3句话，概述主要内容）
3. 提取3-5个关键要点（每个要点一句话，突出重点）
4. 生成3个标签关键词（每个关键词2-4个字，用于快速分类和检索）

文本内容：
{text}

请严格按照以下 JSON 格式返回结果，不要添加任何额外的说明文字：
{
  "title": "标题内容",
  "summary": "摘要内容",
  "keyPoints": ["要点1", "要点2", "要点3"],
  "tags": ["标签1", "标签2", "标签3"]
}`,
  en: `Please analyze the following text content and generate a structured knowledge summary.

Requirements:
1. Generate a concise title (10-20 words, summarizing the core theme)
2. Generate a concise summary (2-3 sentences, outlining the main content)
3. Extract 3-5 key points (one sentence each, highlighting important points)
4. Generate 3 tag keywords (2-4 words each, for quick categorization and retrieval)

Text content:
{text}

Please return the result strictly in the following JSON format, without any additional explanatory text:
{
  "title": "Title content",
  "summary": "Summary content",
  "keyPoints": ["Point 1", "Point 2", "Point 3"],
  "tags": ["Tag 1", "Tag 2", "Tag 3"]
}`,
};

/**
 * Get prompt template based on locale
 */
export function getPromptTemplate(locale: Locale = "zh"): string {
  return KNOWLEDGE_EXTRACTION_PROMPTS[locale] || KNOWLEDGE_EXTRACTION_PROMPTS.zh;
}

/**
 * Replace placeholder in prompt template with actual text
 */
export function formatPrompt(template: string, text: string): string {
  return template.replace("{text}", text);
}

