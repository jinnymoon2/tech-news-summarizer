import { NewsArticle, TopicSummary } from "@/app/lib/types";

export const dynamic = "force-dynamic";

const HF_MODEL = "facebook/bart-large-cnn";
const HF_ENDPOINT = `https://router.huggingface.co/hf-inference/models/${HF_MODEL}`;

const STOP_WORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "but",
  "of",
  "to",
  "in",
  "on",
  "for",
  "with",
  "at",
  "by",
  "from",
  "as",
  "is",
  "are",
  "was",
  "were",
  "be",
  "been",
  "being",
  "this",
  "that",
  "these",
  "those",
  "it",
  "its",
  "into",
  "about",
  "after",
  "before",
  "over",
  "under",
  "new",
  "more",
  "how",
  "why",
  "what",
  "when",
  "where",
  "who",
  "will",
  "can",
  "could",
  "would",
  "should",
  "may",
  "might",
  "has",
  "have",
  "had",
  "just",
  "also",
  "said",
  "says",
  "read",
  "article",
  "comments",
  "comment",
  "https",
  "http",
  "www",
  "com",
  "june",
  "2026",
  "promo",
  "codes",
  "code",
  "coupon",
  "discount",
  "newsletter",
]);

type ArticleWithKeywords = NewsArticle & {
  keywords: string[];
};

type TopicGroup = {
  articles: ArticleWithKeywords[];
  keywords: string[];
};

function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function extractKeywords(article: NewsArticle): string[] {
  const text = normalizeText(`${article.title} ${article.summary}`);

  const words = text
    .split(" ")
    .filter((word) => word.length > 3)
    .filter((word) => !STOP_WORDS.has(word));

  const frequency = new Map<string, number>();

  for (const word of words) {
    frequency.set(word, (frequency.get(word) || 0) + 1);
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([word]) => word);
}

function calculateSimilarity(keywordsA: string[], keywordsB: string[]): number {
  const setA = new Set(keywordsA);
  const setB = new Set(keywordsB);

  const intersection = [...setA].filter((word) => setB.has(word));
  const union = new Set([...keywordsA, ...keywordsB]);

  if (union.size === 0) return 0;

  return intersection.length / union.size;
}

function mergeKeywords(articles: ArticleWithKeywords[]): string[] {
  const frequency = new Map<string, number>();

  for (const article of articles) {
    for (const keyword of article.keywords) {
      frequency.set(keyword, (frequency.get(keyword) || 0) + 1);
    }
  }

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([word]) => word);
}

function groupSimilarArticles(articles: NewsArticle[]): TopicGroup[] {
  const articlesWithKeywords: ArticleWithKeywords[] = articles.map(
    (article) => ({
      ...article,
      keywords: extractKeywords(article),
    })
  );

  const groups: TopicGroup[] = [];

  for (const article of articlesWithKeywords) {
    if (article.keywords.length === 0) continue;

    let bestGroupIndex = -1;
    let bestSimilarity = 0;

    groups.forEach((group, index) => {
      const similarity = calculateSimilarity(article.keywords, group.keywords);

      if (similarity > bestSimilarity) {
        bestSimilarity = similarity;
        bestGroupIndex = index;
      }
    });

    if (bestGroupIndex !== -1 && bestSimilarity >= 0.18) {
      groups[bestGroupIndex].articles.push(article);
      groups[bestGroupIndex].keywords = mergeKeywords(
        groups[bestGroupIndex].articles
      );
    } else {
      groups.push({
        articles: [article],
        keywords: article.keywords,
      });
    }
  }

  return groups
    .sort((a, b) => b.articles.length - a.articles.length)
    .slice(0, 3);
}

function buildTopicTitle(group: TopicGroup): string {
  const topKeywords = group.keywords.slice(0, 3);

  if (topKeywords.length === 0) {
    return "General Technology Updates";
  }

  return topKeywords
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" / ");
}

function buildTopicInput(group: TopicGroup): string {
  return group.articles
    .slice(0, 4)
    .map((article, index) => {
      return `${index + 1}. ${article.title}. ${article.summary}`;
    })
    .join("\n\n")
    .slice(0, 1200);
}

function fallbackTopicSummary(group: TopicGroup): string {
  const articleCount = group.articles.length;
  const sources = Array.from(
    new Set(group.articles.map((article) => article.source))
  ).join(", ");

  const mainArticles = group.articles
    .slice(0, 3)
    .map((article) => article.title)
    .join("; ");

  return `This topic includes ${articleCount} related article${
    articleCount === 1 ? "" : "s"
  } from ${sources}. The main stories are: ${mainArticles}.`;
}

async function summarizeTopic(group: TopicGroup): Promise<string> {
  try {
    const inputText = buildTopicInput(group);
    const token = process.env.HF_TOKEN;

    if (!token) {
      console.warn("HF_TOKEN is not set, using local fallback summary.");
      return fallbackTopicSummary(group);
    }

    const response = await fetch(HF_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: inputText,
        parameters: {
          min_length: 45,
          max_length: 130,
        },
        options: {
          wait_for_model: true,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();

      console.error("Hugging Face topic summary failed:", response.status);
      console.error(errorText);

      return fallbackTopicSummary(group);
    }

    const result = await response.json();

    if (Array.isArray(result) && result[0]?.summary_text) {
      return result[0].summary_text;
    }

    if (result.summary_text) {
      return result.summary_text;
    }

    return fallbackTopicSummary(group);
  } catch (error) {
    console.error("Hugging Face topic summary request failed:", error);

    return fallbackTopicSummary(group);
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const articles = body.articles as NewsArticle[];

    if (!Array.isArray(articles) || articles.length === 0) {
      return Response.json(
        {
          error: "No articles were provided.",
        },
        {
          status: 400,
        }
      );
    }

    const groups = groupSimilarArticles(articles.slice(0, 25));

    console.log("Topic groups:", groups.length);
    console.log(
      groups.map((group) => ({
        topic: buildTopicTitle(group),
        articleCount: group.articles.length,
        keywords: group.keywords,
      }))
    );

    const topicSummaries: TopicSummary[] = [];

    for (const group of groups) {
      let summary: string;

      try {
        summary = await summarizeTopic(group);
      } catch (error) {
        console.error("Using fallback summary for topic:", error);
        summary = fallbackTopicSummary(group);
      }

      topicSummaries.push({
        topic: buildTopicTitle(group),
        summary,
        articles: group.articles.slice(0, 4).map((article) => ({
          title: article.title,
          source: article.source,
          link: article.link,
        })),
      });
    }

    return Response.json({
      topics: topicSummaries,
      model: "facebook/bart-large-cnn",
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Summarization route error:", error);

    return Response.json(
      {
        error: "Failed to summarize articles by topic.",
      },
      {
        status: 500,
      }
    );
  }
}