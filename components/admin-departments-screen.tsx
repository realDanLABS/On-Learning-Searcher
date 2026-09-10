'use client'

import { useEffect, useMemo, useState } from 'react'

import { fetchAdminDepartmentsPayload, type AdminDepartmentsPayload } from '@/lib/admin-client'

const DEPARTMENT_BAR_COLOR = '#2563eb'
const DASHBOARD_CARD_SHADOW = '0 4px 10px rgba(15, 23, 42, 0.05)'

function statusStyle(tone: 'emerald' | 'blue' | 'slate'): React.CSSProperties {
  if (tone === 'emerald') {
    return { background: '#e7f8ee', color: '#18794e' }
  }
  if (tone === 'blue') {
    return { background: '#eff6ff', color: '#2563eb' }
  }
  return { background: '#eef2f7', color: '#5e6c80' }
}

export function AdminDepartmentsScreen() {
  const [payload, setPayload] = useState<AdminDepartmentsPayload | null>(null)
  const [selectedDivision, setSelectedDivision] = useState('')
  const [loading, setLoading] = useState(true)

  async function load(division?: string) {
    setLoading(true)
    try {
      const next = await fetchAdminDepartmentsPayload(division)
      setPayload(next)
      setSelectedDivision(next.focusDivision || '')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const visibleDepartments = useMemo(() => {
    if (!payload) return []
    if (payload.focusDivision) {
      return payload.departments.filter((item) => item.name === payload.focusDivision)
    }
    return payload.departments
  }, [payload])

  if (loading && !payload) {
    return <div className="app-bootstrap-loading">부서 분석 데이터를 불러오는 중입니다...</div>
  }

  if (!payload) {
    return <div className="app-bootstrap-loading">부서 분석 데이터를 불러오지 못했습니다.</div>
  }

  return (
    <main
      style={{
        width: 'min(1280px, calc(100% - 48px))',
        margin: '0 auto',
        padding: '28px 0 48px',
        overflowX: 'clip',
      }}
    >
      <section style={{ marginBottom: 24 }}>
        <h1
          style={{
            margin: 0,
            fontSize: 32,
            lineHeight: 1.15,
            letterSpacing: '-0.04em',
            fontWeight: 900,
            color: '#17212f',
          }}
        >
          부서 분석
        </h1>
        <p
          style={{
            margin: '10px 0 0',
            fontSize: 14,
            lineHeight: 1.6,
            color: '#607087',
          }}
        >
          회사 주요 본부와 사업부의 학습 참여 현황을 부서별로 분석하고 비교할 수 있습니다.
        </p>
      </section>

      <section
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'flex-end',
          gap: 16,
          marginBottom: 24,
          padding: 22,
          borderRadius: 18,
          background: 'rgba(255, 255, 255, 0.94)',
          border: '1px solid #e5ebf2',
          boxShadow: DASHBOARD_CARD_SHADOW,
        }}
      >
        <div style={{ flex: '1 1 280px', minWidth: 240 }}>
          <label
            style={{
              display: 'block',
              marginBottom: 10,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: '0.08em',
              color: '#607087',
            }}
          >
            분석 부서 선택
          </label>
          <div style={{ position: 'relative' }}>
            <select
              style={{
                width: '100%',
                appearance: 'none',
                border: '1px solid rgba(201, 211, 224, 0.96)',
                borderRadius: 14,
                minHeight: 46,
                padding: '11px 44px 11px 16px',
                background: '#f7f9fc',
                color: '#17212f',
                fontSize: 14,
                fontWeight: 700,
              }}
              value={selectedDivision}
              onChange={(event) => setSelectedDivision(event.target.value)}
            >
              <option value="">전체 부서</option>
              {payload.filters.map((label) => (
                <option key={label} value={label}>
                  {label}
                </option>
              ))}
            </select>
            <span
              className="material-symbols-outlined"
              style={{
                position: 'absolute',
                right: 12,
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                pointerEvents: 'none',
              }}
            >
              unfold_more
            </span>
          </div>
        </div>
        <button
          className="admin-accent-btn"
          onClick={() => void load(selectedDivision || undefined)}
          style={{ minWidth: 112, minHeight: 46, paddingTop: 11, paddingBottom: 11 }}
          type="button"
        >
          필터 적용
        </button>
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: 18,
          marginBottom: 24,
        }}
      >
        {payload.kpis.map((item, index) => (
          <article
            key={item.label}
            style={{
              padding: 24,
              borderRadius: 18,
              background: 'rgba(255, 255, 255, 0.94)',
              border: '1px solid #e5ebf2',
              boxShadow: DASHBOARD_CARD_SHADOW,
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                gap: 12,
                marginBottom: 14,
              }}
            >
              <span
                className="material-symbols-outlined"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 42,
                  height: 42,
                  borderRadius: 14,
                  background: '#edf4ff',
                  color: '#2751a3',
                }}
              >
                {index === 0 ? 'groups' : index === 1 ? 'psychology' : 'task_alt'}
              </span>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                  color: item.tone === 'positive' ? '#18794e' : '#9a5b00',
                }}
              >
                {item.delta}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 14,
                fontWeight: 700,
                color: '#607087',
              }}
            >
              {item.label}
            </p>
            <strong
              style={{
                display: 'block',
                marginTop: 8,
                fontSize: 32,
                lineHeight: 1.1,
                fontWeight: 900,
                color: '#17212f',
              }}
            >
              {item.value}
            </strong>
          </article>
        ))}
      </section>

      <section
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
          gap: 18,
          marginBottom: 24,
          alignItems: 'start',
        }}
      >
        <article
          style={{
            padding: 24,
            borderRadius: 18,
            background: 'rgba(255, 255, 255, 0.94)',
            border: '1px solid #e5ebf2',
            boxShadow: DASHBOARD_CARD_SHADOW,
            minWidth: 0,
          }}
        >
          <div style={{ marginBottom: 22 }}>
            <h2
              style={{
                margin: 0,
                fontSize: 18,
                lineHeight: 1.2,
                fontWeight: 800,
                color: '#17212f',
              }}
            >
              부서별 핵심 역량 수준 비교
            </h2>
            <p
              style={{
                margin: '8px 0 0',
                fontSize: 12,
                color: '#607087',
              }}
            >
              {payload.focusDivision ? `${payload.focusDivision}와 전사 평균을 비교합니다.` : '전사 평균 기준 핵심 역량 분석입니다.'}
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: `repeat(${payload.competencyComparison.length}, minmax(0, 1fr))`,
              gap: 16,
              alignItems: 'end',
              minHeight: 270,
              padding: '18px 12px 8px',
              borderRadius: 20,
              background: '#f7f9fc',
            }}
          >
            {payload.competencyComparison.map((item) => (
              <div
                key={item.label}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: 8,
                  minHeight: 220,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    gap: 8,
                    height: 180,
                    width: '100%',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 6,
                      height: '100%',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#607087' }}>{item.departmentScore}점</span>
                    <div
                      style={{
                        width: 28,
                        minHeight: 24,
                        height: `${Math.max(24, Math.round((item.departmentScore / 100) * 160))}px`,
                        borderRadius: 0,
                        background: DEPARTMENT_BAR_COLOR,
                      }}
                    />
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'flex-end',
                      gap: 6,
                      height: '100%',
                    }}
                  >
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>{item.overallScore}점</span>
                    <div
                      style={{
                        width: 28,
                        minHeight: 18,
                        height: `${Math.max(18, Math.round((item.overallScore / 100) * 160))}px`,
                        borderRadius: 0,
                        background: '#cbd5e1',
                      }}
                    />
                  </div>
                </div>
                <span
                  style={{
                    fontSize: 11,
                    lineHeight: 1.35,
                    fontWeight: 800,
                    color: '#607087',
                    textAlign: 'center',
                    wordBreak: 'keep-all',
                  }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 24,
              marginTop: 16,
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#607087', fontWeight: 700 }}>
              <span style={{ width: 12, height: 12, background: DEPARTMENT_BAR_COLOR }} />
              {payload.focusDivision || '전사 점수'}
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#607087', fontWeight: 700 }}>
              <span style={{ width: 12, height: 12, background: '#cbd5e1' }} />
              전사 평균
            </span>
          </div>
        </article>

        <article
          style={{
            padding: 24,
            borderRadius: 18,
            background: 'rgba(255, 255, 255, 0.94)',
            border: '1px solid #e5ebf2',
            boxShadow: DASHBOARD_CARD_SHADOW,
            minWidth: 0,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: 1.2,
              fontWeight: 800,
              color: '#17212f',
            }}
          >
            부서별 최다 추천 과정 TOP 5
          </h2>
          <div style={{ marginTop: 58, display: 'grid', gap: 24, paddingBottom: 28 }}>
            {(payload.topCourses.length ? payload.topCourses : [{ rank: 1, title: '추천 데이터가 아직 없습니다', percent: 0 }]).map((item) => (
              <div
                key={`${item.rank}-${item.title}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '32px minmax(0, 1fr) auto',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <strong style={{ fontSize: 18, fontWeight: 900, fontStyle: 'italic', color: '#2751a3' }}>
                  {String(item.rank).padStart(2, '0')}
                </strong>
                <div>
                  <p
                    style={{
                      margin: 0,
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#17212f',
                      overflow: 'hidden',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {item.title}
                  </p>
                  <div
                    style={{
                      marginTop: 8,
                      height: 6,
                      borderRadius: 999,
                      background: '#edf2f7',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${item.percent}%`,
                        height: '100%',
                        borderRadius: 999,
                        background: '#cbd5e1',
                      }}
                    />
                  </div>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#607087' }}>{item.percent}%</span>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section
        style={{
          overflow: 'hidden',
          borderRadius: 18,
          background: 'rgba(255, 255, 255, 0.94)',
          border: '1px solid #e5ebf2',
          boxShadow: DASHBOARD_CARD_SHADOW,
        }}
      >
        <div
          style={{
            padding: '22px 24px',
            borderBottom: '1px solid rgba(201, 211, 224, 0.96)',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 18,
              lineHeight: 1.2,
              fontWeight: 800,
              color: '#17212f',
            }}
          >
            부서별 상세 학습 현황
          </h2>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 900 }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                {['부서명', '인원수', '참여율', '학습 필요 시간', '주요 강점 역량', '상태'].map((label) => (
                  <th
                    key={label}
                    style={{
                      padding: '18px 24px',
                      fontSize: 12,
                      letterSpacing: '0.06em',
                      fontWeight: 800,
                      color: '#607087',
                      textAlign: 'center',
                    }}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDepartments.map((row) => (
                <tr key={row.name} style={{ borderTop: '1px solid rgba(226, 232, 240, 0.9)' }}>
                  <td style={{ padding: '20px 24px 20px 36px', fontSize: 14, fontWeight: 700, color: '#17212f', textAlign: 'left' }}>{row.name}</td>
                  <td style={{ padding: '20px 24px', fontSize: 14, textAlign: 'center', color: '#17212f' }}>{row.users}명</td>
                  <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        ...(row.participation >= 85
                          ? { background: '#e7f8ee', color: '#18794e' }
                          : row.participation >= 70
                            ? { background: '#fff4df', color: '#9a5b00' }
                            : { background: '#fee4e2', color: '#b42318' }),
                      }}
                    >
                      {row.participation}%
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', fontSize: 14, textAlign: 'center', color: '#17212f' }}>{row.avgLearningHours}h</td>
                  <td style={{ padding: '20px 24px', fontSize: 14, color: '#17212f', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '6px 10px',
                        borderRadius: 999,
                        background: '#eef2f7',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#4b5563',
                      }}
                    >
                      {row.topStrength}
                    </span>
                  </td>
                  <td style={{ padding: '20px 24px', textAlign: 'center' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        padding: '6px 10px',
                        borderRadius: 999,
                        fontSize: 12,
                        fontWeight: 800,
                        ...statusStyle(row.statusTone),
                      }}
                    >
                      {row.statusLabel}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            padding: '16px 24px',
            background: '#f8fafc',
            borderTop: '1px solid rgba(201, 211, 224, 0.96)',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 12,
              fontWeight: 700,
              color: '#607087',
            }}
          >
            {payload.focusDivision
              ? `${payload.focusDivision} 상세 현황 표시`
              : `표시된 행: 1-${visibleDepartments.length} / 전체: ${payload.summary.departmentCount}개 본부/사업부`}
          </p>
        </div>
      </section>
    </main>
  )
}
