import { createBrowserClient } from '@supabase/ssr'

function hasValidSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const isPlaceholder = (value?: string) =>
    !value || value.includes('your_') || value.includes('your-') || value.includes('placeholder')

  return Boolean(url && key && !isPlaceholder(url) && !isPlaceholder(key))
}

function createFallbackSupabaseClient() {
  const createQuery = (data: unknown) => {
    const query: any = {
      eq: () => query,
      limit: () => query,
      single: () => query,
      then: (resolve: (value: { data: unknown; error: null }) => void) => resolve({ data, error: null }),
    }
    return query
  }

  return {
    from: () => ({
      select: () => createQuery([]),
      insert: () => ({
        select: () => ({
          single: () => createQuery(null),
        }),
      }),
      update: () => ({
        eq: () => ({
          select: () => ({
            single: () => createQuery(null),
          }),
        }),
      }),
      delete: () => ({
        eq: () => createQuery(null),
      }),
    }),
    auth: {
      getUser: async () => ({ data: { user: null }, error: null }),
    },
  } as any
}

export function createClient() {
  if (!hasValidSupabaseConfig()) {
    return createFallbackSupabaseClient()
  }

  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
