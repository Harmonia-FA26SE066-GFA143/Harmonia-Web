import type { ReactNode } from 'react'

/** Decorative pictures for empty and error states, drawn on the 240×160 grid and coloured by the `--hm-*` variables. */
function Picture({ width, children }: Readonly<{ width: number; children: ReactNode }>) {
  return (
    <svg aria-hidden width={width} height={(width * 2) / 3} viewBox="0 0 240 160" fill="none" style={{ display: 'block' }}>
      {children}
    </svg>
  )
}

interface IllustrationProps {
  width?: number
}

/** The library is empty: an open songbook with nothing written yet. */
export function EmptySongbook({ width = 180 }: Readonly<IllustrationProps>) {
  return (
    <Picture width={width}>
      <path d="M120 36C96 28 58 26 22 34V134C58 126 96 128 120 136Z" fill="var(--hm-surface-reading)" stroke="var(--hm-action-primary)" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M120 36C144 28 182 26 218 34V134C182 126 144 128 120 136Z" fill="var(--hm-surface-reading)" stroke="var(--hm-action-primary)" strokeWidth="1.2" strokeLinejoin="round"/>
      <path d="M120 36V136" stroke="var(--hm-action-primary)" strokeWidth="1.2"/>
      <path d="M22 134C58 126 96 128 120 136C144 128 182 126 218 134V140C182 132 144 134 120 142C96 134 58 132 22 140Z" fill="var(--hm-action-primary)" fillOpacity=".12" stroke="var(--hm-action-primary)" strokeWidth="1.2" strokeLinejoin="round"/>
      <line x1="34" x2="108" y1="52" y2="52" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="58" y2="58" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="64" y2="64" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="70" y2="70" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="52" y2="52" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="58" y2="58" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="64" y2="64" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="70" y2="70" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="80" y2="80" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="86" y2="86" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="92" y2="92" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="98" y2="98" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="80" y2="80" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="86" y2="86" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="92" y2="92" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="98" y2="98" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="108" y2="108" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="114" y2="114" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="120" y2="120" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="34" x2="108" y1="126" y2="126" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="108" y2="108" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="114" y2="114" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="120" y2="120" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <line x1="132" x2="206" y1="126" y2="126" stroke="var(--hm-action-primary)" strokeOpacity="0.4" strokeWidth="1"/>
      <g fill="var(--hm-action-primary)">
      <rect x="36" y="52" width="4" height="4" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="36" y="58" width="4" height="4" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="35" y="52" width="1.2" height="10"/>
      </g>
      <path d="M150 31V112L156 106L162 112V30" fill="var(--hm-season-purple)" stroke="none"/>
    </Picture>
  )
}

/** Nothing on the schedule: a week of empty days under an arch. */
export function EmptyWeek({ width = 180 }: Readonly<IllustrationProps>) {
  return (
    <Picture width={width}>
      <g stroke="var(--hm-action-primary)" strokeWidth="1.2" strokeLinejoin="round">
      <path d="M40 140V70a80 70 0 0 1 160 0v70"/>
      <path d="M52 140V72a68 58 0 0 1 136 0v68" strokeOpacity=".6"/>
      </g>
      <rect x="62" y="96" width="13" height="32" rx="2" fill="var(--hm-surface-reading)" stroke="var(--hm-border-control)" strokeWidth="1" strokeDasharray="2 2"/>
      <rect x="79" y="96" width="13" height="32" rx="2" fill="var(--hm-surface-reading)" stroke="var(--hm-border-control)" strokeWidth="1" strokeDasharray="2 2"/>
      <rect x="96" y="96" width="13" height="32" rx="2" fill="var(--hm-surface-base)" stroke="var(--hm-action-primary)" strokeWidth="1"/>
      <rect x="113" y="96" width="13" height="32" rx="2" fill="var(--hm-surface-reading)" stroke="var(--hm-border-control)" strokeWidth="1" strokeDasharray="2 2"/>
      <rect x="130" y="96" width="13" height="32" rx="2" fill="var(--hm-surface-reading)" stroke="var(--hm-border-control)" strokeWidth="1" strokeDasharray="2 2"/>
      <rect x="147" y="96" width="13" height="32" rx="2" fill="var(--hm-surface-reading)" stroke="var(--hm-border-control)" strokeWidth="1" strokeDasharray="2 2"/>
      <rect x="164" y="96" width="13" height="32" rx="2" fill="var(--hm-surface-reading)" stroke="var(--hm-border-control)" strokeWidth="1" strokeDasharray="2 2"/>
      <line x1="62" y1="88" x2="181" y2="88" stroke="var(--hm-action-primary)" strokeOpacity=".35"/>
      <rect x="98" y="84" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
    </Picture>
  )
}

