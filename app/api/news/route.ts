import Parser from "rss-parser";
import { newsSources } from "@/app/lib/newsSources";
import { NewsArticle } from "@/app/lib/types";

export const dynamic = "force-dynamic";

const parser = new Parser();

function cleanText(value: string | undefined): string {
  if (!value) return "";

  return value
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

export async function GET() {
  try {
    const feedResults = await Promise.allSettled(
      newsSources.map(async (source) => {
        const feed = await parser.parseURL(source.url);

        return feed.items.slice(0, 8).map((item, index): NewsArticle => {
          const publishedDate =
            item.isoDate ||
            item.pubDate ||
            new Date().toISOString();

          return {
            id: `${source.name}-${index}-${item.link}`,
            title: cleanText(item.title),
            link: item.link || "#",
            source: source.name,
            publishedAt: publishedDate,
            summary: cleanText(
              item.contentSnippet ||
                item.content ||
                item.summary ||
                item.title
            ),
            category: source.category,
          };
        });
      })
    );

    const articles = feedResults
      .flatMap((result) => {
        if (result.status === "fulfilled") {
          return result.value;
        }

        return [];
      })
      .filter((article) => article.title && article.link)
      .sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime()
      )
      .slice(0, 30);

    return Response.json({
      articles,
      count: articles.length,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("News fetch error:", error);

    return Response.json(
      {
        error: "Failed to fetch news articles.",
      },
      {
        status: 500,
      }
    );
  }
}