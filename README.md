# Signalist - Stock Market Tracking Platform

A full-stack stock market tracking and analysis platform that enables users to monitor real-time market data, manage personalized watchlists, and receive AI-powered daily news summaries.

## Overview

**Signalist** is a modern web application for tracking stock market performance, analyzing technical indicators, and staying informed about market trends. Users can create accounts, build custom watchlists, view detailed stock analytics with interactive charts, and receive personalized email notifications with AI-generated market news summaries.

### Key Features

- **Real-time market data** via TradingView widgets and Finnhub API
- **User authentication** with email/password (Better Auth)
- **Personalized watchlists** to track favorite stocks
- **Stock search** with autocomplete
- **Detailed stock pages** featuring:
  - Advanced candlestick and baseline charts
  - Technical analysis indicators
  - Company profiles and financials
- **AI-powered email notifications**:
  - Welcome emails with personalized investment insights
  - Daily news summaries based on user watchlists
- **Market heatmaps** and sector overviews
- **Responsive dark-themed UI**

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router with React Server Components)
- **React**: 19.1.0
- **Styling**: Tailwind CSS 4 with custom theming
- **UI Components**: Radix UI primitives (Dialog, Dropdown, Avatar, Select, Popover, Label)
- **Icons**: Lucide React
- **Form Handling**: React Hook Form
- **Utilities**: clsx, tailwind-merge, class-variance-authority
- **Command Palette**: cmdk
- **Notifications**: Sonner (toast notifications)
- **Theming**: next-themes

### Backend
- **Runtime**: Node.js (Next.js server environment)
- **Authentication**: Better Auth v1.3.7 with MongoDB adapter
- **Database**: MongoDB (via Mongoose ORM)
- **Background Jobs**: Inngest v3.40.1
- **Email Service**: Nodemailer v7.0.6
- **External APIs**:
  - Finnhub (stock data, company news, search)
  - Google Gemini (AI-powered email content generation)
  - TradingView (embedded chart widgets)

### Developer Tooling
- **Language**: TypeScript 5
- **Build Tool**: Next.js Turbopack
- **Linting**: ESLint 9 with Next.js config
- **Package Manager**: npm
- **Environment Variables**: dotenv

---

## Architecture & Structure

### High-Level Architecture

The application follows a **feature-based architecture** using Next.js App Router conventions:

```
app/
├── (auth)/          # Unauthenticated routes (sign-in, sign-up)
├── (root)/          # Protected routes (dashboard, stock details)
├── api/             # API routes (Inngest webhooks)
└── layout.tsx       # Root layout

components/          # Reusable UI components
├── forms/           # Form field components
└── ui/              # Base UI primitives (shadcn/ui style)

lib/
├── actions/         # Server actions (auth, finnhub, user, watchlist)
├── better-auth/     # Authentication configuration
├── inngest/         # Background job definitions
├── nodemailer/      # Email templates and sending logic
└── utils.ts         # Shared utilities

database/
└── models/          # Mongoose schemas (Watchlist)

middleware/          # Next.js middleware (session validation)

types/               # Global TypeScript type definitions
```

### Data Flow

1. **Authentication Flow**:
   - User submits credentials → Better Auth validates → Session cookie created → Middleware protects routes

2. **Watchlist Management**:
   - User adds stock → Server action validates → MongoDB stores watchlist item → UI updates optimistically

3. **Stock Data Fetching**:
   - Page loads → Server component calls Finnhub API → Data cached via Next.js `fetch` revalidation → Rendered server-side

4. **Background Jobs (Inngest)**:
   - **Sign-up trigger**: User registers → Event fired → Inngest function generates personalized welcome email via Gemini → Nodemailer sends email
   - **Daily news cron**: Every day at 12 PM → Fetch all users → Get watchlist symbols → Fetch relevant news → Gemini summarizes → Email sent

### Key Patterns

- **Server Actions**: All data mutations use Next.js Server Actions (`use server`)
- **React Caching**: `searchStocks` function uses React's `cache()` for request deduplication
- **Protected Routes**: Middleware redirects unauthenticated users to `/sign-in`
- **Route Groups**: `(auth)` and `(root)` for layout isolation
- **Component Composition**: UI components follow Radix UI's compound component pattern
- **Type Safety**: Strict TypeScript with global type definitions in `types/`

---

## Getting Started

### Prerequisites

