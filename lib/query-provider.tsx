'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // Data dianggap fresh selama 5 menit
            gcTime: 10 * 60 * 1000, // Cache disimpan selama 10 menit
            refetchOnWindowFocus: false, // Tidak refetch saat window focus
            retry: 1, // Retry 1 kali jika gagal
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
