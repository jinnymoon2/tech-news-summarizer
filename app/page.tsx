"use client";

import { useEffect, useMemo, useState } from "react";
import { NewsArticle, TopicSummary } from "@/app/lib/types";

type Tab = "news" | "summary";

// Keywords / patterns used to detect AI-related stories across every source.
const AI_KEYWORDS = [
  "artificial intelligence",
  "machine learning",
  "deep learning",
  "neural network",
  "neural net",
  "large language model",
  "language model",
  "foundation model",
  "multimodal",
  "generative ai",
  "gen ai",
  "genai",
  "reasoning model",
  "a.i.",
  "chatbot",
  "chatgpt",
  "gpt-",
  "openai",
  "anthropic",
  "claude",
  "gemini",
  "llama",
  "mistral",
  "grok",
  "deepseek",
  "qwen",
  "deepmind",
  "copilot",
  "midjourney",
  "dall-e",
  "stable diffusion",
  "diffusion model",
  "transformer model",
  "hugging face",
  "huggingface",
  "pytorch",
  "tensorflow",
  "agentic",
  "ai agent",
  "ai model",
  "ai-powered",
  "ai tool",
  "ai system",
  "ai assistant",
  "ai chip",
];

// Acronyms that should only match as whole words, so "AI" doesn't match
// "rain", "GPT" doesn't match unrelated words, etc.
const AI_WORD_REGEX = /\b(ai|agi|gpt|llms?)\b/;

function isAIArticle(article: NewsArticle): boolean {
  const text = `${article.title} ${article.summary}`.toLowerCase();

  if (AI_KEYWORDS.some((keyword) => text.includes(keyword))) {
    return true;
  }

  return AI_WORD_REGEX.test(text);
}

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loadingNews, setLoadingNews] = useState(true);
  const [summary, setSummary] = useState("");
  const [topicSummaries, setTopicSummaries] = useState<TopicSummary[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");
  const [summarySource, setSummarySource] = useState<{
    articles: NewsArticle[];
    label: string;
  }>({ articles: [], label: "All" });

  const categories = useMemo(() => {
    return Array.from(new Set(articles.map((article) => article.category)));
  }, [articles]);

  const filteredArticles = useMemo(() => {
    if (selectedCategory === "All") {
      return articles;
    }

    if (selectedCategory === "AI") {
      return articles.filter(isAIArticle);
    }

    return articles.filter((article) => article.category === selectedCategory);
  }, [articles, selectedCategory]);

  useEffect(() => {
    async function loadNews() {
      try {
        setLoadingNews(true);
        setError("");

        const response = await fetch("/api/news", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Failed to load news.");
        }

        const data = await response.json();
        setArticles(data.articles || []);
      } catch (err) {
        console.error(err);
        setError("Could not load tech news. Please try again.");
      } finally {
        setLoadingNews(false);
      }
    }

    loadNews();
  }, []);

  async function summarizeArticles(
    sourceArticles: NewsArticle[],
    label: string
  ) {
    try {
      setLoadingSummary(true);
      setError("");
      setSummary("");
      setTopicSummaries([]);
      setSummarySource({ articles: sourceArticles, label });

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          articles: sourceArticles,
          selectedCategory: label,
          regenerateId: Date.now(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || data.error || "Failed to summarize news."
        );
      }

      if (Array.isArray(data.topics)) {
        setTopicSummaries(data.topics);
      } else {
        setSummary(data.summary || "No summary was returned.");
      }

      setActiveTab("summary");
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Could not summarize the articles.");
      }
    } finally {
      setLoadingSummary(false);
    }
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-white">
      <section className="mx-auto max-w-7xl px-6 py-8">
        <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="mb-2 text-sm font-medium uppercase tracking-[0.3em] text-cyan-300">
              Daily Signal
            </p>
            <h1 className="text-4xl font-bold tracking-tight md:text-6xl">
              Tech News Collage
            </h1>
            <p className="mt-4 max-w-2xl text-neutral-400">
              A daily collage of technology headlines from multiple sources,
              with AI-generated topic summaries.
            </p>
          </div>

          <button
            onClick={() => summarizeArticles(filteredArticles, selectedCategory)}
            disabled={loadingSummary || filteredArticles.length === 0}
            className="rounded-full bg-cyan-400 px-6 py-3 font-semibold text-neutral-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-neutral-700 disabled:text-neutral-400"
          >
            {loadingSummary ? "Summarizing..." : "Summarize Today"}
          </button>
        </header>

        <div className="mb-6 flex gap-3">
          <button
            onClick={() => setActiveTab("news")}
            className={`rounded-full px-5 py-2 text-sm font-medium ${
              activeTab === "news"
                ? "bg-white text-neutral-950"
                : "bg-neutral-900 text-neutral-300"
            }`}
          >
            News Collage
          </button>

          <button
            onClick={() => setActiveTab("summary")}
            className={`rounded-full px-5 py-2 text-sm font-medium ${
              activeTab === "summary"
                ? "bg-white text-neutral-950"
                : "bg-neutral-900 text-neutral-300"
            }`}
          >
            Summary
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-red-200">
            {error}
          </div>
        )}

        {activeTab === "news" && (
          <>
            {loadingNews ? (
              <LoadingGrid />
            ) : (
              <>
                <CategoryStrip
                  categories={categories}
                  selectedCategory={selectedCategory}
                  onSelectCategory={setSelectedCategory}
                />
                <NewsGrid articles={filteredArticles} />
              </>
            )}
          </>
        )}

        {activeTab === "summary" && (
          <SummaryPanel
            summary={summary}
            topicSummaries={topicSummaries}
            loadingSummary={loadingSummary}
            articleCount={summarySource.articles.length}
            selectedCategory={summarySource.label}
            onSummarize={() =>
              summarizeArticles(summarySource.articles, summarySource.label)
            }
          />
        )}
      </section>
    </main>
  );
}

