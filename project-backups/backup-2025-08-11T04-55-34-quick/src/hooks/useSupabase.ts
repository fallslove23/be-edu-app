import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { PostgrestError } from '@supabase/supabase-js'

interface UseSupabaseQueryOptions<TData> {
  queryKey: any[]
  queryFn: () => Promise<TData>
  enabled?: boolean
  refetchInterval?: number
}

export function useSupabaseQuery<TData>({
  queryKey,
  queryFn,
  enabled = true,
  refetchInterval,
}: UseSupabaseQueryOptions<TData>) {
  return useQuery({
    queryKey,
    queryFn,
    enabled,
    refetchInterval,
    retry: 1,
  })
}

interface UseSupabaseMutationOptions<TData, TVariables> {
  mutationFn: (variables: TVariables) => Promise<TData>
  onSuccess?: (data: TData) => void
  onError?: (error: PostgrestError) => void
  invalidateQueries?: any[][]
}

export function useSupabaseMutation<TData, TVariables>({
  mutationFn,
  onSuccess,
  onError,
  invalidateQueries = [],
}: UseSupabaseMutationOptions<TData, TVariables>) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn,
    onSuccess: (data) => {
      invalidateQueries.forEach((queryKey) => {
        queryClient.invalidateQueries({ queryKey })
      })
      onSuccess?.(data)
    },
    onError,
  })
}
