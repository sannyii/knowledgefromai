This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Optional: Default AI Provider (default: gemini)
# Available: gemini, openai, deepseek, qwen, anthropic
AI_PROVIDER=gemini

# API Keys (will be used if not set in settings)
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
OPENAI_API_KEY=your_openai_api_key_here
DEEPSEEK_API_KEY=your_deepseek_api_key_here
QWEN_API_KEY=your_qwen_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Optional: Default Model Names (will be used if not set in settings)
GEMINI_MODEL=gemini-1.5-flash  # Available: gemini-1.5-flash, gemini-1.5-pro
OPENAI_MODEL=gpt-4o  # Available: gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo
DEEPSEEK_MODEL=deepseek-chat  # Available: deepseek-chat, deepseek-coder
QWEN_MODEL=qwen-turbo  # Available: qwen-turbo, qwen-plus, qwen-max
ANTHROPIC_MODEL=claude-3-5-sonnet-20241022  # Available: claude-3-5-sonnet-20241022, etc.

# Database
DATABASE_URL="file:./dev.db"
```

**注意**: 如果没有在设置页面配置 API key 和模型，系统会自动使用环境变量中的值。环境变量优先级低于用户在设置页面中的配置。

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