function CategoryStrip({
  categories,
  selectedCategory,
  onSelectCategory,
}: {
  categories: string[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}) {
  const allCategories = ["All", "AI", ...categories];

  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {allCategories.map((category) => {
        const isSelected = selectedCategory === category;

        return (
          <button
            key={category}
            onClick={() => onSelectCategory(category)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              isSelected
                ? "border-cyan-400 bg-cyan-400 text-neutral-950"
                : "border-neutral-800 bg-neutral-900 text-neutral-300 hover:border-cyan-400/60 hover:text-cyan-200"
            }`}
          >
            {category}
          </button>
        );
      })}
    </div>
  );
}

function NewsGrid({ articles }: { articles: NewsArticle[] }) {
  if (articles.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-neutral-700 bg-neutral-900 p-10 text-center text-neutral-400">
        No articles found for this category.
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {articles.map((article, index) => (
        <article
          key={article.id}
          className={`group rounded-3xl border border-neutral-800 bg-neutral-900/80 p-5 transition hover:-translate-y-1 hover:border-cyan-400/50 ${
            index === 0 ? "md:col-span-2 lg:col-span-2" : ""
          }`}
        >
          <div className="mb-4 flex items-center justify-between gap-3">
            <span className="rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-medium text-cyan-300">
              {article.source}
            </span>
            <span className="text-xs text-neutral-500">
              {formatDate(article.publishedAt)}
            </span>
          </div>

          <h2
            className={`font-semibold leading-tight ${
              index === 0 ? "text-3xl" : "text-xl"
            }`}
          >
            {article.title}
          </h2>

          <p className="mt-4 line-clamp-4 text-sm leading-6 text-neutral-400">
            {article.summary || "No preview available."}
          </p>

          <div className="mt-6 flex items-center justify-between gap-4">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              {article.category}
            </span>

            <a
              href={article.link}
              target="_blank"
              rel="noreferrer"
              className="shrink-0 text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              Read article &rarr;
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}

function SummaryPanel({
  summary,
  topicSummaries,
  loadingSummary,
  articleCount,
  selectedCategory,
  onSummarize,
}: {
  summary: string;
  topicSummaries: TopicSummary[];
  loadingSummary: boolean;
  articleCount: number;
  selectedCategory: string;
  onSummarize: () => void;
}) {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            AI Topic Summary
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Today's important tech topics
          </h2>
          <p className="mt-2 text-neutral-400">
            Based on {articleCount} article{articleCount === 1 ? "" : "s"} from{" "}
            {selectedCategory === "All" ? "all categories" : selectedCategory}.
          </p>
        </div>

        <button
          onClick={onSummarize}
          disabled={loadingSummary || articleCount === 0}
          className="rounded-full border border-neutral-700 px-5 py-2 text-sm font-medium text-neutral-200 hover:border-cyan-400 disabled:cursor-not-allowed disabled:text-neutral-500"
        >
          {loadingSummary ? "Refreshing..." : "Refresh Topic Summary"}
        </button>
      </div>

      {loadingSummary && (
        <div className="rounded-2xl border border-dashed border-neutral-700 p-8 text-center text-neutral-400">
          Grouping similar articles and generating topic summaries...
        </div>
      )}

      {!loadingSummary && topicSummaries.length > 0 && (
        <div className="space-y-6">
          {topicSummaries.map((topic, index) => (
            <article
              key={`${topic.topic}-${index}`}
              className="rounded-2xl border border-neutral-800 bg-neutral-950 p-5"
            >
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center">
                <span className="w-fit rounded-full bg-cyan-400/10 px-3 py-1 text-xs font-semibold text-cyan-300">
                  Topic {index + 1}
                </span>
                <h3 className="text-xl font-bold">{topic.topic}</h3>
              </div>

              <p className="text-base leading-7 text-neutral-300">
                {topic.summary}
              </p>

              <div className="mt-5">
                <p className="mb-2 text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Related articles
                </p>

                <div className="space-y-2">
                  {topic.articles.map((article) => (
                    <a
                      key={article.link}
                      href={article.link}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-xl border border-neutral-800 px-4 py-3 text-sm text-neutral-300 transition hover:border-cyan-400/50 hover:text-cyan-200"
                    >
                      <span className="text-neutral-500">
                        {article.source} &mdash;{" "}
                      </span>
                      {article.title}
                    </a>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loadingSummary && topicSummaries.length === 0 && summary && (
        <p className="whitespace-pre-line text-lg leading-8 text-neutral-200">
          {summary}
        </p>
      )}

      {!loadingSummary && topicSummaries.length === 0 && !summary && (
        <div className="rounded-2xl border border-dashed border-neutral-700 p-8 text-center text-neutral-400">
          Click "Summarize Today" to generate topic-based summaries.
        </div>
      )}
    </section>
  );
}

function LoadingGrid() {
  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 9 }).map((_, index) => (
        <div
          key={index}
          className="h-64 animate-pulse rounded-3xl bg-neutral-900"
        />
      ))}
    </section>
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Today";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
  }).format(date);
}
