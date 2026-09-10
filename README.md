# KnowCore - AI Knowledge Base SaaS

KnowCore is a multi-tenant SaaS platform that provides AI-powered Q&A over your custom knowledge base. Upload documents, paste text, or add URLs, and let users ask questions powered by Google Gemini AI and vector search.

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL with pgvector)
- **AI**: Google Gemini (text generation + embeddings)
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Features

- 📄 **Multiple Source Types**: Upload files (PDF, DOCX, XLSX, TXT), paste text, or add URLs
- 🔍 **Vector Search**: Semantic search using Gemini embeddings and pgvector
- 💬 **AI Chat Interface**: Clean, responsive chat UI with source citations
- 🔐 **Admin Dashboard**: Password-protected dashboard for managing sources
- 📊 **Analytics**: View total sources and chunks
- 🤖 **Telegram Integration**: Optional Telegram bot webhook for Q&A via Telegram

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to the SQL Editor in your Supabase dashboard
3. Copy the contents of `supabase/schema.sql` and run it to create all tables and functions

### 2. Get Your API Keys

- **Supabase**: In your Supabase project settings, find:
  - Project URL (`NEXT_PUBLIC_SUPABASE_URL`)
  - Anon/Public Key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
  - Service Role Key (`SUPABASE_SERVICE_ROLE_KEY`)
  
- **Google Gemini**: 
  - Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
  - Create an API key
  - This is your `GEMINI_API_KEY`

- **Telegram** (optional):
  - Message @BotFather on Telegram to create a bot
  - Save the bot token as `TELEGRAM_BOT_TOKEN`

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in the values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
ADMIN_PASSWORD=demo123
TELEGRAM_BOT_TOKEN=your_bot_token (optional)
NEXT_PUBLIC_ADMIN_PASSWORD=demo123
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Public Chat Interface

1. Navigate to the home page (`/`)
2. Type a question in the chat input
3. The AI will respond based on your knowledge base content
4. Sources used for the answer are displayed below each response

### Admin Dashboard

1. Navigate to `/admin`
2. Login with the password from `ADMIN_PASSWORD` (default: `demo123`)
3. **Add Source**: Choose between File, Text, or URL
   - **File**: Upload PDF, DOCX, XLSX, or TXT files
   - **Text**: Paste text content directly
   - **URL**: Enter a website URL to scrape
4. **View Sources**: See all existing sources with delete option
5. **Analytics**: View total sources and chunks count
6. **Deployment**: Find embed code and Telegram setup instructions

## Deployment

### Vercel

1. Push your code to GitHub
2. Import your repository in [Vercel](https://vercel.com)
3. Add all environment variables in Vercel's project settings
4. Deploy!

### Telegram Webhook Setup

After deploying to Vercel (or any HTTPS host):

1. Get your bot token from @BotFather
2. Set the webhook (replace `<BOT_TOKEN>` and `your-domain.com`):

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-domain.com/api/telegram-webhook"
```

3. Verify webhook status:

```bash
curl "https://api.telegram.org/bot<BOT_TOKEN>/getWebhookInfo"
```

Your bot will now respond to messages using your knowledge base!

## Project Structure

```
src/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard (client component)
│   ├── api/
│   │   ├── add-source/       # POST: Add new source (admin only)
│   │   ├── chat/             # POST: Chat with AI
│   │   ├── delete-source/    # POST: Delete source (admin only)
│   │   └── telegram-webhook/ # POST: Telegram bot webhook
│   ├── globals.css           # Global styles + Tailwind
│   ├── layout.tsx            # Root layout with header
│   └── page.tsx              # Public chat interface
├── lib/
│   ├── chunking.ts           # Text chunking utility
│   ├── gemini.ts             # Google Gemini client
│   ├── supabase.ts           # Supabase clients (browser, server, admin)
│   ├── utils.ts              # File/URL text extraction
│   └── vector.ts             # Vector similarity search
└── middleware.ts             # Route protection for /admin
```

## Database Schema

The schema includes:
- `tenants`: Organizations
- `profiles`: Users linked to tenants
- `knowledge_bases`: Knowledge bases per tenant
- `sources`: Documents, URLs, or text content
- `chunks`: Split text with embeddings for vector search
- `match_chunks()`: PostgreSQL function for similarity search

See `supabase/schema.sql` for full schema details.

## License

MIT
