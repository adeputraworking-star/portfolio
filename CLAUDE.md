# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server at localhost:4321
npm run build    # Build production site to ./dist/
npm run preview  # Preview production build locally
```

## Architecture

This is an Astro 5 portfolio website with a terminal/hacker aesthetic. It uses Tailwind CSS v4 (via Vite plugin) and TypeScript.

### Key Design Pattern

- **Terminal UI**: All content is styled to look like terminal windows with green-on-black theme
- **Profile Data**: All personal data lives in `src/data/profile.json` - skills, experience, highlights, social links
- **CSS Custom Properties**: Terminal colors defined in `src/styles/global.css` under `@theme` (e.g., `--color-terminal-green`)

### Component Structure

- `src/layouts/BaseLayout.astro` - Main layout with Header, Footer, MatrixRain background, and OnboardingController
- `src/components/Terminal.astro` - Reusable terminal window wrapper with macOS-style dots
- `src/components/onboarding/` - Multi-page guided tour system with animated cat mascots

### Tour System

The onboarding system (`src/scripts/tour.ts`) is a multi-page state machine:
- Each page has its own cat guide with different colors (Neko, Mochi, Yuki, Shadow, Patches, Splash, Pixel)
- Tour state persists across navigation via localStorage
- Elements are targeted for highlighting using `data-tour-id` attributes

### Content Collections

Blog posts use Astro Content Collections:
- Schema defined in `src/content/config.ts`
- Posts go in `src/content/blog/` as markdown files
- Frontmatter: `title`, `description`, `date`, `tags` (optional), `draft` (optional)

### Pages

File-based routing in `src/pages/`:
- `/` - Home with ASCII art and quick navigation cards
- `/about` - Bio and stats
- `/skills` - Skill bars by category
- `/projects` - Project showcase
- `/experience` - Career timeline
- `/contact` - Contact methods
- `/blog/` - Blog index and `[...slug].astro` for posts
