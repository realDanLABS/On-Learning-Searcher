import type { DiagnosisPayload } from '../state/learningFlow'
import { buildSkillGapItems } from '../orchestration/skillGap'

type SkillGapPanelProps = {
  diagnosis: DiagnosisPayload
  title?: string
}

export function SkillGapPanel({ diagnosis, title = '스킬 갭 분석' }: SkillGapPanelProps) {
  const items = buildSkillGapItems(diagnosis.categoryScores)

  return (
    <section className="hero-card">
      <h2>{title}</h2>
      <p className="hint-text">점수 낮은 역량부터 우선 개선이 필요한 영역입니다.</p>
      <div className="skill-gap-list">
        {items.map((item) => (
          <article className="skill-gap-item" key={item.key}>
            <div className="skill-gap-head">
              <strong>{item.label}</strong>
              <span>
                {item.score}점 · {item.relativePercent}%
              </span>
            </div>
            <div className="skill-gap-track" role="progressbar" aria-valuenow={item.relativePercent}>
              <div className={`skill-gap-fill ${item.status}`} style={{ width: `${item.relativePercent}%` }} />
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}
