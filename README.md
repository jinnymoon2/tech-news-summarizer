# Tech News Summarizer

A daily tech news collage website that collects technology headlines from multiple RSS sources and generates AI-powered topic summaries using the Hugging Face API.

**Live Demo:** https://tech-news-summarizer-alpha.vercel.app

---

## Overview

Tech News Summarizer is a Next.js web application that helps users quickly understand what is happening in the technology world each day.

Instead of showing a simple list of headlines, the website organizes articles into a visual news collage and provides an AI summary tab. The summarization feature groups similar articles by topic and generates one paragraph summary per important topic.

This project was built as a full-stack prototype using:

* Next.js App Router
* TypeScript
* Tailwind CSS
* RSS feeds
* Hugging Face Inference API
* Vercel deployment

---

## Features

### Daily Tech News Collage

The homepage displays recent technology articles from multiple sources in a card-based collage layout.

Current categories include:

* Developer
* Tech Culture
* Startups
* Consumer Tech
* Engineering

Users can click each category to filter the news cards by topic.

---

### Topic-Based AI Summarization

The summary tab does more than summarize all articles into one generic paragraph.

The backend first analyzes article titles and snippets, extracts keywords, groups similar articles together, and then summarizes each topic group separately.

The result is a briefing-style output such as:

* AI model updates
* Developer tooling
* Startup funding
* Consumer hardware
* Cybersecurity or platform updates

Each topic summary includes related articles and source links.

---

### RSS-Based News Collection

The app fetches articles from RSS feeds instead of manually storing article data.

Current sources include:

* TechCrunch
* The Verge
* Ars Technica
* Wired
* Hacker News

The backend normalizes articles into a shared format containing title, source, link, category, summary, and published date.

---

### Promo and Coupon Filtering

The app filters out promotional or coupon-related articles before displaying or summarizing the news.

Blocked terms include words such as:

* coupon
* promo code
* discount
* deals
* shopping
* newsletter

This keeps the feed focused on actual technology news.

---

## Tech Stack

| Area             | Technology                 |
| ---------------- | -------------------------- |
| Framework        | Next.js                    |
| Language         | TypeScript                 |
| Styling          | Tailwind CSS               |
| Backend          | Next.js API Routes         |
| News Data        | RSS Feeds                  |
| RSS Parsing      | rss-parser                 |
| AI Summarization | Hugging Face Inference API |
| Deployment       | Vercel                     |

---

## Project Structure

```txt
tech-news-collage/
├── app/
│   ├── api/
│   │   ├── news/
│   │   │   └── route.ts
│   │   └── summarize/
│   │       └── route.ts
│   ├── lib/
│   │   ├── newsSources.ts
│   │   └── types.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── .env.local
├── package.json
└── tsconfig.json
```

---

## How It Works

### 1. Fetch News

When the user opens the website, the frontend calls:

```txt
GET /api/news
```

The backend fetches articles from RSS feeds, cleans the text, filters out promotional content, sorts the articles by date, and returns the latest articles.

---

### 2. Filter by Category

The frontend stores the selected category in React state.

When a user clicks a category such as `Developer` or `Startups`, the displayed articles are filtered on the frontend.

If the user clicks `All`, all loaded articles are shown again.

---

### 3. Generate Topic Summaries

When the user clicks `Summarize Today`, the frontend sends the currently filtered articles to:

```txt
POST /api/summarize
```

The backend then:

1. Extracts keywords from each article.
2. Compares keyword similarity between articles.
3. Groups similar articles into topic clusters.
4. Sends each topic group to Hugging Face.
5. Returns one paragraph summary per topic.

---

## Summarization Algorithm

The summarization algorithm uses a simple keyword-based clustering approach.

### Keyword Extraction

For each article, the backend combines:

```txt
title + summary
```

Then it:

* converts text to lowercase
* removes URLs and punctuation
* removes stop words
* counts keyword frequency
* keeps the most relevant keywords

### Topic Grouping

Each article is compared with existing groups using keyword overlap.

The similarity score is based on Jaccard similarity:

```txt
similarity = shared keywords / total unique keywords
```

If an article is similar enough to an existing group, it is added to that group. Otherwise, a new topic group is created.

### Topic Summarization

Each topic group is summarized separately using Hugging Face’s `facebook/bart-large-cnn` model.

This produces a more useful daily briefing than one large summary of every article.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
HF_TOKEN=your_hugging_face_token_here
```

On Vercel, add the same environment variable:

```txt
HF_TOKEN
```

Make sure it is enabled for the correct environment:

* Production
* Preview
* Development

After adding or changing environment variables in Vercel, redeploy the project.

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/jinnymoon2/tech-news-summarizer.git
cd tech-news-summarizer
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add environment variables

Create `.env.local`:

```bash
touch .env.local
```

Add:

```env
HF_TOKEN=your_hugging_face_token_here
```

### 4. Run the development server

```bash
npm run dev
```

Open:

```txt
http://localhost:3000
```

---

## Build

To check the production build locally:

```bash
npm run build
```

Then run:

```bash
npm start
```

---

## Deployment

This project is deployed with Vercel.

Live demo:

```txt
https://tech-news-summarizer-alpha.vercel.app
```

To deploy:

1. Push the project to GitHub.
2. Import the repository into Vercel.
3. Add the `HF_TOKEN` environment variable.
4. Redeploy the project.

---

## Main Files

### `app/page.tsx`

Handles the frontend UI, including:

* news collage layout
* category filtering
* summary tab
* summarize button
* loading and error states

### `app/api/news/route.ts`

Handles RSS fetching and article cleanup.

Main responsibilities:

* fetch RSS feeds
* normalize article data
* remove promotional content
* sort articles by publication date
* return article JSON to the frontend

### `app/api/summarize/route.ts`

Handles topic grouping and AI summarization.

Main responsibilities:

* extract article keywords
* group similar articles
* generate topic titles
* call Hugging Face API
* return topic summaries

### `app/lib/newsSources.ts`

Stores the RSS feed sources.

### `app/lib/types.ts`

Stores shared TypeScript types for articles and topic summaries.

---

## Current Limitations

* The app summarizes RSS snippets, not full article text.
* Topic grouping is keyword-based, not embedding-based.
* Hugging Face responses can be affected by API availability or rate limits.
* RSS feed quality depends on the source.
* Some articles may have short or incomplete summaries.

---

## Future Improvements

Possible next steps:

* Add automatic refresh every few minutes.
* Add search by keyword.
* Add saved summaries.
* Add daily archive pages.
* Add source-level filtering.
* Add better topic clustering using embeddings.
* Add Korean tech news sources.
* Add full article extraction where allowed.
* Add loading skeletons for topic summaries.
* Add shareable daily summary links.

---

## Example Commit Messages

```bash
git commit -m "feat: add RSS-based tech news collage"
```

```bash
git commit -m "feat: add topic-based AI summarization"
```

```bash
git commit -m "fix: filter promo and coupon news articles"
```

```bash
git commit -m "docs: add project README"
```

---

## License

This project is for educational and prototype purposes.