- **Node.js**: v20 or higher
- **npm**: v9 or higher
- **MongoDB**: Atlas account or local MongoDB instance
- **API Keys**:
  - [Finnhub API Key](https://finnhub.io/)
  - [Google Gemini API Key](https://aistudio.google.com/app/apikey)
  - SMTP credentials for Nodemailer (e.g., Gmail app password)

### Installation

1. **Clone the repository**

```bash
git clone <repository-url>
cd nextjs-stock-market-app
```

2. **Install dependencies**

```bash
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
NODE_ENV=development
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<AppName>

# Better Auth
BETTER_AUTH_SECRET=<generate-random-32-char-string>
BETTER_AUTH_URL=http://localhost:3000

# Finnhub API
NEXT_PUBLIC_FINNHUB_API_KEY=<your-finnhub-api-key>

# Google Gemini AI
GEMINI_API_KEY=<your-gemini-api-key>

# Nodemailer (Gmail example)
NODEMAILER_EMAIL=<your-email@gmail.com>
NODEMAILER_PASSWORD=<your-app-password>
```

**Security Note**: Never commit `.env` to version control. The `.env` file contains sensitive credentials.

4. **Test database connection** (optional)

```bash
npm run test:db
```

5. **Run the development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Scripts & Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build optimized production bundle |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint to check code quality |
| `npm run test:db` | Test MongoDB connection |

---

## Development Notes

### Coding Conventions

- **File Naming**:
  - Components: PascalCase (e.g., `UserDropdown.tsx`)
  - Actions/utilities: camelCase (e.g., `finnhub.actions.ts`)
  - Route folders: kebab-case (e.g., `sign-in/`)

- **Component Structure**:
  - Server Components by default (no `"use client"`)
  - Client Components explicitly marked with `"use client"` directive
  - Forms and interactive UI require client components

- **Type Definitions**:
  - Global types in `types/` directory
  - Inline types for component-specific props

- **Server Actions**:
  - All actions in `lib/actions/` with `"use server"` directive
  - Error handling with try-catch blocks
  - Return type-safe responses

### Architectural Decisions

1. **Better Auth over NextAuth**: Chosen for simpler MongoDB integration and modern architecture
2. **Mongoose over Prisma**: Selected for flexibility with MongoDB schema design
3. **Inngest for Background Jobs**: Provides reliable cron scheduling, AI inference, and step-based workflows
4. **TradingView Widgets**: Embedded third-party charts instead of building custom charting (faster implementation, professional quality)
5. **Server Components First**: Maximizes performance by rendering on server; client components only where interactivity is needed

### Known Constraints

- **Finnhub Rate Limits**: Free tier allows 60 API calls/minute. Caching is implemented to mitigate this.
- **Email Sending**: Uses Nodemailer with Gmail SMTP (may require app passwords; Gmail has daily send limits)
- **Inngest Local Development**: Requires Inngest Dev Server for local testing of background jobs
- **TradingView Widget Limitations**: Widgets load external scripts; customization is limited to config options

---

## Production Readiness

### Deployment Considerations

1. **Platform**: Vercel (recommended for Next.js) or any Node.js hosting
2. **Environment Variables**: Set all `.env` variables in production hosting dashboard
3. **Database**: Ensure MongoDB Atlas has appropriate connection limits and security rules
4. **API Keys**: Use production-grade API keys with appropriate rate limits
5. **Inngest**: Deploy Inngest functions to Inngest Cloud for production cron jobs

### Security

- **Session Management**: Sessions stored in MongoDB with httpOnly cookies via Better Auth
- **Middleware Protection**: All authenticated routes protected by Next.js middleware
- **Password Requirements**: Minimum 8 characters enforced by Better Auth
- **Environment Variables**: Sensitive credentials in `.env` (excluded from git via `.gitignore`)
- **Email Verification**: Currently disabled (`requireEmailVerification: false`) — consider enabling for production

### Performance

- **Server-Side Rendering**: Most pages render on server for fast initial load
- **React Caching**: Duplicate API calls deduplicated within same request
- **Fetch Revalidation**: Finnhub data cached with appropriate revalidation intervals (300-3600s)
- **Turbopack**: Fast development builds and HMR
- **Image Optimization**: Next.js Image component used for logo (SVG)

### Monitoring & Observability

**Not currently implemented**. Consider adding:
- Error tracking (e.g., Sentry)
- Performance monitoring (e.g., Vercel Analytics)
- Logging (structured logs for server actions)
- Uptime monitoring (e.g., UptimeRobot)

---

## API Integrations

### Finnhub API

- **Endpoints Used**:
  - `/company-news`: Fetch company-specific news
  - `/news`: General market news
  - `/search`: Stock symbol search
  - `/stock/profile2`: Company profile data
- **Caching Strategy**: Responses cached with revalidation (300-3600 seconds)

### Google Gemini API

- **Model**: `gemini-2.5-flash-lite`
- **Use Cases**:
  - Generate personalized welcome email content based on user profile
  - Summarize daily news articles for email delivery
- **Integration**: Via Inngest's AI inference API

### TradingView

- **Widgets**: Market Overview, Stock Heatmap, Timeline, Market Quotes, Advanced Charts, Technical Analysis, Company Profile, Financials
- **Loading**: Dynamic script injection in client components

---

## Future Enhancements

- **User Profile Settings**: Allow users to update investment preferences
- **Real-time Notifications**: WebSocket integration for live price alerts
- **Portfolio Tracking**: Track buy/sell transactions and P&L
- **Social Features**: Share watchlists and insights
- **Mobile App**: React Native version
- **Advanced Analytics**: Custom technical indicator overlays

---

## Contributing

This is a portfolio project. Contributions, issues, and feature requests are welcome.

---

## License

Private/Proprietary (update as needed)

---

## Contact

For questions or support, contact the development team.

---

**Built with Next.js, TypeScript, MongoDB, and Inngest.**
