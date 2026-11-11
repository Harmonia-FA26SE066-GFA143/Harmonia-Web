import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createSong,
  deleteMaterial,
  deleteSong,
  deleteTimedLyrics,
  getMaterialPlayback,
  getSong,
  getSongClassification,
  getTimedLyrics,
  listLearningProgress,
  listMaterials,
  listSongs,
  replaceMaterialFile,
  saveTimedLyrics,
  updateMaterial,
  updateSong,
  updateSongClassification,
  uploadMaterial,
  type SongPage,
} from '../api/songsApi'
import type {
  LearningStatus,
  MaterialValues,
  PlaybackInstrument,
  SongClassificationValues,
  SongFilters,
  SongValues,
  TimedLyricLine,
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

/** A fresh WAV URL and its synchronized notes.json for one MIDI material. */
export function useMaterialPlayback(materialId: string | undefined) {
  return useQuery({
    queryKey: [...songsKey, 'material-playback', materialId],
    queryFn: () => getMaterialPlayback(materialId!),
    enabled: Boolean(materialId),
    // Signed URLs must be obtained again when the user returns instead of being kept as fresh indefinitely.
    staleTime: 0,
  })
}

/** The revision is part of the key: a replaced file drops its timing on the server, so the old answer must not be reused. */
const timedLyricsKey = (materialId: string, revision: number) => [...songsKey, 'timed-lyrics', materialId, revision] as const

export function useTimedLyrics(materialId: string, revision: number) {
  return useQuery({ queryKey: timedLyricsKey(materialId, revision), queryFn: () => getTimedLyrics(materialId) })
}

export function useSaveTimedLyrics(materialId: string, revision: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (values: { lyricsMaterialId: string; lines: TimedLyricLine[] }) => saveTimedLyrics(materialId, values),
    onSuccess: (saved) => queryClient.setQueryData(timedLyricsKey(materialId, revision), saved),
  })
}

export function useDeleteTimedLyrics(materialId: string, revision: number) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: () => deleteTimedLyrics(materialId),
    onSuccess: () => queryClient.setQueryData(timedLyricsKey(materialId, revision), null),
  })
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

/** The material keeps its id, so only its list (file name, size, link) is reloaded. */
export function useReplaceMaterialFile(songId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, file, resetProgress, instrument }: { id: string; file: File; resetProgress: boolean; instrument?: PlaybackInstrument }) =>
      replaceMaterialFile(id, file, resetProgress, instrument),
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
