# 💎 NotionGlaze V2

> **Premium Notion-to-Website Engine** — Built for speed, designed for conversions, and powered by the Edge.

NotionGlaze transforms your Notion workspace into a high-performance, SEO-optimized website in seconds. No complex setups, no sluggish performance—just your content rendered beautifully on the Cloudflare global network.

---

## ✨ Key Features

### 🚀 Magic Sync Engine (Heist Optimization 2.0)
Our proprietary synchronization engine is designed for maximum efficiency.
- **Resource Optimization**: Reduces subrequest usage by up to 90%.
- **Smart Incremental Sync**: Pre-flight checks only update changed blocks.
- **Partial Sync Recovery**: Gracefully handles Notion API limits by resuming from the last processed block.

### 🎨 Premium Design System
- **Stunning Themes**: Choose from Zen, Minimal, Brutal, and more.
- **Studio Builder**: A three-zone editor (Outliner, Canvas, Inspector) for pixel-perfect customization.
- **Signature Colors**: Dynamic CSS variable injection for instant brand alignment across the entire platform.

### 🤖 SEO Expert Sidekick
AI-powered tools to ensure your content ranks.
- **Automated Metadata**: Intelligent generation of titles and descriptions.
- **Performance First**: 100/100 Lighthouse scores by default through Astro's specialized rendering.
- **Automatic Sitemap & RSS**: Built-in support for search engine discoverability.

### 🌐 Edge-Native Infrastructure
- **Cloudflare D1/R2**: Data and assets served from the nearest edge node.
- **Proxy Routing**: Seamless custom domain support with low-latency routing.

---

## 🛠 Tech Stack

- **Framework**: [Astro 5](https://astro.build/) (SSR Mode)
- **Runtime**: [Cloudflare Workers & Pages](https://workers.cloudflare.com/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Database**: Cloudflare D1 (Edge SQL)
- **Storage**: Cloudflare R2
- **State Management**: [Zustand](https://github.com/pmndrs/zustand) & [Framer Motion](https://www.framer.com/motion/)
- **Monorepo Management**: [Turborepo](https://turbo.build/)

---

## 📂 Project Structure

```bash
.
├── apps/
│   ├── web/          # Main Astro Application (Dashboard, Admin, Blog)
│   ├── sync-worker/  # Notion Synchronization Engine (Worker)
│   └── proxy/        # Custom Domain Routing Service (Worker)
├── packages/
│   ├── core/         # Shared business logic, services, and types
│   ├── ui/           # Shared Component Library (React + Tailwind)
│   └── themes/       # Theme definitions and Penpot design tokens
└── ...
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v20+)
- Wrangler CLI (`npm install -g wrangler`)
- Cloudflare Account (for D1/R2/Workers)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/your-repo/notionglaze.git
   cd notionglaze
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

### Local Development
1. Start the main web application:
   ```bash
   npm run dev
   ```
2. Start the sync worker (optional):
   ```bash
   npm run worker:dev
   ```

---

## 🚢 Deployment

Deploy the entire stack with a single command:
```bash
npm run deploy
```
*This command migrates the production database, builds all apps, and deploys to Cloudflare Pages/Workers.*

---

## 🛡 License

© 2024 NotionGlaze. All rights reserved. Built with ❤️ for the Notion community.
