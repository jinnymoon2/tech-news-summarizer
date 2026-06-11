export type NewsArticle = {
  id: string;
  title: string;
  link: string;
  source: string;
  publishedAt: string;
  summary: string;
  category: string;
};

export type TopicSummary = {
  topic: string;
  summary: string;
  articles: {
    title: string;
    source: string;
    link: string;
  }[];
};
