import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

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

export async function createClient() {
  const cookieStore = await cookies()

  if (!hasValidSupabaseConfig()) {
    return createFallbackSupabaseClient()
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch (error) {
          // The `set` method was called from a Server Component.
          // This can be ignored if you have middleware refreshing
          // user sessions.
        }
      },
    },
  })
}