/** A place in the choir still open. */
export function MissingPosition({ width = 180 }: Readonly<IllustrationProps>) {
  return (
    <Picture width={width}>
      <rect x="50" y="98" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="50" y="76" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="50" y="54" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="50" y="32" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="90" y="98" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="90" y="76" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="90" y="54" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="130" y="98" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="130" y="76" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="130" y="54" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="170" y="98" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="170" y="76" width="24" height="18" rx="3" fill="var(--hm-area-roster-tint)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2"/>
      <rect x="170" y="54" width="24" height="18" rx="3" fill="var(--hm-surface-base)" stroke="var(--hm-area-roster-cloth)" strokeWidth="1.2" strokeDasharray="3 3"/>
      <line x1="36" y1="124" x2="204" y2="124" stroke="var(--hm-border-control)" strokeWidth="1.2"/>
    </Picture>
  )
}

/** A search that found nothing: the notes rise and fade off the staff. */
export function NoResults({ width = 180 }: Readonly<IllustrationProps>) {
  return (
    <Picture width={width}>
      <line x1="24" x2="216" y1="96" y2="96" stroke="var(--hm-action-primary)" strokeOpacity="0.45" strokeWidth="1"/>
      <line x1="24" x2="216" y1="104" y2="104" stroke="var(--hm-action-primary)" strokeOpacity="0.45" strokeWidth="1"/>
      <line x1="24" x2="216" y1="112" y2="112" stroke="var(--hm-action-primary)" strokeOpacity="0.45" strokeWidth="1"/>
      <line x1="24" x2="216" y1="120" y2="120" stroke="var(--hm-action-primary)" strokeOpacity="0.45" strokeWidth="1"/>
      <rect x="40" y="104" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1.0"/>
      <rect x="60" y="100" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1.0"/>
      <rect x="80" y="108" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1.0"/>
      <rect x="100" y="96" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1.0"/>
      <rect x="120" y="87" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="0.83"/>
      <rect x="140" y="78" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="0.66"/>
      <rect x="160" y="77" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="0.49"/>
      <rect x="180" y="60" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="0.32"/>
      <rect x="200" y="55" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="0.15"/>
      <rect x="210" y="98" width="3.5" height="6" fill="var(--hm-action-primary)"/>
      <rect x="212.5" y="88" width="1" height="12" fill="var(--hm-action-primary)"/>
    </Picture>
  )
}

/** Nothing is waiting: a finished line of chant. */
export function AllDone({ width = 180 }: Readonly<IllustrationProps>) {
  return (
    <Picture width={width}>
      <g fill="var(--hm-action-primary)">
      <rect x="20" y="66" width="5" height="4"/>
      <rect x="20" y="74" width="5" height="4"/>
      <rect x="19" y="66" width="1.4" height="12"/>
      </g>
      <line x1="16" x2="224" y1="64" y2="64" stroke="var(--hm-action-primary)" strokeOpacity="0.45" strokeWidth="1"/>
      <line x1="16" x2="224" y1="72" y2="72" stroke="var(--hm-action-primary)" strokeOpacity="0.45" strokeWidth="1"/>
      <line x1="16" x2="224" y1="80" y2="80" stroke="var(--hm-action-primary)" strokeOpacity="0.45" strokeWidth="1"/>
      <line x1="16" x2="224" y1="88" y2="88" stroke="var(--hm-action-primary)" strokeOpacity="0.45" strokeWidth="1"/>
      <rect x="30" y="81" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="44" y="77" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="58" y="81" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="72" y="73" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="72" y="81" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="90" y="69" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="104" y="73" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="118" y="77" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="134" y="73" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="148" y="77" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="162" y="81" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="176" y="85" width="7" height="7" fill="var(--hm-action-primary)" fillOpacity="1"/>
      <rect x="78" y="73" width="1.2" height="14" fill="var(--hm-action-primary)"/>
      <rect x="196" y="63" width="1.4" height="26" fill="var(--hm-action-primary)"/>
      <rect x="201" y="63" width="4" height="26" fill="var(--hm-action-primary)"/>
      <circle cx="203" cy="42" r="16" stroke="var(--hm-gilt)" strokeWidth="1.2"/>
      <circle cx="203" cy="42" r="10" stroke="var(--hm-gilt)" strokeWidth="1.2"/>
      <circle cx="203" cy="42" r="3.5" stroke="var(--hm-gilt)" strokeWidth="1.2"/>
      <line stroke="var(--hm-gilt)" strokeWidth="1.2" x1="206.50" y1="42.00" x2="213.00" y2="42.00"/>
      <line stroke="var(--hm-gilt)" strokeWidth="1.2" x1="205.47" y1="44.47" x2="210.07" y2="49.07"/>
      <line stroke="var(--hm-gilt)" strokeWidth="1.2" x1="203.00" y1="45.50" x2="203.00" y2="52.00"/>
      <line stroke="var(--hm-gilt)" strokeWidth="1.2" x1="200.53" y1="44.47" x2="195.93" y2="49.07"/>
      <line stroke="var(--hm-gilt)" strokeWidth="1.2" x1="199.50" y1="42.00" x2="193.00" y2="42.00"/>
      <line stroke="var(--hm-gilt)" strokeWidth="1.2" x1="200.53" y1="39.53" x2="195.93" y2="34.93"/>
      <line stroke="var(--hm-gilt)" strokeWidth="1.2" x1="203.00" y1="38.50" x2="203.00" y2="32.00"/>
      <line stroke="var(--hm-gilt)" strokeWidth="1.2" x1="205.47" y1="39.53" x2="210.07" y2="34.93"/>
      <circle cx="215.01" cy="46.97" r="2.6" stroke="var(--hm-gilt)" strokeWidth="1"/>
      <circle cx="207.97" cy="54.01" r="2.6" stroke="var(--hm-gilt)" strokeWidth="1"/>
      <circle cx="198.03" cy="54.01" r="2.6" stroke="var(--hm-gilt)" strokeWidth="1"/>
      <circle cx="190.99" cy="46.97" r="2.6" stroke="var(--hm-gilt)" strokeWidth="1"/>
      <circle cx="190.99" cy="37.03" r="2.6" stroke="var(--hm-gilt)" strokeWidth="1"/>
      <circle cx="198.03" cy="29.99" r="2.6" stroke="var(--hm-gilt)" strokeWidth="1"/>
      <circle cx="207.97" cy="29.99" r="2.6" stroke="var(--hm-gilt)" strokeWidth="1"/>
      <circle cx="215.01" cy="37.03" r="2.6" stroke="var(--hm-gilt)" strokeWidth="1"/>
    </Picture>
  )
}

