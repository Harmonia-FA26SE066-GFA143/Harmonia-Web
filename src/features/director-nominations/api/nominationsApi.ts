import { apiRequest } from '@/lib/api/client'
import { toQuery, type PagedList } from '@/lib/api/paging'
import type { Nomination, NominationDetail, NominationStats, NominationStatus, Training } from '../types'

// `/api/director-nominations` (Harmonia-BE d74096c, DirectorNominationsController.cs:15-128).

const base = '/api/director-nominations'
const post = <T>(path: string, body?: object) =>
  apiRequest<T>(`${base}${path}`, { method: 'POST', body: body && JSON.stringify(body) })

export const listNominations = (status: NominationStatus | undefined, pageNumber: number, pageSize: number) =>
  apiRequest<PagedList<Nomination>>(`${base}${toQuery({ status, pageNumber, pageSize })}`)
export const getNomination = (id: string) => apiRequest<NominationDetail>(`${base}/${id}`)
export const getEligibility = (memberId: string) => apiRequest<NominationStats>(`${base}/eligibility${toQuery({ memberId })}`)
export const createNomination = (values: { memberId: string; reason: string; proposedChoirId?: string }) => post<NominationDetail>('', values)
export const withdrawNomination = (id: string) => post<NominationDetail>(`/${id}/withdraw`)
export const approveNomination = (id: string) => post<NominationDetail>(`/${id}/approve`)
export const rejectNomination = (id: string, note: string) => post<NominationDetail>(`/${id}/reject`, { note })
export const cancelNomination = (id: string, note: string) => post<NominationDetail>(`/${id}/cancel`, { note })
export const waiveTraining = (id: string, note: string) => post<NominationDetail>(`/${id}/waive-training`, { note })
export const appointNomination = (id: string, choirId: string) => post<NominationDetail>(`/${id}/appoint`, { choirId })

export const listTrainings = (id: string) => apiRequest<Training[]>(`${base}/${id}/trainings`)
export const createTraining = (id: string, values: { courseName: string; organizer?: string; startDate: string; endDate?: string }) =>
  post<Training>(`/${id}/trainings`, values)
export const recordTrainingResult = (id: string, trainingId: string, values: { result: 'Passed' | 'Failed'; note?: string }) =>
  apiRequest<Training>(`${base}/${id}/trainings/${trainingId}/result`, { method: 'PUT', body: JSON.stringify(values) })
export function uploadCertificate(id: string, trainingId: string, file: File) {
  const form = new FormData()
  form.append('file', file)
  return apiRequest<Training>(`${base}/${id}/trainings/${trainingId}/certificate`, { method: 'PUT', body: form })
}
export const deleteTraining = (id: string, trainingId: string) =>
  apiRequest<void>(`${base}/${id}/trainings/${trainingId}`, { method: 'DELETE' })
