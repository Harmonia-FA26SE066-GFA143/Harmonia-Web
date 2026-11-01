import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Flex, Tooltip } from 'antd'
import { generatePath, useNavigate } from 'react-router'
import { paths } from '@/app/router/paths'
import { spacing } from '@/styles/tokens'
import { useAdjacentDirectorPrograms, useAdjacentPriestEvents, type AdjacentProgram } from '../hooks/useAdjacentPrograms'
import { formatProgramDate } from '../programFilters'

export interface AdjacentProgramNavProps {
  previous?: AdjacentProgram
  next?: AdjacentProgram
  /** The detail route of the role, e.g. `paths.priest.programDetail`. */
  detailPath: string
}

const describe = (program: AdjacentProgram) => `${program.name} · ${formatProgramDate(program.date)}`

/** "Lễ trước / Lễ sau" in a program header: each names the program it opens; a missing neighbour is disabled. */
export function AdjacentProgramNav({ previous, next, detailPath }: Readonly<AdjacentProgramNavProps>) {
  const navigate = useNavigate()
  const open = (program: AdjacentProgram) => navigate(generatePath(detailPath, { programId: program.id }))

  return (
    <Flex gap={spacing.xs} role="group" aria-label="Chuyển chương trình">
      <Tooltip title={previous && describe(previous)}>
        <Button
          icon={<LeftOutlined />}
          disabled={!previous}
          onClick={() => previous && open(previous)}
          aria-label={previous ? `Lễ trước: ${describe(previous)}` : 'Không có lễ trước'}
        >
          Lễ trước
        </Button>
      </Tooltip>
      <Tooltip title={next && describe(next)}>
        <Button
          icon={<RightOutlined />}
          iconPlacement="end"
          disabled={!next}
          onClick={() => next && open(next)}
          aria-label={next ? `Lễ sau: ${describe(next)}` : 'Không có lễ sau'}
        >
          Lễ sau
        </Button>
      </Tooltip>
    </Flex>
  )
}

/** Mounted once the program is loaded, so its neighbours are read around a known date. */
export function PriestAdjacentNav({ id, date }: Readonly<{ id: string; date: string }>) {
  return <AdjacentProgramNav {...useAdjacentPriestEvents(id, date)} detailPath={paths.priest.programDetail} />
}

export function DirectorAdjacentNav({ id, date }: Readonly<{ id: string; date: string }>) {
  return <AdjacentProgramNav {...useAdjacentDirectorPrograms(id, date)} detailPath={paths.director.programDetail} />
}
