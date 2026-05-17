# Setup

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your project values.

Required for Supabase-backed mode:

```env
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
VITE_ENABLE_MICROSOFT_AUTH=true
```

Optional:

```env
VITE_API_URL=https://your-backend.example.com/api
```

## 3. Apply database schema

Use the Supabase CLI or SQL editor to apply all files in `supabase/migrations`.

Typical CLI flow:

```bash
supabase link --project-ref your-project-ref
supabase db push
```

Optional demo seed:

```bash
supabase db execute --file supabase/seed/demo.sql
```

## 4. Start the app

```bash
npm run dev
```

## 5. Production verification

```bash
npm run lint
npm run build
```
