# Setup (Local)

## 1) Environment Variable

This project expects a server-side environment variable:

- `YOUTUBE_API_KEY` (YouTube Data API v3 key)

Create `.env.local` in the project root and set:

```
YOUTUBE_API_KEY=YOUR_KEY_HERE
```

> Note: `.env.local` is intentionally not created by the agent in this environment.

## 2) Run

```
npm run dev
```

Then open `http://localhost:3000`.