/** No people yet: the choir seats under an arch, all open. */
export function EmptyChoir({ width = 180 }: Readonly<IllustrationProps>) {
  return (
    <Picture width={width}>
      <g stroke="var(--hm-action-primary)" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M34 140V74a86 66 0 0 1 172 0v66" />
        <path d="M46 140V76a74 54 0 0 1 148 0v64" strokeOpacity=".5" />
      </g>
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2, 3, 4].map((seat) => (
          <circle key={`${row}-${seat}`} cx={76 + seat * 22} cy={82 + row * 20} r="6.5" fill="var(--hm-surface-reading)" stroke="var(--hm-border-control)" strokeDasharray="2 2" />
        )),
      )}
      <line x1="60" x2="180" y1="140" y2="140" stroke="var(--hm-action-primary)" strokeOpacity=".4" />
    </Picture>
  )
}

/** Another role's workspace: a closed door under an arch. */
export function LockedDoor({ width = 180 }: Readonly<IllustrationProps>) {
  return (
    <Picture width={width}>
      <g stroke="var(--hm-action-primary)" strokeWidth="1.2" strokeLinejoin="round">
        <path d="M62 142V72a58 54 0 0 1 116 0v70Z" fill="var(--hm-surface-reading)" />
        <path d="M74 142V74a46 42 0 0 1 92 0v68" strokeOpacity=".5" />
        <path d="M120 32v110" />
      </g>
      <g stroke="var(--hm-action-primary)" strokeWidth="1.2" fill="var(--hm-surface-base)">
        <rect x="108" y="88" width="24" height="20" rx="2" />
        <path d="M113 88v-7a7 7 0 0 1 14 0v7" fill="none" />
      </g>
      <rect x="118" y="95" width="4" height="7" fill="var(--hm-action-primary)" />
      <line x1="40" x2="200" y1="142" y2="142" stroke="var(--hm-action-primary)" strokeOpacity=".4" />
    </Picture>
  )
}

/** A page that does not exist: a leaf with its second staff missing. */
export function LostLeaf({ width = 180 }: Readonly<IllustrationProps>) {
  return (
    <Picture width={width}>
      <path d="M64 24h92l24 24v92H64Z" fill="var(--hm-surface-reading)" stroke="var(--hm-action-primary)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d="M156 24v24h24" fill="none" stroke="var(--hm-action-primary)" strokeWidth="1.2" strokeLinejoin="round" />
      {[58, 64, 70, 76].map((y) => (
        <line key={y} x1="76" x2="168" y1={y} y2={y} stroke="var(--hm-action-primary)" strokeOpacity=".4" />
      ))}
      {[106, 112, 118, 124].map((y) => (
        <line key={y} x1="76" x2="168" y1={y} y2={y} stroke="var(--hm-border-control)" strokeOpacity=".6" strokeDasharray="3 3" />
      ))}
      <rect x="84" y="63" width="6" height="6" fill="var(--hm-action-primary)" />
      <rect x="100" y="59" width="6" height="6" fill="var(--hm-action-primary)" />
      <rect x="116" y="66" width="6" height="6" fill="var(--hm-action-primary)" />
    </Picture>
  )
}
