"use client";

import { useEffect, useMemo, useState } from "react";
import { NewsArticle } from "@/app/lib/types";

type Tab = "news" | "summary";

export default function HomePage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("news");
  const [loadingNews, setLoadingNews] = useState(true);
  const [summary, setSummary] = useState("");
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState("");

  const categories = useMemo(() => {
    return Array.from(new Set(articles.map((article) => article.category)));
  }, [articles]);

  useEffect(() => {
    async function loadNews() {
      try {
        setLoadingNews(true);
        setError("");

        const response = await fetch("/api/news");

        if (!response.ok) {
          throw new Error("Failed to load news.");
        }

        const data = await response.json();
        setArticles(data.articles);
      } catch (error) {
        console.error("Failed to load tech news.", error);
        setError("Could not load tech news. Please try again.");
      } finally {
        setLoadingNews(false);
      }
    }

    loadNews();
  }, []);

  async function summarizeArticles() {
    try {
      setLoadingSummary(true);
      setError("");

      const response = await fetch("/api/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          articles,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to summarize news.");
      }

      setSummary(data.summary);
      setActiveTab("summary");
    } catch (error) {
      console.error("Failed to summarize articles.", error);
      setError("Could not summarize the articles. Check your Hugging Face token.");
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
              with an AI-generated summary of the main themes.
            </p>
          </div>

          <button
            onClick={summarizeArticles}
            disabled={loadingSummary || articles.length === 0}
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
                <CategoryStrip categories={categories} />
                <NewsGrid articles={articles} />
              </>
            )}
          </>
        )}

        {activeTab === "summary" && (
          <SummaryPanel
            summary={summary}
            loadingSummary={loadingSummary}
            articleCount={articles.length}
            onSummarize={summarizeArticles}
          />
        )}
      </section>
    </main>
  );
}

function CategoryStrip({ categories }: { categories: string[] }) {
  return (
    <div className="mb-6 flex flex-wrap gap-2">
      {categories.map((category) => (
        <span
          key={category}
          className="rounded-full border border-neutral-800 bg-neutral-900 px-4 py-2 text-sm text-neutral-300"
        >
          {category}
        </span>
      ))}
    </div>
  );
}

function NewsGrid({ articles }: { articles: NewsArticle[] }) {
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

          <div className="mt-6 flex items-center justify-between">
            <span className="text-xs uppercase tracking-[0.2em] text-neutral-500">
              {article.category}
            </span>

            <a
              href={article.link}
              target="_blank"
              rel="noreferrer"
              className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
            >
              Read article →
            </a>
          </div>
        </article>
      ))}
    </section>
  );
}

function SummaryPanel({
  summary,
  loadingSummary,
  articleCount,
  onSummarize,
}: {
  summary: string;
  loadingSummary: boolean;
  articleCount: number;
  onSummarize: () => void;
}) {
  return (
    <section className="rounded-3xl border border-neutral-800 bg-neutral-900 p-6 md:p-8">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-cyan-300">
            AI Summary
          </p>
          <h2 className="mt-2 text-3xl font-bold">
            Today’s main tech themes
          </h2>
          <p className="mt-2 text-neutral-400">
            Based on {articleCount} loaded article snippets.
          </p>
        </div>

        <button
          onClick={onSummarize}
          disabled={loadingSummary || articleCount === 0}
          className="rounded-full border border-neutral-700 px-5 py-2 text-sm font-medium text-neutral-200 hover:border-cyan-400 disabled:cursor-not-allowed disabled:text-neutral-500"
        >
          {loadingSummary ? "Generating..." : "Regenerate"}
        </button>
      </div>

      {summary ? (
        <p className="whitespace-pre-line text-lg leading-8 text-neutral-200">
          {summary}
        </p>
      ) : (
        <div className="rounded-2xl border border-dashed border-neutral-700 p-8 text-center text-neutral-400">
          Click “Summarize Today” to generate an AI summary.
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