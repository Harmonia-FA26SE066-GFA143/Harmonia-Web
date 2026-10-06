import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSong,
  deleteMaterial,
  getSong,
  getSongClassification,
  listMaterials,
  listSongs,
  updateSong,
  updateSongClassification,
  uploadMaterial,
  type SongPage,
} from '../api/songsApi'
import type { MaterialKind, SongClassificationValues, SongFilters, SongValues } from '../types'

const songsKey = ['music-library'] as const
const materialsKey = (songId: string) => ['music-library', 'materials', songId] as const

/** One page of the library; the previous page stays visible while the next one loads. */
export function useSongs(filters: SongFilters, page: SongPage) {
  return useQuery({
    queryKey: [...songsKey, 'list', filters, page],
    queryFn: () => listSongs(filters, page),
    placeholderData: keepPreviousData,
  })
}

export function useSong(id: string) {
  return useQuery({ queryKey: [...songsKey, 'song', id], queryFn: () => getSong(id) })
}

export function useSongClassification(id: string) {
  return useQuery({ queryKey: [...songsKey, 'classification', id], queryFn: () => getSongClassification(id) })
}

/** Creates a song when `id` is absent, otherwise updates it. */
export function useSaveSong() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id?: string; values: SongValues }) => (id ? updateSong(id, values) : createSong(values)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: songsKey }),
  })
}

export function useSaveSongClassification(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: SongClassificationValues) => updateSongClassification(songId, values),
    onSuccess: (classification) => {
      queryClient.setQueryData([...songsKey, 'classification', songId], classification)
      // Library filters match on classification, so cached pages may now be wrong.
      return queryClient.invalidateQueries({ queryKey: [...songsKey, 'list'] })
    },
  })
}

export function useSongMaterials(songId: string) {
  return useQuery({ queryKey: materialsKey(songId), queryFn: () => listMaterials(songId) })
}

export function useUploadMaterial(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ kind, file }: { kind: MaterialKind; file: File }) => uploadMaterial(songId, kind, file),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materialsKey(songId) }),
  })
}

export function useDeleteMaterial(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: string) => deleteMaterial(songId, materialId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materialsKey(songId) }),
  })
}
