import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ApiContractMissingError } from '@/lib/api/errors'
import { createSong, deleteMaterial, getSong, listSongs, updateSong, uploadMaterial } from '../api/songsApi'
import type { MaterialKind, SongValues } from '../types'

// Retrying cannot help while the API contract is missing.
const retry = (failureCount: number, error: Error) => !(error instanceof ApiContractMissingError) && failureCount < 3

const songsKey = ['music-library'] as const

export function useSongs() {
  return useQuery({ queryKey: songsKey, queryFn: listSongs, retry })
}

export function useSong(id: string) {
  return useQuery({ queryKey: [...songsKey, id], queryFn: () => getSong(id), retry })
}

/** Creates a song when `id` is absent, otherwise updates it. */
export function useSaveSong() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: SongValues }) => (id ? updateSong(id, values) : createSong(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: songsKey }),
  })
}

export function useUploadMaterial(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, file }: { kind: MaterialKind; file: File }) => uploadMaterial(songId, kind, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: songsKey }),
  })
}

export function useDeleteMaterial(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: string) => deleteMaterial(songId, materialId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: songsKey }),
  })
}
