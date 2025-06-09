# Smart Story Agent

A modern web application for analyzing news articles and extracting insights using AI-powered analysis.

## Features

- **Article Analysis**
  - Process and analyze news articles
  - Real-time loading states with animations
  - Error handling and user feedback
- **Modern UI**
  - Responsive design
  - Smooth animations using Framer Motion
  - Dark/light mode support
  - Loading animations with star and newspaper flip effects
- **Analytics**
  - PostHog integration for user insights
  - Event tracking and user behavior analysis

## Tech Stack

- **Frontend**
  - Next.js 14
  - React 18
  - TypeScript
  - Tailwind CSS
  - Framer Motion for animations
  - PostHog for analytics

## Project Structure

```
src/
├── app/
│   ├── page.tsx           # Main application component
│   └── layout.tsx         # Application layout
├── components/            # Reusable UI components
└── styles/               # Global styles and animations
```

## Getting Started

1. Install dependencies:
```bash
npm install
# or
yarn install
# or
pnpm install
# or
bun install
```

2. Run the development server:
```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

3. Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Development

The project uses modern React practices with:
- TypeScript for type safety
- Framer Motion for smooth animations
- Tailwind CSS for styling
- State management with React hooks
- Error boundaries for robust error handling

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
