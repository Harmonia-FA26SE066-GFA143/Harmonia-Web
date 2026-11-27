import { useQuery } from '@tanstack/react-query'
import { listNominations } from '../api/nominationsApi'

/** Nominations awaiting Parish Priest approval (status=Pending). */
export function usePendingNominationCount() {
  return useQuery({
    queryKey: ['director-nominations', 'count', 'Pending'],
    queryFn: () => listNominations('Pending', 1, 1),
    retry: false,
  }).data?.totalCount
}

/** Nominations trained or waived, awaiting Admin appointment (status=Trained). */
export function useTrainedNominationCount() {
  return useQuery({
    queryKey: ['director-nominations', 'count', 'Trained'],
    queryFn: () => listNominations('Trained', 1, 1),
    retry: false,
  }).data?.totalCount
}
