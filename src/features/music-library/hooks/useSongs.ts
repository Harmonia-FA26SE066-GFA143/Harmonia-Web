import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSong,
  deleteMaterial,
  deleteSong,
  getSong,
  getSongClassification,
  listLearningProgress,
  listMaterials,
  listSongs,
  updateMaterial,
  updateSong,
  updateSongClassification,
  uploadMaterial,
  type SongPage,
} from '../api/songsApi'
import type {
  LearningStatus,
  MaterialValues,
  SongClassificationValues,
  SongFilters,
  SongValues,
  UploadMaterialValues,
} from '../types'

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
  return useQuery({ queryKey: materialsKey(songId), queryFn: () => listMaterials(songId), enabled: Boolean(songId) })
}

export function useUploadMaterial(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: UploadMaterialValues) => uploadMaterial(songId, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materialsKey(songId) }),
  })
}

export function useDeleteMaterial(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (materialId: string) => deleteMaterial(materialId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materialsKey(songId) }),
  })
}

export function useUpdateMaterial(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, values }: { id: string; values: MaterialValues }) => updateMaterial(id, values),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: materialsKey(songId) }),
  })
}

/** Refreshes the library lists; the deleted song's own queries are left to the page, which leaves. */
export function useDeleteSong() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteSong(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [...songsKey, 'list'] }),
  })
}

/** One page of a material's learning progress; the previous page stays visible while the next one loads. */
export function useLearningProgress(materialId: string, status: LearningStatus | undefined, page: SongPage) {
  return useQuery({
    queryKey: [...songsKey, 'learning-progress', materialId, status, page],
    queryFn: () => listLearningProgress(materialId, status, page),
    placeholderData: keepPreviousData,
  })
}
