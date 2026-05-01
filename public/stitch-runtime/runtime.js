(function () {
  const page = window.location.pathname.split('/').pop() || ''
  let currentPayload = null
  let recommendationState = null
  let chatbotState = null
  let shellClockTimer = null
  let lastPostedHeight = 0
  const KEY_AUTH = 'on_learning_authenticated_v1'
  const KEY_PROFILE = 'on_learning_user_profile_v1'
  const KEY_ROLE = 'on_learning_user_role_v1'
  const KEY_SESSION_STARTED_AT = 'on_learning_session_started_at_v1'
  const ADMIN_PAGES = new Set([
    '11-admin-dashboard.html',
    '12-admin-departments.html',
    '13-admin-questions.html',
    '14-admin-courses.html',
    '15-admin-users.html',
    '16-admin-boards.html',
  ])
  const ADMIN_NAV_ITEMS = [
    { label: '대시보드', route: '/admin' },
    { label: '부서 분석', route: '/admin/departments' },
    { label: '과정 관리', route: '/admin/courses' },
    { label: '회원 관리', route: '/admin/users' },
    { label: '공지 / FAQ', route: '/admin/boards' },
    { label: '시스템 설정', route: '/admin/settings' },
  ]

  const post = (type, extra = {}) => {
    window.parent.postMessage({ source: 'stitch-runtime', type, page, ...extra }, window.location.origin)
  }

  const qs = (selector, root = document) => root.querySelector(selector)
  const qsa = (selector, root = document) => Array.from(root.querySelectorAll(selector))
  const ensureHomeMotionStyles = () => {
    const styleId = 'on-learning-home-motion'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      .home-course-flow {
        scrollbar-width: none;
        -ms-overflow-style: none;
      }

      .home-course-flow::-webkit-scrollbar {
        display: none;
      }

      .home-reveal {
        opacity: 0;
        transform: translateY(34px);
        transition: opacity 700ms ease, transform 700ms ease;
        will-change: opacity, transform;
      }

      .home-reveal.is-visible {
        opacity: 1;
        transform: translateY(0);
      }

      @media (prefers-reduced-motion: reduce) {
        .home-reveal {
          opacity: 1;
          transform: none;
          transition: none;
        }
      }
    `
    document.head.appendChild(style)
  }

  const setupHomeReveal = (main) => {
    if (!main) return
    ensureHomeMotionStyles()
    const targets = qsa(':scope > section', main)
    if (!targets.length) return

    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      targets.forEach((section) => section.classList.add('home-reveal', 'is-visible'))
      return
    }

    if (main.__homeRevealObserver) {
      main.__homeRevealObserver.disconnect()
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 })

    targets.forEach((section, index) => {
      section.classList.add('home-reveal')
      section.style.transitionDelay = `${Math.min(index * 70, 280)}ms`
      observer.observe(section)
    })
    main.__homeRevealObserver = observer
  }

  const ensureShellTypography = () => {
    const styleId = 'on-learning-shell-typography'
    if (document.getElementById(styleId)) return

    const style = document.createElement('style')
    style.id = styleId
    style.textContent = `
      html,
      body {
        font-family: 'SUIT Variable', 'Pretendard Variable', 'Pretendard', 'Noto Sans KR', sans-serif !important;
      }

      [data-stitch-shell],
      [data-stitch-shell] a,
      [data-stitch-shell] button,
      [data-stitch-shell] span:not(.material-symbols-outlined),
      [data-stitch-shell] p {
        font-family: 'SUIT Variable', 'Pretendard Variable', 'Pretendard', 'Noto Sans KR', sans-serif !important;
      }

      [data-stitch-shell] .material-symbols-outlined {
        font-family: 'Material Symbols Outlined' !important;
        font-weight: normal !important;
        font-style: normal !important;
        line-height: 1 !important;
        letter-spacing: normal !important;
        text-transform: none !important;
        display: inline-block !important;
        white-space: nowrap !important;
        word-wrap: normal !important;
        direction: ltr !important;
        -webkit-font-smoothing: antialiased !important;
      }

      [data-stitch-shell] [data-stitch-shell-nav] {
        font-size: 14px !important;
        font-weight: 500 !important;
        line-height: 1.4 !important;
        letter-spacing: -0.01em !important;
        color: #64748b !important;
      }

      [data-stitch-shell] [data-stitch-shell-nav]:hover {
        color: #002c5f !important;
      }
    `
    document.head.appendChild(style)
  }
  const setText = (node, value) => {
    if (node) node.textContent = value == null ? '' : String(value)
  }
  const formatDate = (value) => {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '-'
    return new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(date)
  }
  const escapeHtml = (value) => String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  const formatStatusLabel = (status) => {
    if (status === 'requested') return '신청요청'
    if (status === 'enrolled') return '수강완료'
    if (status === 'return-missing') return '확인필요'
    if (status === 'failed') return '신청실패'
    return '-'
  }
  const getCurrentRoute = () => {
    const byPage = {
      '01-home.html': '/',
      '02-diagnosis.html': '/diagnosis',
      '03-diagnosis-results.html': '/diagnosis/results',
      '04-learning-path.html': '/learning-path',
      '05-recommendation.html': '/recommendation',
      '06-course-linking.html': '/course-linking',
      '07-history.html': '/history',
      '08-analytics.html': '/analytics',
      '09-chatbot.html': '/chatbot',
      '10-platform-intro.html': '/platform-intro',
      '11-admin-dashboard.html': '/admin',
      '12-admin-departments.html': '/admin/departments',
      '13-admin-questions.html': '/admin/questions',
      '14-admin-courses.html': '/admin/courses',
      '15-admin-users.html': '/admin/users',
      '16-admin-boards.html': '/admin/boards',
    }
    return byPage[page] || '/'
  }
  const isAdminPage = () => ADMIN_PAGES.has(page)
  const parseJson = (value) => {
    if (!value) return null
    try {
      return JSON.parse(value)
    } catch {
      return null
    }
  }
  const getShellState = () => {
    const authenticated = localStorage.getItem(KEY_AUTH) === '1'
    const profile = parseJson(localStorage.getItem(KEY_PROFILE))
    const role = localStorage.getItem(KEY_ROLE) || 'employee'
    if (authenticated && !localStorage.getItem(KEY_SESSION_STARTED_AT)) {
      localStorage.setItem(KEY_SESSION_STARTED_AT, new Date().toISOString())
    }
    return {
      authenticated,
      name: authenticated ? (profile?.name || currentPayload?.userName || '사용자') : '',
      organization: authenticated ? (profile?.organization || currentPayload?.organization || '') : '',
      role,
      sessionStartedAt: authenticated ? localStorage.getItem(KEY_SESSION_STARTED_AT) : null,
    }
  }
  const formatElapsed = (startedAt) => {
    if (!startedAt) return '00:00:00'
    const start = new Date(startedAt).getTime()
    if (Number.isNaN(start)) return '00:00:00'
    const diff = Math.max(0, Math.floor((Date.now() - start) / 1000))
    const hours = String(Math.floor(diff / 3600)).padStart(2, '0')
    const minutes = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
    const seconds = String(diff % 60).padStart(2, '0')
    return `${hours}:${minutes}:${seconds}`
  }
  const getJourneySnapshot = () => {
    const diagnosis = parseJson(localStorage.getItem('on_learning_diagnosis_payload_v1'))
    const selectedCourse = parseJson(localStorage.getItem('on_learning_selected_course_v1'))
    const enrollments = parseJson(localStorage.getItem('on_learning_enrollment_records_v1')) || []
    const hasEnrolled = Array.isArray(enrollments)
      ? enrollments.some((item) => item && item.enrollmentStatus === 'enrolled')
      : false
    if (hasEnrolled) return 'enrollment_done'
    if (selectedCourse) return 'course_selected'
    if (diagnosis) return 'diagnosis_done'
    return 'start'
  }
  const resolveNavRoute = (targetRoute) => {
    const shell = getShellState()
    if (targetRoute === '/') return { route: '/' }
    if (!shell.authenticated) return { route: `/login?next=${encodeURIComponent(targetRoute)}` }
    if (targetRoute === '/diagnosis') return { route: '/diagnosis' }
    if (targetRoute === '/chatbot') return { route: '/chatbot' }
    if (targetRoute === '/history') return { route: '/history' }
    return { route: targetRoute }
  }
  const resolveUtilityTarget = (text) => {
    const normalized = (text || '').replace(/\s+/g, ' ').trim()
    if (!normalized) return null
    if (normalized.includes('교육과정') || normalized.includes('과정찾기')) {
      return { route: '/recommendation' }
    }
    if (normalized.includes('플랫폼 소개') || normalized.includes('서비스 소개')) {
      return { route: '/platform-intro' }
    }
    if (normalized.includes('학습지원') || normalized.includes('고객지원') || normalized.includes('고객 지원') || normalized.includes('도움말') || normalized.includes('피드백')) {
      return { route: '/chatbot' }
    }
    if (normalized.includes('마이페이지') || normalized.includes('학습이력') || normalized.includes('학습 이력') || normalized.includes('내 학습 현황')) {
      return { route: '/history' }
    }
    if (normalized.includes('추천 로드맵')) {
      return { route: '/learning-path' }
    }
    if (normalized.includes('학습홈') || normalized === '홈') {
      return { route: '/' }
    }
    if (normalized.includes('전체 자동 액션 실행')) {
      return { action: 'notify', data: { message: '즉시 권장 액션 실행을 시작했습니다. 실제 연동 전까지는 운영 메모만 기록됩니다.' } }
    }
    if (normalized.includes('사례 공유')) {
      return { action: 'notify', data: { message: '사례 공유 기능은 준비 중입니다. 우선 운영 분석 인사이트를 팀에 전달해 주세요.' } }
    }
    if (normalized.includes('독려 알림')) {
      return { action: 'notify', data: { message: '독려 알림 발송 기능은 준비 중입니다. 현재는 챗봇과 운영 분석을 통해 대상자를 확인해 주세요.' } }
    }
    if (normalized.includes('집중 워크숍')) {
      return { action: 'notify', data: { message: '집중 워크숍 개설 기능은 준비 중입니다. 우선 추천 학습 경로를 공유해 주세요.' } }
    }
    if (normalized.includes('승인 촉구')) {
      return { action: 'notify', data: { message: '승인 촉구 기능은 준비 중입니다. 현재는 운영 분석 대시보드의 병목 구간을 참고해 주세요.' } }
    }
    if (normalized.includes('notifications')) {
      return { action: 'notify', data: { message: '새 알림은 아직 없습니다.' } }
    }
    if (normalized.includes('help_outline')) {
      return { route: '/chatbot' }
    }
    if (normalized.includes('고객 지원') || normalized.includes('고객지원') || normalized.includes('도움말') || normalized.includes('피드백')) {
      return { route: '/chatbot' }
    }
    if (normalized.includes('개인정보처리방침') || normalized.includes('개인정보 처리방침')) {
      return { action: 'notify', data: { message: '개인정보처리방침 문서는 준비 중입니다.' } }
    }
    if (normalized.includes('이용약관') || normalized.includes('이용 약관')) {
      return { action: 'notify', data: { message: '이용약관 문서는 준비 중입니다.' } }
    }
    if (normalized.includes('상세 리포트')) {
      return { action: 'notify', data: { message: '상세 리포트는 준비 중입니다. 현재 대시보드 수치를 기준으로 운영 판단을 진행해 주세요.' } }
    }
    if (normalized.includes('Excel 다운로드')) {
      return { action: 'notify', data: { message: 'Excel 다운로드는 준비 중입니다.' } }
    }
    if (normalized.includes('필터 설정')) {
      return { action: 'notify', data: { message: '필터 설정은 준비 중입니다.' } }
    }
    if (normalized.includes('시스템 설정')) {
      return { action: 'goto', data: { path: '/admin/settings' } }
    }
    if (normalized.includes('부서 관리')) {
      return { action: 'notify', data: { message: '부서 관리 상세 화면은 준비 중입니다. 현재는 운영 분석 대시보드에서 현황을 확인하실 수 있습니다.' } }
    }
    if (normalized.includes('회원가입')) return { route: '/signup' }
    if (normalized.includes('로그아웃')) return { action: 'logout' }
    if (normalized.includes('로그인')) return { route: '/login' }
    return null
  }
  const ensureFilterStatus = (host, key, formatter) => {
    if (!host) return null
    let status = host.querySelector(`[data-admin-filter-status="${key}"]`)
    if (!status) {
      status = document.createElement('p')
      status.setAttribute('data-admin-filter-status', key)
      status.className = 'mt-2 text-xs text-slate-500'
      host.appendChild(status)
    }
    status.textContent = formatter
    return status
  }
  const ensureEmptyState = (host, key, message) => {
    if (!host) return null
    let empty = host.querySelector(`[data-admin-empty-state="${key}"]`)
    if (!empty) {
      empty = document.createElement('div')
      empty.setAttribute('data-admin-empty-state', key)
      empty.className = 'hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 text-center'
      host.appendChild(empty)
    }
    empty.textContent = message
    return empty
  }
  const updateFilteredListState = ({ host, key, total, visible, message, formatter }) => {
    ensureFilterStatus(host, key, formatter(visible, total))
    const empty = ensureEmptyState(host, key, message)
    if (empty) empty.classList.toggle('hidden', visible !== 0)
  }
  const resolveAdminTarget = (text) => {
    const normalized = (text || '').replace(/\s+/g, ' ').trim().toLowerCase()
    if (!normalized) return null
    if (normalized.includes('dashboard') || normalized.includes('overview') || normalized.includes('대시보드')) {
      return { route: '/admin' }
    }
    if (
      normalized.includes('department') ||
      normalized.includes('부서') ||
      normalized.includes('participation') ||
      normalized.includes('completion rates') ||
      normalized.includes('skill gaps') ||
      normalized.includes('reports')
    ) {
      return { route: '/admin/departments' }
    }
    if (
      normalized.includes('question bank') ||
      normalized.includes('competency question') ||
      normalized.includes('competency questions') ||
      normalized.includes('역량진단 문항') ||
      normalized.includes('competency questions')
    ) {
      return { route: '/admin/questions' }
    }
    if (
      normalized.includes('course management') ||
      normalized.includes('learning content') ||
      normalized.includes('콘텐츠 관리') ||
      normalized.includes('course name')
    ) {
      return { route: '/admin/courses' }
    }
    if (
      normalized.includes('user management') ||
      normalized.includes('employee management') ||
      normalized.includes('사용자 관리') ||
      normalized.includes('employee')
    ) {
      return { route: '/admin/users' }
    }
    if (
      normalized.includes('notice') ||
      normalized.includes('faq') ||
      normalized.includes('board') ||
      normalized.includes('공지') ||
      normalized.includes('콘텐츠') ||
      normalized.includes('question management')
    ) {
      return { route: '/admin/boards' }
    }
    if (normalized.includes('settings') || normalized.includes('시스템 설정')) {
      return { action: 'goto', data: { path: '/admin/settings' } }
    }
    return null
  }
  const hydrateSidebarBrand = () => {
    const aside = qs('aside')
    if (!aside) return
    const brandRow = qsa('div', aside).find((node) => {
      const text = (node.textContent || '').replace(/\s+/g, ' ')
      return text.includes('HYUNDAI WIA') || text.includes('ON LEARNING SEARCHER')
    })
    if (!brandRow || brandRow.dataset.stitchBrandHydrated === '1') return
    brandRow.dataset.stitchBrandHydrated = '1'
    brandRow.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <img src="/brand/logo.png" alt="HYUNDAI WIA" style="height:32px;width:auto;display:block;object-fit:contain;" />
        <span style="font-size:18px;font-weight:700;letter-spacing:-0.02em;color:#0f172a;">On Learning Searcher</span>
      </div>
    `
    brandRow.style.cursor = 'pointer'
    bindGoto(brandRow, '/')
  }
  const applyUnifiedShell = () => {
    ensureShellTypography()
    const header = qs('header')
    if (!header) return
    const route = getCurrentRoute()
    const shell = getShellState()
    const navItems = [
      { label: '홈', route: '/' },
      { label: '나의 학습', route: '/history' },
      { label: '역량 진단', route: '/diagnosis' },
      { label: '챗봇 상담', route: '/chatbot' },
      { label: '플랫폼 소개', route: '/platform-intro' },
    ]
    header.className = 'sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur px-10 py-3'
    header.innerHTML = `
      <div data-stitch-shell class="flex w-full items-center justify-between gap-6">
        <div class="flex min-w-0 items-center gap-8">
          <button data-stitch-shell-home type="button" class="flex items-center gap-3">
            <img src="/brand/logo.png" alt="HYUNDAI WIA" style="height:32px;width:auto;display:block;object-fit:contain;" />
            <span class="hidden sm:inline text-lg font-bold tracking-tight text-slate-900">On Learning Searcher</span>
          </button>
          <nav class="hidden md:flex items-center gap-7">
            ${navItems.map((item) => `
              <a
                href="#"
                data-stitch-shell-nav="${item.route}"
                class="${route === item.route
                  ? 'pointer-events-none border-b-2 border-[#002C5F] pb-1 text-sm font-medium text-slate-600'
                  : 'border-b-2 border-transparent pb-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#002C5F]'}"
                style="font-size:14px;font-weight:500;line-height:1.4;letter-spacing:-0.01em;"
              >${item.label}</a>
            `).join('')}
          </nav>
        </div>
        <div class="flex items-center gap-4">
          <div class="hidden md:flex flex-col items-end">
            <span class="text-[10px] font-bold uppercase tracking-wider text-slate-500">진행 시간</span>
            <span data-stitch-shell-clock class="text-sm font-mono font-bold text-slate-900">${formatElapsed(shell.sessionStartedAt)}</span>
          </div>
          <div class="${shell.authenticated ? 'hidden sm:flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2' : 'hidden'}">
            <div class="text-right">
              <p class="text-sm font-bold text-slate-900" style="display:flex;align-items:center;justify-content:flex-end;gap:6px;">
                <span>${escapeHtml(shell.name || '')}</span>
                <span style="display:inline-flex;align-items:center;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;line-height:1;background:${shell.role === 'admin' ? '#e8f1ff' : '#eef2f7'};color:${shell.role === 'admin' ? '#2751a3' : '#5e6c80'};">${shell.role === 'admin' ? '관리자' : '학습자'}</span>
              </p>
              <p class="text-xs text-slate-500">${escapeHtml(shell.organization || '')}</p>
            </div>
            <div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
              <span class="material-symbols-outlined text-slate-500">account_circle</span>
            </div>
          </div>
          ${shell.authenticated ? '' : `
            <button data-stitch-shell-signup type="button" class="flex min-w-[88px] items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:border-[#002C5F] hover:text-[#002C5F]">
              회원가입
            </button>
          `}
          <button data-stitch-shell-auth type="button" class="flex min-w-[88px] items-center justify-center rounded-lg bg-[#002C5F] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
            ${shell.authenticated ? '로그아웃' : '로그인'}
          </button>
        </div>
      </div>
    `
    bindGoto(qs('[data-stitch-shell-home]', header), '/')
    qsa('[data-stitch-shell-nav]', header).forEach((node) => {
      const target = node.getAttribute('data-stitch-shell-nav') || '/'
      const resolved = resolveNavRoute(target)
      if (resolved.action) {
        bindAction(node, resolved.action)
      } else {
        bindGoto(node, resolved.route)
      }
    })
    if (!shell.authenticated) {
      bindGoto(qs('[data-stitch-shell-signup]', header), '/signup')
      bindGoto(qs('[data-stitch-shell-auth]', header), '/login')
    } else {
      bindAction(qs('[data-stitch-shell-auth]', header), 'logout')
    }
    if (shellClockTimer) window.clearInterval(shellClockTimer)
    shellClockTimer = window.setInterval(() => {
      const clock = qs('[data-stitch-shell-clock]', header)
      if (clock) clock.textContent = formatElapsed(getShellState().sessionStartedAt)
    }, 1000)
    hydrateSidebarBrand()
  }
  const applyAdminShell = () => {
    ensureShellTypography()
    const header = qs('header')
    if (!header) return
    const route = getCurrentRoute()
    const shell = getShellState()
    header.className = 'sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur px-10 py-3'
    header.innerHTML = `
      <div data-stitch-shell class="flex w-full flex-col gap-4">
        <div class="flex w-full items-center justify-between gap-6">
          <div class="flex min-w-0 items-center gap-3">
            <button data-stitch-shell-home type="button" class="flex items-center gap-3">
              <img src="/brand/logo.png" alt="HYUNDAI WIA" style="height:32px;width:auto;display:block;object-fit:contain;" />
              <span class="text-lg font-bold tracking-tight text-slate-900">관리자 페이지</span>
            </button>
          </div>
          <div class="flex items-center gap-4">
            <div class="${shell.authenticated ? 'hidden sm:flex items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-3 py-2' : 'hidden'}">
              <div class="text-right">
                <p class="text-sm font-bold text-slate-900">${escapeHtml(shell.name || '')}</p>
                <p class="text-xs text-slate-500">${escapeHtml(shell.organization || '')}</p>
              </div>
              <div class="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full border border-slate-200 bg-white">
                <span class="material-symbols-outlined text-slate-500">account_circle</span>
              </div>
            </div>
            <button data-stitch-shell-auth type="button" class="flex min-w-[88px] items-center justify-center rounded-lg bg-[#002C5F] px-4 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90">
              ${shell.authenticated ? '로그아웃' : '로그인'}
            </button>
          </div>
        </div>
        <nav class="flex flex-wrap items-center gap-6 border-t border-slate-100 pt-3" aria-label="관리자 메뉴">
          ${ADMIN_NAV_ITEMS.map((item) => `
            <a
              href="#"
              data-stitch-shell-nav="${item.route}"
              class="${route === item.route
                ? 'pointer-events-none border-b-2 border-[#002C5F] pb-1 text-sm font-medium text-slate-600'
                : 'border-b-2 border-transparent pb-1 text-sm font-medium text-slate-600 transition-colors hover:text-[#002C5F]'}"
              style="font-size:14px;font-weight:500;line-height:1.4;letter-spacing:-0.01em;"
            >${item.label}</a>
          `).join('')}
        </nav>
      </div>
    `
    bindGoto(qs('[data-stitch-shell-home]', header), '/admin')
    qsa('[data-stitch-shell-nav]', header).forEach((node) => {
      const target = node.getAttribute('data-stitch-shell-nav') || '/admin'
      bindGoto(node, target)
    })
    if (shell.authenticated) {
      bindAction(qs('[data-stitch-shell-auth]', header), 'logout')
    } else {
      bindGoto(qs('[data-stitch-shell-auth]', header), '/login?next=%2Fadmin')
    }
  }
  const bindFallbackInteractions = () => {
    if (isAdminPage()) {
      qsa('a, button').forEach((node) => {
        if (node.dataset.stitchBoundAction || node.dataset.stitchBoundGoto) return
        const resolved = resolveAdminTarget(node.textContent)
        if (resolved?.route) {
          bindGoto(node, resolved.route)
          return
        }
        if (resolved?.action) {
          bindAction(node, resolved.action, resolved.data || {})
          return
        }
      })
      return
    }
    qsa('a, button').forEach((node) => {
      if (node.closest('header') || node.closest('[data-stitch-shell]')) return
      if (node.dataset.stitchBoundAction || node.dataset.stitchBoundGoto) return
      const resolved = resolveUtilityTarget(node.textContent)
      if (resolved?.route) {
        bindGoto(node, resolved.route)
        return
      }
      if (resolved?.action) {
        bindAction(node, resolved.action, resolved.data || {})
        return
      }
      const text = (node.textContent || '').replace(/\s+/g, ' ').trim()
      bindAction(node, 'notify', {
        message: text ? `${text} 기능은 준비 중입니다.` : '준비 중인 기능입니다.',
      })
    })
  }

  const bindIconButtons = () => {
    if (isAdminPage()) return
    qsa('button').forEach((node) => {
      if (node.dataset.stitchBoundAction || node.dataset.stitchBoundGoto) return
      const iconText = qsa('.material-symbols-outlined', node).map((item) => item.textContent?.trim()).join(' ')
      const resolved = resolveUtilityTarget(iconText)
      if (resolved?.route) {
        bindGoto(node, resolved.route)
        return
      }
      if (resolved?.action) {
        bindAction(node, resolved.action, resolved.data || {})
      }
    })
  }

  const normalizePageLayout = () => {
    document.documentElement.style.minHeight = 'auto'
    document.documentElement.style.height = 'auto'
    document.body.style.minHeight = 'auto'
    document.body.style.height = 'auto'
    document.body.style.paddingBottom = '0'
    document.body.classList.remove('min-h-screen')

    qsa('[class*="min-h-screen"], [class*="h-screen"]').forEach((node) => {
      node.classList.remove('min-h-screen', 'h-screen')
      node.style.minHeight = 'auto'
      node.style.height = 'auto'
      node.style.maxHeight = 'none'
    })

    qsa('[class*="overflow-y-auto"]').forEach((node) => {
      node.style.overflowY = 'visible'
      node.style.maxHeight = 'none'
      node.style.height = 'auto'
      node.style.minHeight = 'auto'
    })

    qsa('[class*="overflow-hidden"]').forEach((node) => {
      const className = String(node.className || '')
      if (
        className.includes('rounded') ||
        className.includes('aspect-') ||
        className.includes('border') ||
        className.includes('shadow')
      ) {
        return
      }
      node.style.overflow = 'visible'
    })

    if (page === '04-learning-path.html') {
      const stickyBar = qsa('div').find((node) => {
        const className = String(node.className || '')
        return className.includes('fixed') && className.includes('bottom-0') && className.includes('left-0') && className.includes('right-0')
      })
      if (stickyBar) {
        stickyBar.classList.remove('fixed', 'bottom-0', 'left-0', 'right-0')
        stickyBar.style.position = 'relative'
        stickyBar.style.left = 'auto'
        stickyBar.style.right = 'auto'
        stickyBar.style.bottom = 'auto'
        stickyBar.style.marginTop = '32px'
      }
      const main = qs('main')
      if (main) {
        main.style.paddingBottom = '0'
      }
    }
    if (isAdminPage()) {
      const layoutRoot = qs('.layout-container') || qs('body > div')
      if (layoutRoot) {
        layoutRoot.style.minHeight = 'auto'
        layoutRoot.style.height = 'auto'
        layoutRoot.style.maxHeight = 'none'
        layoutRoot.style.overflow = 'visible'
      }
      qsa('main, aside, section, article').forEach((node) => {
        node.style.minHeight = 'auto'
        node.style.height = 'auto'
        node.style.maxHeight = 'none'
        node.style.overflow = 'visible'
        node.style.overflowY = 'visible'
      })
    }
  }

  const applyUnifiedFooter = () => {
    if (isAdminPage()) {
      const footer = qs('footer')
      if (footer) footer.remove()
      return
    }
    let footer = qs('footer')
    if (!footer) {
      footer = document.createElement('footer')
      document.body.appendChild(footer)
    }

    footer.className = `${page === '09-chatbot.html' ? 'mt-0' : 'mt-12'} border-t border-slate-200 bg-white px-6 py-8`
    footer.innerHTML = `
      <div class="mx-auto flex w-full max-w-7xl flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div class="flex items-center gap-2 grayscale opacity-50">
          <span class="text-[12px] font-bold">HYUNDAI WIA</span>
        </div>
        <p class="text-center text-[12px] text-slate-400">
          © 2026 HYUNDAI WIA Corp. All rights reserved. On Learning Searcher는 현대위아 구성원의 맞춤화된 학습과 성장을 위해 제작되었습니다.
        </p>
        <div class="flex items-center justify-center gap-6">
          <a class="text-[12px] text-slate-400 transition-colors hover:text-[#002C5F]" href="#">개인정보처리방침</a>
          <a class="text-[12px] text-slate-400 transition-colors hover:text-[#002C5F]" href="#">이용약관</a>
          <a class="text-[12px] text-slate-400 transition-colors hover:text-[#002C5F]" href="#">관리자</a>
        </div>
      </div>
    `

    const footerLinks = qsa('a', footer)
    bindAction(footerLinks[0], 'notify', { message: '개인정보처리방침 문서는 준비 중입니다.' })
    bindAction(footerLinks[1], 'notify', { message: '이용약관 문서는 준비 중입니다.' })
    bindGoto(footerLinks[2], '/admin')
  }

  const getBoundaryHeight = () => {
    const footer = qs('footer')
    if (footer) {
      const rect = footer.getBoundingClientRect()
      const footerBottom = Math.ceil(rect.bottom + window.scrollY)
      if (footerBottom > 0) return footerBottom
    }

    if (isAdminPage()) {
      const candidates = qsa('main, aside, section, article, table, [class*="layout"], [class*="container"]').map((node) => {
        const rect = node.getBoundingClientRect()
        return Math.ceil(rect.bottom + window.scrollY)
      })
      const maxCandidate = candidates.length > 0 ? Math.max(...candidates) : 0
      return Math.max(
        maxCandidate,
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      )
    }

    const main = qs('main')
    if (main) {
      const rect = main.getBoundingClientRect()
      const mainBottom = Math.ceil(rect.bottom + window.scrollY)
      if (mainBottom > 0) return mainBottom
    }

    return Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)
  }

  const syncBoundaryHeight = () => {
    const height = getBoundaryHeight()
    document.documentElement.style.minHeight = `${height}px`
    document.documentElement.style.height = `${height}px`
    document.body.style.minHeight = `${height}px`
    document.body.style.height = `${height}px`
    return height
  }

  const observeHeight = () => {
    const send = () => {
      normalizePageLayout()
      applyUnifiedFooter()
      const height = syncBoundaryHeight()
      if (Math.abs(height - lastPostedHeight) <= 1) return
      lastPostedHeight = height
      post('height', { height })
    }
    const ro = new ResizeObserver(send)
    ro.observe(document.body)
    send()
    window.addEventListener('load', send)
    window.addEventListener('resize', send)
  }

  const bindGoto = (node, route, data = {}) => {
    if (!node) return
    if (node.dataset.stitchBoundGoto === route) return
    node.dataset.stitchBoundGoto = route
    node.style.cursor = 'pointer'
    node.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      post('action', { action: 'goto', data: { route, ...data } })
    })
  }

  const bindScroll = (node, target) => {
    if (!node || !target) return
    if (node.dataset.stitchBoundScroll === '1') return
    node.dataset.stitchBoundScroll = '1'
    node.style.cursor = 'pointer'
    node.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      target.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  const bindAction = (node, action, data = {}) => {
    if (!node) return
    const key = `${action}:${JSON.stringify(data)}`
    if (node.dataset.stitchBoundAction === key) return
    node.dataset.stitchBoundAction = key
    node.style.cursor = 'pointer'
    node.addEventListener('click', (event) => {
      event.preventDefault()
      event.stopPropagation()
      post('action', { action, data })
    })
  }

  const setupAutoFlow = (node) => {
    if (!node) return
    if (node.__stitchAutoFlowStop) {
      node.__stitchAutoFlowStop()
    }
    ensureHomeMotionStyles()
    node.classList.add('home-course-flow')

    let frameId = 0
    let lastTime = 0
    let paused = false
    const speed = 18

    const onEnter = () => {
      paused = true
    }
    const onLeave = () => {
      paused = false
    }

    node.addEventListener('mouseenter', onEnter)
    node.addEventListener('mouseleave', onLeave)

    const tick = (timestamp) => {
      if (!lastTime) lastTime = timestamp
      const delta = Math.min(48, timestamp - lastTime)
      lastTime = timestamp
      if (!paused && node.scrollWidth > node.clientWidth) {
        node.scrollLeft += (speed * delta) / 1000
        const maxScroll = node.scrollWidth - node.clientWidth
        if (node.scrollLeft >= maxScroll - 1) {
          node.scrollLeft = 0
        }
      }
      frameId = window.requestAnimationFrame(tick)
    }

    frameId = window.requestAnimationFrame(tick)

    node.__stitchAutoFlowStop = () => {
      window.cancelAnimationFrame(frameId)
      node.removeEventListener('mouseenter', onEnter)
      node.removeEventListener('mouseleave', onLeave)
      delete node.__stitchAutoFlowStop
    }
  }

  function renderHome(payload) {
    const main = qs('main')
    if (!main) return
    ensureHomeMotionStyles()
    const sections = qsa(':scope > section', main)
    const heroSection = sections[0]
    const heroCopy = heroSection ? qsa('p', heroSection).find((node) => (node.textContent || '').includes('현대위아의 개인화된 학습 경로 설계')) : null
    if (heroCopy) {
      heroCopy.innerHTML = '현대위아의 개인화된 학습 경로 설계를 통해<br/>당신의 잠재력을 깨우고 스마트한 커리어 패스를 설계하세요. 🚀'
    }
    const statusCards = qsa('div.bg-white', sections[1] || main).slice(0, 4)
    setText(qs('p.text-2xl', statusCards[0]), formatDate(payload.recentDiagnosisDate))
    setText(qs('p.text-2xl', statusCards[1]), `${payload.competencyScore} `)
    const scoreSmall = qs('p.text-2xl span', statusCards[1])
    if (scoreSmall) scoreSmall.textContent = '/ 100'
    const scoreDelta = qs('span.text-emerald-500', statusCards[1]) || qsa('span', statusCards[1]).find((node) => {
      const text = (node.textContent || '').trim()
      return text.includes('%') || text === ''
    })
    if (scoreDelta) {
      setText(scoreDelta, payload.scoreDeltaText || '')
      if ((payload.scoreDeltaText || '').startsWith('^+')) {
        scoreDelta.className = 'text-emerald-500 text-sm font-bold'
      } else if ((payload.scoreDeltaText || '').startsWith('v-')) {
        scoreDelta.className = 'text-rose-500 text-sm font-bold'
      } else {
        scoreDelta.className = 'text-slate-400 text-sm font-bold'
      }
    }
    setText(qs('p.text-2xl', statusCards[2]), `${payload.recommendedCount}개 과정`)
    setText(qs('p.text-2xl', statusCards[3]), `${payload.inProgressCount}개 과정`)
    bindGoto(statusCards[0], '/history')
    bindGoto(statusCards[1], '/history')
    bindGoto(statusCards[2], '/learning-path')

    const heroButtons = qsa('section button', sections[0]).slice(0, 2)
    const topRightButtons = qsa('header button')
    if (payload.authenticated) {
      bindGoto(heroButtons[0], payload.primaryRoute || '/diagnosis')
      if (payload.hasDiagnosis && payload.secondaryRoute) {
        bindGoto(heroButtons[1], payload.secondaryRoute)
      } else {
        bindAction(heroButtons[1], 'missing-diagnosis-results')
      }
      const heroPrimaryText = heroButtons[0]?.childNodes?.[0]
      if (heroPrimaryText) heroPrimaryText.textContent = payload.primaryLabel || '진단 시작하기 '
    } else {
      bindAction(heroButtons[0], 'login-start')
      bindGoto(heroButtons[1], '/diagnosis/results')
    }

    const journeySection = sections[2]
    const journeyItems = qsa('.relative.z-10.flex.flex-col.items-center', journeySection)
    const journeyLabels = payload.journey || []
    journeyItems.forEach((item, index) => {
      const strong = qs('p.font-bold', item)
      const sub = qs('p.text-xs', item)
      if (journeyLabels[index]) {
        setText(strong, journeyLabels[index].title)
        setText(sub, journeyLabels[index].subtitle)
      }
    })

    const picksSection = sections[3]
    const cardsGrid = qsa('div', picksSection).find((node) => {
      const className = String(node.className || '')
      return className.includes('grid-cols-1') && className.includes('md:grid-cols-2') && className.includes('lg:grid-cols-3')
    })
    if (cardsGrid) {
      cardsGrid.className = 'flex flex-row flex-nowrap items-stretch gap-6 overflow-x-auto pb-2'
      cardsGrid.style.display = 'flex'
      cardsGrid.style.flexWrap = 'nowrap'
      cardsGrid.style.alignItems = 'stretch'
      cardsGrid.style.overflowX = 'auto'
      cardsGrid.style.overflowY = 'hidden'
      cardsGrid.style.scrollBehavior = 'auto'
      cardsGrid.style.webkitOverflowScrolling = 'touch'
    }
    const baseCards = cardsGrid ? Array.from(cardsGrid.children) : qsa('.bg-white.rounded-2xl.overflow-hidden.border', picksSection)
    const targetCount = Math.min((payload.topCourses || []).length, 5)
    while (cardsGrid && cardsGrid.children.length < targetCount && baseCards[0]) {
      cardsGrid.appendChild(baseCards[0].cloneNode(true))
    }
    const cards = cardsGrid ? Array.from(cardsGrid.children).slice(0, targetCount) : baseCards.slice(0, targetCount)
    cards.forEach((card) => {
      card.classList.add('shrink-0')
      card.style.flex = '0 0 320px'
      card.style.width = '320px'
      card.style.minWidth = '320px'
      card.style.maxWidth = '320px'
    })
    cards.forEach((card, index) => {
      const course = payload.topCourses?.[index]
      if (!course) {
        card.style.display = 'none'
        return
      }
      card.style.display = ''
      setText(qs('h4', card), course.title)
      const image = qs('img', card)
      if (image && course.imageUrl) image.src = course.imageUrl
      const meta = qsa('span.flex.items-center.gap-1', card)
      if (meta[0]) meta[0].innerHTML = `<span class="material-symbols-outlined text-sm">schedule</span> ${escapeHtml(course.durationText)}`
      if (meta[1]) meta[1].innerHTML = `<span class="material-symbols-outlined text-sm">signal_cellular_alt</span> ${escapeHtml(course.level)}`
      const badge = qs('.absolute.top-4.left-4 span', card)
      if (badge) badge.textContent = course.badge
      bindAction(card, 'select-course', { courseId: course.courseId })
      bindAction(qs('button', card), 'select-course', { courseId: course.courseId })
    })
    setupAutoFlow(cardsGrid)

    const allViewLink = qsa('a', document).find((node) => node.textContent?.includes('전체 보기'))
    bindGoto(allViewLink, '/learning-path')

    const boardSection = sections[4]
    const boardGrid = boardSection?.querySelector('.grid')
    if (boardGrid) {
      boardGrid.className = 'grid grid-cols-1 lg:grid-cols-2 gap-8'
    }

    const noticeRows = qsa('[data-home-notices] > article')
    noticeRows.forEach((row, index) => {
      const notice = payload.notices?.[index]
      if (!notice) {
        row.style.display = 'none'
        return
      }
      row.style.display = ''
      setText(qs('span.inline-flex', row), notice.category)
      setText(qs('span.text-xs.font-medium', row), notice.date)
      setText(qs('h4', row), notice.title)
      setText(qs('p', row), notice.summary)
    })

    const faqItems = qsa('[data-home-faqs] > details')
    faqItems.forEach((item, index) => {
      const faq = payload.faqs?.[index]
      if (!faq) {
        item.style.display = 'none'
        return
      }
      item.style.display = ''
      setText(qs('summary span:not(.material-symbols-outlined)', item), faq.question)
      setText(qs('p', item), faq.answer)
    })

    const footerLinks = qsa('footer a')
    bindGoto(footerLinks[0], '/chatbot')
    bindGoto(footerLinks[1], '/')
    bindGoto(footerLinks[2], '/')
    setupHomeReveal(main)
  }

  function renderDiagnosis(payload) {
    const progressLabel = qsa('span').find((node) => node.textContent?.includes('전체 진행률'))
    const progressCard = progressLabel?.closest('div')?.parentElement
    const progressTrack = progressCard
      ? qsa('div', progressCard).find((node) => String(node.className).includes('overflow-hidden'))
      : null
    const progress = progressTrack ? qs('div', progressTrack) : null
    const progressValue = progressLabel?.parentElement ? qsa('span', progressLabel.parentElement).find((node) => node !== progressLabel) : null
    if (progress) progress.style.width = `${payload.progress}%`
    setText(progressValue, `${payload.progress}%`)
    setText(qs('p.mt-2.text-xs.text-slate-400.font-medium'), `${payload.answeredCount}문항 응답 완료`)
    setText(qs('p.text-sm.font-semibold.text-slate-700'), payload.topGapLabel)
    setText(qs('span.inline-block.px-3.py-1'), `문항 ${payload.questionNumber} / ${payload.totalQuestions}`)
    setText(qs('h2.text-2xl'), payload.question.title)
    setText(qs('h2.text-2xl + p'), payload.question.subtitle)

    const options = qsa('label.relative.flex.flex-col.p-5')
    options.forEach((optionNode, index) => {
      const option = payload.question.options[index]
      if (!option) return
      setText(qs('span.text-lg.font-bold', optionNode), option.label)
      setText(qs('span.text-sm', optionNode), option.description)
      const input = qs('input', optionNode)
      if (input) input.checked = option.selected
      optionNode.classList.toggle('border-[#00AAD2]', option.selected)
      optionNode.classList.toggle('bg-[#00AAD2]/5', option.selected)
      const title = qs('span.text-lg.font-bold', optionNode)
      if (title) {
        title.classList.toggle('text-[#00AAD2]', option.selected)
        title.classList.toggle('group-hover:text-[#00AAD2]', !option.selected)
      }
      const desc = qs('span.text-sm', optionNode)
      if (desc) {
        desc.classList.toggle('text-slate-600', option.selected)
        desc.classList.toggle('dark:text-slate-300', option.selected)
        desc.classList.toggle('text-slate-500', !option.selected)
        desc.classList.toggle('dark:text-slate-400', !option.selected)
      }
      bindAction(optionNode, 'select-answer', { value: option.value })
    })

    const footerButtons = qsa('div.flex.items-center.justify-between button')
    bindAction(footerButtons[0], 'prev-question')
    bindAction(footerButtons[1], 'save-draft')
    bindAction(footerButtons[2], 'next-question')
    setText(footerButtons[2], payload.isLast ? '결과 분석 보기' : '다음 문항')
  }

  function renderResults(payload) {
    const cardsContainer = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('grid-cols-1') && className.includes('md:grid-cols-2') && className.includes('lg:grid-cols-4') && className.includes('gap-6')
    })
    const cards = cardsContainer ? Array.from(cardsContainer.children) : []
    if (cards[0]) setText(qs('p.text-4xl', cards[0]), `${payload.scoreRate}%`)
    if (cards[0]) {
      const deltaNode = qs('span.text-emerald-600', cards[0]) || qs('span.text-red-500', cards[0]) || qs('span.text-sm.font-bold', cards[0])
      if (deltaNode) {
        const delta = Number(payload.scoreDelta || 0)
        if (delta > 0) {
          deltaNode.textContent = `+${delta}%`
          deltaNode.className = 'text-emerald-600 dark:text-emerald-400 text-sm font-bold flex items-center'
          deltaNode.innerHTML = `<span class="material-symbols-outlined text-sm">trending_up</span> +${delta}%`
        } else if (delta < 0) {
          deltaNode.className = 'text-red-500 dark:text-red-400 text-sm font-bold flex items-center'
          deltaNode.innerHTML = `<span class="material-symbols-outlined text-sm">trending_down</span> ${delta}%`
        } else {
          deltaNode.className = 'text-slate-400 text-sm font-bold flex items-center'
          deltaNode.innerHTML = `<span class="material-symbols-outlined text-sm">remove</span> 0%`
        }
      }
    }
    if (cards[1]) setText(qs('p.text-2xl', cards[1]), payload.improvementArea)
    if (cards[2]) setText(qs('p.text-2xl', cards[2]), payload.strength)
    if (cards[3]) setText(qs('p.text-2xl', cards[3]), payload.nextStep)

    const bars = qsa('div.space-y-8 > div.space-y-3')
    bars.forEach((bar, index) => {
      const item = payload.categories[index]
      if (!item) return
      setText(qs('p.text-sm.font-bold', bar), item.label)
      setText(qs('p.text-xs.text-slate-500', bar), item.subtitle)
      setText(qs('span.text-lg.font-black', bar), `${item.score}%`)
      const fill = qs('div.h-full', qs('div.h-3', bar))
      if (fill) {
        fill.style.width = `${item.score}%`
        fill.style.backgroundColor = item.color
      }
    })

    const cta = qs('button.bg-primary')
    bindGoto(cta, '/recommendation')
    const pathLink = qsa('a', document).find((node) => node.textContent && node.textContent.includes('학습 경로'))
    bindGoto(pathLink, '/learning-path')
    const footerLinks = qsa('footer a')
    bindAction(footerLinks[0], 'notify', { message: '개인정보처리방침 문서는 준비 중입니다.' })
    bindGoto(footerLinks[1], '/chatbot')
    bindAction(footerLinks[2], 'notify', { message: '피드백 채널은 준비 중입니다. 우선 AI 챗봇 상담을 이용해 주세요.' })
  }

  function renderLearningPath(payload) {
    const summaryGrid = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('grid-cols-1') && className.includes('md:grid-cols-3') && className.includes('gap-4') && className.includes('mb-12')
    })
    const summary = summaryGrid ? Array.from(summaryGrid.children) : []
    if (summary[0]) setText(qs('p.text-base.font-bold', summary[0]), payload.focusArea)
    if (summary[1]) setText(qs('p.text-base.font-bold', summary[1]), payload.startMode)
    if (summary[2]) setText(qs('p.text-base.font-bold', summary[2]), payload.goal)

    const stepsContainer = qs('div.space-y-12')
    const baseSteps = stepsContainer ? Array.from(stepsContainer.children).filter((node) => node instanceof HTMLElement) : []
    const targetCount = Math.min((payload.steps || []).length, 5)
    while (stepsContainer && stepsContainer.children.length < targetCount && baseSteps[0]) {
      stepsContainer.appendChild(baseSteps[0].cloneNode(true))
    }
    const steps = stepsContainer ? Array.from(stepsContainer.children).slice(0, targetCount) : qsa('div.space-y-12 > div.relative.flex.gap-6').slice(0, targetCount)
    steps.forEach((stepNode, index) => {
      const step = payload.steps[index]
      const stepState = payload.stepStates?.[index] === 'done' ? 'done' : 'pending'
      if (!step) {
        stepNode.style.display = 'none'
        return
      }
      stepNode.style.display = ''
      const image = qs('img', stepNode)
      if (image && step.imageUrl) image.src = step.imageUrl
      const nodeBadge = qsa('div', stepNode).find((node) => {
        const className = String(node.className || '')
        return className.includes('rounded-full') && className.includes('font-bold') && !className.includes('rounded-2xl')
      })
      if (nodeBadge) {
        nodeBadge.textContent = String(index + 1)
        const isDone = stepState === 'done'
        nodeBadge.className = isDone
          ? 'flex items-center justify-center w-10 h-10 rounded-full text-white font-bold shadow-lg shadow-primary/30 bg-[#00AAD2]'
          : 'flex items-center justify-center w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold border-2 border-slate-300 dark:border-slate-700'
      }
      const card = qsa('div', stepNode).find((node) => String(node.className || '').includes('rounded-2xl'))
      if (card) {
        card.classList.toggle('opacity-90', stepState !== 'done')
      }
      let roadmapLine = qs('.roadmap-line', stepNode)
      if (!roadmapLine && index < targetCount - 1) {
        roadmapLine = document.createElement('div')
        roadmapLine.className = 'roadmap-line'
        stepNode.insertBefore(roadmapLine, stepNode.firstChild)
      }
      if (roadmapLine) {
        roadmapLine.style.display = index === targetCount - 1 ? 'none' : 'block'
        roadmapLine.style.background = stepState === 'done'
          ? 'repeating-linear-gradient(to bottom, #00AAD2 0, #00AAD2 8px, transparent 8px, transparent 16px)'
          : 'repeating-linear-gradient(to bottom, #cbd5e1 0, #cbd5e1 8px, transparent 8px, transparent 16px)'
      }
      setText(qs('h3.text-xl.font-bold', stepNode), step.title)
      setText(qs('p.text-slate-600', stepNode), step.summary)
      setText(qs('span.px-2.py-1', stepNode), step.durationText)
      const reason = qsa('p.text-sm', stepNode)[1]
      if (reason) reason.textContent = `“${step.reason}”`
      bindAction(stepNode, 'select-path-step', { index })
    })

  }

  function renderRecommendation(payload) {
    recommendationState = {
      courses: payload.courses || [],
      selectedCategory: '전체',
      selectedLevel: '전체',
      sort: '추천순',
    }
    const introSection = qs('section.mb-10')
    if (introSection) introSection.remove()
    const title = qs('h2.text-2xl')
    if (title) title.textContent = '맞춤 교육 추천'
    const headerRow = title?.closest('div.flex.items-center.justify-between')
    const subtitle = headerRow?.previousElementSibling
    if (subtitle && subtitle.tagName === 'P') {
      subtitle.textContent = '진단 결과와 최근 학습 흐름을 바탕으로 지금 바로 신청할 과정을 골라보세요.'
    }
    setupRecommendationFilters()
    paintRecommendationCards()
    const footerLinks = qsa('footer a')
    bindGoto(footerLinks[0], '/chatbot')
    bindGoto(footerLinks[1], '/chatbot')
    bindAction(footerLinks[2], 'notify', { message: '버전 정보입니다. 현재 v2.4.0 디자인 템플릿을 사용 중입니다.' })
  }

  function setupRecommendationFilters() {
    const categoryLabels = qsa('aside label span.text-sm').slice(0, 4)
    categoryLabels.forEach((labelNode) => {
      const label = labelNode.textContent.trim()
      const checkbox = labelNode.parentElement.querySelector('input')
      if (!checkbox) return
      checkbox.addEventListener('change', () => {
        if (label === '전체') {
          recommendationState.selectedCategory = '전체'
          qsa('aside input[type="checkbox"]').forEach((input, index) => {
            input.checked = index === 0
          })
        } else {
          qsa('aside input[type="checkbox"]').forEach((input, index) => {
            input.checked = categoryLabels[index] === labelNode
          })
          recommendationState.selectedCategory = label
        }
        paintRecommendationCards()
      })
    })
    const levelLabels = qsa('aside input[type="radio"]')
    levelLabels.forEach((input) => {
      input.addEventListener('change', () => {
        const label = input.parentElement.textContent.trim()
        recommendationState.selectedLevel = label
        paintRecommendationCards()
      })
    })
    const select = qs('select')
    if (select) {
      select.addEventListener('change', () => {
        recommendationState.sort = select.value
        paintRecommendationCards()
      })
    }
  }

  function paintRecommendationCards() {
    const grid = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('grid-cols-1') && className.includes('md:grid-cols-2') && className.includes('gap-6')
    })
    if (!grid || !recommendationState) return
    let courses = [...recommendationState.courses]
    if (recommendationState.selectedCategory !== '전체') {
      courses = courses.filter((course) => course.category === recommendationState.selectedCategory)
    }
    if (recommendationState.selectedLevel !== '전체') {
      courses = courses.filter((course) => course.level === recommendationState.selectedLevel)
    }
    if (recommendationState.sort === '최신순') {
      courses = courses.sort((a, b) => (b.rank || 0) - (a.rank || 0))
    } else {
      courses = courses.sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0))
    }
    const top = courses.slice(0, 5)
    let cards = qsa(':scope > div', grid)
    if (cards.length && cards.length < top.length) {
      const template = cards[cards.length - 1]
      while (cards.length < top.length) {
        const clone = template.cloneNode(true)
        grid.appendChild(clone)
        cards = qsa(':scope > div', grid)
      }
    }
    cards.forEach((card, index) => {
      const course = top[index]
      if (!course) {
        card.style.display = 'none'
        return
      }
      card.style.display = ''
      setText(qs('h4', card), course.title)
      const image = qs('img', card)
      if (image && course.imageUrl) image.src = course.imageUrl
      const meta = qsa('span', card).filter((node) => String(node.className || '').includes('text-[10px]'))
      if (meta[0]) meta[0].textContent = course.level
      if (meta[1]) meta[1].textContent = course.durationText
      const badge = qs('.absolute.top-3.left-3', card)
      if (badge) badge.textContent = course.badge
      const buttons = qsa('button', card)
      bindAction(buttons[0], 'view-course', { courseId: course.courseId })
      bindAction(buttons[1], 'apply-course', { courseId: course.courseId })
    })
  }

  function renderCourseLinking(payload) {
    const detailGrid = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('grid-cols-1') && className.includes('lg:grid-cols-3') && className.includes('gap-10')
    })
    if (detailGrid) {
      detailGrid.classList.add('items-start')
      detailGrid.style.alignItems = 'start'
    }

    const heroGrid = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('grid-cols-1') && className.includes('lg:grid-cols-3') && className.includes('gap-8') && className.includes('mb-10')
    })
    const heroQuickColumn = heroGrid
      ? Array.from(heroGrid.children).find((node) => String(node.className || '').includes('lg:col-span-1'))
      : null
    const heroContentColumn = heroGrid
      ? Array.from(heroGrid.children).find((node) => String(node.className || '').includes('lg:col-span-2'))
      : null
    const heroQuickCard = heroQuickColumn
      ? Array.from(heroQuickColumn.children).find((node) => String(node.className || '').includes('rounded-xl') && String(node.className || '').includes('shadow-xl'))
      : null
    const detailRightColumn = detailGrid
      ? Array.from(detailGrid.children).find((node) => String(node.className || '').includes('lg:col-span-1'))
      : null

    if (heroQuickColumn && heroQuickCard && detailRightColumn) {
      heroQuickColumn.style.display = 'none'
      heroQuickCard.style.marginTop = '0'
      detailRightColumn.insertBefore(heroQuickCard, detailRightColumn.firstChild)
    }
    if (heroContentColumn) {
      heroContentColumn.classList.remove('lg:col-span-2')
      heroContentColumn.classList.add('lg:col-span-3')
      heroContentColumn.style.maxWidth = 'none'
    }

    setText(qs('h1.text-slate-900.text-4xl'), payload.title)
    const lead = qsa('p.text-slate-600')[0]
    if (lead) {
      lead.textContent = payload.summary
      lead.classList.remove('max-w-2xl')
      lead.style.maxWidth = 'none'
    }
    const quickCard = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('bg-white') && className.includes('rounded-xl') && className.includes('shadow-xl') && node.textContent?.includes('총 학습 시간')
    })
    const quick = quickCard ? qsa('div.flex.items-center.gap-4', quickCard) : []
    if (quick[0]) setText(qs('p.text-lg.font-bold', quick[0]), payload.durationText)
    if (quick[1]) setText(qs('p.text-lg.font-bold', quick[1]), payload.deliveryMode)
    const heroCaption = qs('h3.text-white.text-2xl')
    if (heroCaption) heroCaption.textContent = payload.heroCaption
    const heroImage = qsa('img').find((img) => img.alt && img.alt.includes('Next-generation AI'))
    if (heroImage && payload.heroImageUrl) heroImage.src = payload.heroImageUrl

    const goals = qsa('section h2').find((node) => node.textContent.includes('학습 목표'))?.parentElement
    if (goals) {
      const boxes = qsa('div.p-5', goals)
      boxes.forEach((box, index) => {
        const item = payload.objectives[index]
        if (item) setText(qs('p', box), `• ${item}`)
      })
    }
    const curriculum = qsa('section h2').find((node) => node.textContent.includes('커리큘럼'))?.parentElement
    if (curriculum) {
      const items = qsa('div.flex.gap-4.p-6', curriculum)
      items.forEach((row, index) => {
        const step = payload.curriculum[index]
        if (!step) return
        setText(qs('h4', row), step.title)
        setText(qs('p.text-sm', row), step.subtitle)
      })
    }
    const expectList = qsa('ul.space-y-4 li', document)
    expectList.forEach((item, index) => {
      const text = item.querySelector('span:last-child')
      if (payload.expectedOutcomes[index]) setText(text, payload.expectedOutcomes[index])
    })
    const tags = qsa('div.flex.flex-wrap.gap-2 span')
    tags.forEach((tag, index) => {
      if (payload.targetAudience[index]) tag.textContent = `#${payload.targetAudience[index]}`
    })
    const buttons = qsa('button')
    const applyButton = buttons.find((button) => button.textContent.includes('E-Campus'))
    const demoButton = buttons.find((button) =>
      button.textContent.includes('추천 과정 수강 완료') || button.textContent.includes('데스크톱 신청 완료'),
    )
    bindAction(applyButton, 'external-apply')
    bindAction(demoButton, 'demo-enroll')
    const homeLink = qsa('a', document).find((node) => node.textContent?.trim() === '홈')
    bindGoto(homeLink, '/')
    const footerLinks = qsa('footer a')
    bindAction(footerLinks[0], 'notify', { message: '개인정보처리방침 문서는 준비 중입니다.' })
    bindAction(footerLinks[1], 'notify', { message: '이용약관 문서는 준비 중입니다.' })
    bindGoto(footerLinks[2], '/chatbot')
  }

  function renderHistory(payload) {
    const growthHeader = qsa('h3').find((node) => node.textContent?.includes('역량 성장 변화'))
    if (growthHeader) {
      const growthHeaderWrap = growthHeader.parentElement
      const growthDescription = growthHeaderWrap ? qs('p.text-sm', growthHeaderWrap) : null
      if (growthDescription) growthDescription.textContent = '역량 영역별 현재 점수와 종합 점수입니다.'
    }
    const growthMeta = qsa('div.flex.items-center.gap-2.bg-slate-100 span')
    if (growthMeta[0]) growthMeta[0].textContent = '영역별 점수'
    if (growthMeta[1]) growthMeta[1].textContent = '실데이터 기준'

    const metricGrid = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('grid-cols-1') && className.includes('md:grid-cols-3') && className.includes('mb-8')
    })
    const metricCards = metricGrid ? Array.from(metricGrid.children) : []
    if (metricCards[0]) setText(qs('p.text-3xl', metricCards[0]), `${payload.latestScore}점`)
    if (metricCards[1]) {
      setText(qs('p.text-sm', metricCards[1]), '추천 과정 수')
      setText(qs('p.text-3xl', metricCards[1]), `${payload.recommendedCount}개`)
    }
    if (metricCards[2]) {
      setText(qs('p.text-sm', metricCards[2]), '추천 학습 시간')
      setText(qs('p.text-3xl', metricCards[2]), `${payload.recommendedHours}h`)
    }

    const bars = qsa('.absolute.inset-0.flex.items-end.justify-between > div')
    const barColorMap = {
      neutral: {
        fill: '#e5e7eb',
        active: '#334155',
        label: '#64748b',
      },
      summary: {
        fill: 'rgba(0,170,210,0.2)',
        active: '#334155',
        label: '#00aad2',
      },
    }
    bars.forEach((bar, index) => {
      const item = payload.growth[index]
      if (!item) {
        bar.style.display = 'none'
        return
      }
      bar.style.display = ''
      bar.style.position = 'relative'
      const inner = qsa('div', bar).find((node) => String(node.className || '').includes('w-4/5'))
      if (inner) {
        inner.style.height = `${item.height}px`
        inner.style.position = 'relative'
        inner.style.backgroundColor = (barColorMap[item.color] || barColorMap.neutral).fill
        inner.style.borderTopLeftRadius = '0.5rem'
        inner.style.borderTopRightRadius = '0.5rem'
        let badge = qs('[data-history-score-badge]', inner)
        if (!badge) {
          badge = document.createElement('div')
          badge.setAttribute('data-history-score-badge', '1')
          badge.className = 'absolute left-1/2 -translate-x-1/2 -top-7 text-[11px] font-black whitespace-nowrap'
          inner.appendChild(badge)
        }
        badge.textContent = `${item.score}점`
        if (item.color === 'summary') {
          badge.style.backgroundColor = '#00aad2'
          badge.style.boxShadow = '0 8px 20px rgba(0, 170, 210, 0.28)'
          badge.style.padding = '0.25rem 0.5rem'
          badge.style.borderRadius = '0.5rem'
          badge.style.color = '#ffffff'
        } else {
          badge.style.backgroundColor = 'transparent'
          badge.style.boxShadow = 'none'
          badge.style.padding = '0'
          badge.style.borderRadius = '0'
          badge.style.color = (barColorMap[item.color] || barColorMap.neutral).active
        }
      }
      const labelNode = qs('span.text-xs', bar)
      setText(labelNode, item.label)
      if (labelNode) labelNode.style.color = (barColorMap[item.color] || barColorMap.neutral).label
    })
    const currentCard = qsa('div.bg-hyundai-navy')[0]
    if (currentCard) {
      setText(qs('p.font-bold', currentCard), payload.currentCourse)
      const badge = qsa('span', currentCard).find((node) => (node.textContent || '').includes('Next Recommended') || (node.textContent || '').includes('NEXT RECOMMENDED'))
      if (badge) badge.textContent = 'NEXT RECOMMENDED'
      const copy = qsa('p.text-white\\/80', currentCard)[0]
      if (copy) {
        copy.innerHTML = `${escapeHtml(payload.userName || '구성원')}님을 위해 선정된<br/>다음 루프 추천 과정입니다.`
      }
    }
    const historyHeader = qsa('h3').find((node) => {
      const text = node.textContent?.trim() || ''
      return text.includes('최근 학습 이력') || text.includes('학습 추천 과정')
    })
    if (historyHeader) {
      historyHeader.textContent = payload.historyTitle || '학습 추천 과정'
    }
    const tableRows = qsa('tbody tr')
    tableRows.forEach((row, index) => {
      const item = payload.history[index]
      if (!item) {
        row.style.display = 'none'
        return
      }
      row.style.display = ''
      const cells = qsa('td', row)
      if (cells[0]) {
        setText(qs('span.text-sm.font-bold', cells[0]), item.title)
        setText(qs('span.text-\\[11px\\]', cells[0]), item.type)
      }
      if (cells[1]) setText(qs('span.text-sm', cells[1]) || cells[1], item.period)
      if (cells[2]) {
        const pill = qs('span', cells[2])
        setText(pill, item.status)
      }
      if (cells[3]) setText(qs('span', cells[3]) || cells[3], item.result)
    })
    const guideButton = qsa('button').find((button) => button.textContent.includes('학습 가이드 보기'))
    bindGoto(guideButton, '/learning-path')
    const buttons = qsa('button')
    const nextCourseButton = buttons.find((button) => button.textContent?.includes('다음 학습 받기') || button.textContent?.includes('다음 학습 과정 추천 받기'))
    if (nextCourseButton) {
      nextCourseButton.textContent = '다음 학습 과정 추천 받기'
      bindGoto(nextCourseButton, '/recommendation')
    }
    const allViewButton = buttons.find((button) => button.textContent?.includes('전체 보기'))
    bindGoto(allViewButton, '/recommendation')
    const chevronIcon = qsa('.material-symbols-outlined').find((node) => node.textContent?.trim() === 'chevron_right')
    if (chevronIcon) {
      const actionTarget = chevronIcon.closest('button') || chevronIcon.parentElement
      bindGoto(actionTarget, '/recommendation')
    }
  }

  function renderAnalytics(payload) {
    const userInfoBlock = qsa('div').find((node) => String(node.className).includes('text-right') && ((node.textContent || '').includes('관리자') || (node.textContent || '').includes('연구원') || (node.textContent || '').includes('님')))
    const userInfo = userInfoBlock ? qsa('p', userInfoBlock) : []
    if (userInfo[0]) userInfo[0].textContent = `${payload.userName || '현대위아 관리자'}님`
    if (userInfo[1]) userInfo[1].textContent = payload.organization || '운영 관리자'
    const kpiGrid = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('grid-cols-1') && className.includes('md:grid-cols-2') && className.includes('lg:grid-cols-4') && className.includes('gap-6')
    })
    const kpis = kpiGrid ? Array.from(kpiGrid.children) : []
    const metricValues = [payload.totalDiagnosed, payload.enrolledCount, payload.failedCount, payload.needsReview]
    const suffix = ['명', '건', '건', '건']
    kpis.forEach((card, index) => {
      const h3 = qs('h3', card)
      if (h3) h3.innerHTML = `${metricValues[index]}<span class="text-lg font-normal ml-1">${suffix[index]}</span>`
    })
    const funnelBlocks = qsa('div.relative', document).filter((node) => node.textContent.includes('진단 완료'))
    funnelBlocks.forEach((block, index) => {
      const item = payload.funnel[index]
      if (!item) return
      setText(qs('span.text-sm.font-bold', block), item.label)
      setText(qs('span.text-xs.font-medium', block), `${item.percent}%`)
      const fill = qsa('div', block).find((node) => String(node.className || '').includes('h-full') && String(node.className || '').includes('bg-hyundai-blue'))
      if (fill) fill.style.width = `${item.percent}%`
    })
    const insight = qsa('p.text-sm.text-slate-600').find((node) => node.textContent.includes('인사이트'))
    if (insight) insight.innerHTML = `<span class="font-bold text-hyundai-blue">인사이트:</span> ${escapeHtml(payload.insight)}`
    const bottleneckCards = qsa('div.space-y-4 > div.p-4')
    bottleneckCards.forEach((card, index) => {
      const item = payload.bottlenecks[index]
      if (!item) return
      const texts = qsa('p', card)
      if (texts[0]) texts[0].textContent = item.tag
      if (texts[1]) texts[1].textContent = item.title
    })
    const actionsContainer = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('bg-white') && node.textContent.includes('즉시 권장 액션')
    })
    if (actionsContainer) {
      const list = qs('ul', actionsContainer)
      if (list) list.innerHTML = payload.actions.map((action) => `<li class="flex items-start gap-3"><span class="material-symbols-outlined text-hyundai-blue mt-0.5">check_circle</span><span>${escapeHtml(action)}</span></li>`).join('')
    }
    const sectionFunnel = qsa('h2').find((node) => node.textContent?.includes('전환 퍼널 시각화'))?.closest('div.rounded-2xl')
    const sectionDepartment = qsa('h2').find((node) => node.textContent?.includes('부서별 전환 비교 및 분석'))?.closest('section, div.rounded-2xl, div')
    const sectionActions = qsa('h2').find((node) => node.textContent?.includes('즉시 권장 액션'))?.closest('div.rounded-2xl')
    const sidebarLinks = qsa('aside a')
    if (sidebarLinks[0]) {
      sidebarLinks[0].classList.add('pointer-events-none')
      sidebarLinks[0].setAttribute('aria-current', 'page')
    }
    bindScroll(sidebarLinks[1], sectionFunnel)
    bindScroll(sidebarLinks[2], sectionDepartment)
    bindScroll(sidebarLinks[3], sectionActions || sectionFunnel)
    bindAction(sidebarLinks[4], 'goto', { path: '/admin/settings' })
    const buttons = qsa('button', document)
    bindAction(buttons.find((button) => button.textContent?.includes('상세 리포트')), 'notify', { message: '상세 리포트는 준비 중입니다. 현재 대시보드 수치를 기준으로 운영 판단을 진행해 주세요.' })
    bindAction(buttons.find((button) => button.textContent?.includes('Excel 다운로드')), 'notify', { message: 'Excel 다운로드는 준비 중입니다.' })
    bindAction(buttons.find((button) => button.textContent?.includes('필터 설정')), 'notify', { message: '필터 설정은 준비 중입니다.' })
    qsa('tbody button', document).forEach((button) => {
      bindAction(button, 'notify', { message: `${button.textContent?.trim() || '추천 액션'} 기능은 준비 중입니다.` })
    })
  }

  function renderChatbot(payload) {
    chatbotState = { payload, messages: [] }
    const userName = payload.userName || '구성원'
    const userInfoBlock = qsa('div').find((node) => String(node.className).includes('text-right') && (node.textContent?.includes('책임') || node.textContent?.includes('님')))
    const userInfo = userInfoBlock ? qsa('p', userInfoBlock) : []
    if (userInfo[0]) userInfo[0].textContent = `${userName}님`
    if (userInfo[1]) userInfo[1].textContent = payload.organization || '연구개발본부'
    const messageStream = qsa('section.flex-1 .space-y-6')[0]
    if (messageStream) {
      const messages = Array.isArray(payload.messages) && payload.messages.length ? payload.messages : [
        {
          role: 'assistant',
          text: `안녕하세요, ${userName}님. 현재 학습 상태를 바탕으로 다음 행동을 안내해드릴게요. 궁금하신 점이 있으신가요?`,
        },
      ]

      const renderedMessages = messages.map((message) => {
        if (message.role === 'user') {
          return `
            <div class="flex justify-end max-w-3xl ml-auto">
              <div class="bg-[#002c5f] text-white p-4 rounded-2xl rounded-tr-none shadow-sm max-w-xl">
                <p>${escapeHtml(message.text)}</p>
              </div>
            </div>`
        }

        return `
          <div class="flex gap-4 max-w-3xl">
            <div class="h-10 w-10 shrink-0 rounded-xl flex items-center justify-center shadow-md">
              <span class="material-symbols-outlined" style="color:#002c5f;">smart_toy</span>
            </div>
            <div class="flex flex-col gap-2">
              <p class="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1">AI 챗봇 상담사</p>
              <div class="bg-white dark:bg-slate-800 p-4 rounded-2xl rounded-tl-none shadow-sm border border-slate-200 dark:border-slate-700">
                <p class="text-slate-800 dark:text-slate-200 leading-relaxed">${escapeHtml(message.text)}</p>
              </div>
            </div>
          </div>`
      }).join('')

      messageStream.innerHTML = `
        <div class="flex justify-center">
          <span class="px-4 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">TODAY</span>
        </div>
        ${renderedMessages}
        <div class="flex flex-wrap gap-2 pl-14">
          <button class="px-4 py-2 bg-white dark:bg-slate-800 border border-hyundai-blue/30 hover:border-hyundai-blue text-hyundai-blue text-sm font-semibold rounded-full shadow-sm transition-all hover:bg-hyundai-blue/5">
            내 부족 역량 알려줘
          </button>
          <button class="px-4 py-2 bg-white dark:bg-slate-800 border border-hyundai-blue/30 hover:border-hyundai-blue text-hyundai-blue text-sm font-semibold rounded-full shadow-sm transition-all hover:bg-hyundai-blue/5">
            최근 신청 상태 알려줘
          </button>
          <button class="px-4 py-2 bg-white dark:bg-slate-800 border border-hyundai-blue/30 hover:border-hyundai-blue text-hyundai-blue text-sm font-semibold rounded-full shadow-sm transition-all hover:bg-hyundai-blue/5">
            추천 이유
          </button>
          <button class="px-4 py-2 bg-white dark:bg-slate-800 border border-hyundai-blue/30 hover:border-hyundai-blue text-hyundai-blue text-sm font-semibold rounded-full shadow-sm transition-all hover:bg-hyundai-blue/5">
            선택 과정 코칭
          </button>
        </div>`
    }
    const statusCardTitle = qsa('aside h3').find((node) => node.textContent?.includes('현재 학습 상태 요약'))
    if (statusCardTitle && payload.completionSummaryLabel) statusCardTitle.textContent = payload.completionSummaryLabel
    const score = qs('.absolute.text-sm.font-bold')
    if (score) score.textContent = `${payload.completionPercent ?? 0}%`
    const statusSvgCircles = qsa('aside svg circle')
    const progressCircle = statusSvgCircles[1]
    if (progressCircle) {
      const radius = Number(progressCircle.getAttribute('r') || 28)
      const circumference = 2 * Math.PI * radius
      const percent = Math.max(0, Math.min(100, Number(payload.completionPercent ?? 0)))
      progressCircle.setAttribute('stroke-dasharray', `${circumference}`)
      progressCircle.setAttribute('stroke-dashoffset', `${circumference * (1 - percent / 100)}`)
    }
    const scoreLabel = qsa('div > p.text-lg.font-bold')[0]
    if (scoreLabel) scoreLabel.textContent = payload.completionSummaryText || 'AI 역량 성숙도'
    const delta = qsa('div > p.text-xs.text-slate-400')[0]
    if (delta) {
      delta.innerHTML = '추천 5개 과정 기준 <span class="text-hyundai-blue font-semibold">실시간 반영</span>'
    }
    const roadmapPill = qsa('div.flex.items-center.justify-between span')[0]
    if (roadmapPill && payload.roadmapPill) roadmapPill.textContent = payload.roadmapPill
    const roadmapList = qsa('aside div.space-y-3')[0]
    let roadmapRows = qsa('div.flex.gap-3').filter((node) => node.closest('aside'))
    if (roadmapList && roadmapRows.length && payload.roadmap.length > roadmapRows.length) {
      const template = roadmapRows[roadmapRows.length - 1]
      while (roadmapRows.length < payload.roadmap.length) {
        const clone = template.cloneNode(true)
        roadmapList.appendChild(clone)
        roadmapRows = qsa('div.flex.gap-3').filter((node) => node.closest('aside'))
      }
    }
    payload.roadmap.forEach((item, index) => {
      const row = roadmapRows[index]
      if (!row) return
      row.style.display = ''
      const statusNode = qs('p.text-xs.font-bold', row)
      const titleNode = qs('p.text-sm.font-semibold', row)
      const numberNode = qs('.w-6.h-6', row)
      const connectorNode = qs('.w-0\\.5', row)
      if (statusNode) statusNode.textContent = item.statusLabel
      if (titleNode) titleNode.textContent = item.title
      if (numberNode) {
        numberNode.textContent = String(index + 1)
        if (item.state === 'done') {
          numberNode.className = 'w-6 h-6 rounded-full bg-[#00AAD2] text-white text-[10px] flex items-center justify-center font-bold'
        } else if (item.state === 'current') {
          numberNode.className = 'w-6 h-6 rounded-full border-2 border-[#00AAD2] text-[#00AAD2] text-[10px] flex items-center justify-center font-bold'
        } else {
          numberNode.className = 'w-6 h-6 rounded-full border-2 border-slate-300 dark:border-slate-700 text-slate-400 text-[10px] flex items-center justify-center font-bold'
        }
      }
      if (connectorNode) {
        connectorNode.className = item.state === 'done'
          ? 'w-0.5 h-full bg-[#00AAD2] mt-1'
          : 'w-0.5 h-full bg-slate-200 dark:bg-slate-800 mt-1'
      }
      if (item.state === 'done') {
        row.classList.remove('opacity-40')
      } else if (item.state === 'upcoming') {
        row.classList.add('opacity-40')
      } else {
        row.classList.remove('opacity-40')
      }
    })
    roadmapRows.slice(payload.roadmap.length).forEach((row) => {
      row.style.display = 'none'
    })
    const sideLinks = qsa('aside a')
    bindGoto(sideLinks[0], '/chatbot')
    bindGoto(sideLinks[1], '/history')
    bindGoto(sideLinks[2], '/learning-path')

    const quickButtons = qsa('.flex.flex-wrap.gap-2.pl-14 button')
    quickButtons.forEach((button) => {
      if (button.dataset.stitchQuickBound === '1') return
      button.dataset.stitchQuickBound = '1'
      button.dataset.stitchBoundAction = 'chat-quick'
      button.addEventListener('click', () => {
        const question = button.textContent.trim()
        post('action', { action: 'chat-message', data: { question } })
      })
    })
    const sendButton = qsa('button').find((button) => button.textContent.includes('send')) || qsa('.material-symbols-outlined').find((node)=>node.textContent==='send')?.parentElement
    const input = qs('input[type="text"]')
    const addButton = qsa('.material-symbols-outlined').find((node) => node.textContent === 'add_circle')?.parentElement
    if (sendButton && input) {
      if (sendButton.dataset.stitchSendBound !== '1') {
        sendButton.dataset.stitchSendBound = '1'
        sendButton.dataset.stitchBoundAction = 'chat-send'
        sendButton.addEventListener('click', () => {
          const question = input.value.trim()
          if (!question) return
          post('action', { action: 'chat-message', data: { question } })
          input.value = ''
        })
      }
      if (input.dataset.stitchEnterBound !== '1') {
        input.dataset.stitchEnterBound = '1'
        input.addEventListener('keydown', (event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          sendButton.click()
        })
      }
    }
    if (addButton && input && addButton.dataset.stitchAddBound !== '1') {
      addButton.dataset.stitchAddBound = '1'
      addButton.dataset.stitchBoundAction = 'chat-add'
      addButton.addEventListener('click', () => {
        if (!input.value.trim()) {
          input.value = '내 현재 상태에 맞는 다음 학습을 추천해줘'
        }
        input.focus()
      })
    }
    bindGoto(qsa('button').find((button) => button.textContent.includes('상세 진단 결과 보기')), '/diagnosis/results')
    bindGoto(qsa('button').find((button) => button.textContent.includes('전체 학습 이력 보기')), '/history')
  }

  function renderPlatformIntro(payload) {
    const primaryButton = qsa('button').find((button) => button.textContent.includes('지금 시작하기'))
    const guideButton = qsa('button').find((button) => button.textContent.includes('서비스 가이드 보기'))
    const diagnosisButton = qsa('button').find((button) => button.textContent.includes('역량 진단 시작하기'))

    if (payload.authenticated) {
      bindGoto(primaryButton, '/diagnosis')
      bindGoto(diagnosisButton, '/diagnosis')
    } else {
      bindGoto(primaryButton, '/signup?next=%2Fdiagnosis')
      bindGoto(diagnosisButton, '/signup?next=%2Fdiagnosis')
    }

    if (guideButton && guideButton.dataset.stitchGuideBound !== '1') {
      guideButton.dataset.stitchGuideBound = '1'
      guideButton.addEventListener('click', () => {
        const target = qsa('section').find((section) => section.textContent?.includes('프로그램 운영 목표'))
        target?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
    }

    const footerLinks = qsa('footer a')
    bindGoto(footerLinks[0], '/')
    bindAction(footerLinks[1], 'notify', { message: '이용약관 문서는 준비 중입니다.' })
    bindAction(footerLinks[2], 'notify', { message: '개인정보처리방침 문서는 준비 중입니다.' })
    bindGoto(footerLinks[3], '/chatbot')
    bindGoto(footerLinks[4], '/chatbot')
    bindAction(footerLinks[5], 'notify', { message: '시스템 도움말 문서는 준비 중입니다.' })
  }

  function hydrateAdminProfile(payload) {
    const profileBlocks = qsa('div').filter((node) => {
      const className = String(node.className || '')
      return className.includes('text-right') || className.includes('text-slate-500')
    })
    profileBlocks.forEach((block) => {
      const lines = qsa('p', block)
      if (lines.length >= 2 && ((lines[0].textContent || '').includes('Alex') || (lines[0].textContent || '').includes('관리자') || (lines[0].textContent || '').includes('Kim'))) {
        lines[0].textContent = payload.userName || '현대위아 관리자'
        lines[1].textContent = payload.organization || '운영 관리자'
      }
    })
  }

  function renderAdminDashboard(payload) {
    hydrateAdminProfile(payload)
    document.title = '현대위아 On Learning Searcher - 관리자 대시보드'
    const searchInput = qsa('input').find((node) => node.placeholder?.includes('Search departments'))
    if (searchInput) searchInput.placeholder = '부서명을 검색하세요'
    const topNavLinks = qsa('a').filter((node) => ['Dashboard', 'Departments', 'Reports', 'Settings'].includes((node.textContent || '').trim()))
    if (topNavLinks[0]) topNavLinks[0].textContent = '대시보드'
    if (topNavLinks[1]) topNavLinks[1].textContent = '부서 분석'
    if (topNavLinks[2]) topNavLinks[2].textContent = '회원 관리'
    if (topNavLinks[3]) topNavLinks[3].textContent = '시스템 설정'
    const rangeButton = qsa('button').find((node) => node.textContent?.includes('Last 30 Days'))
    if (rangeButton) rangeButton.textContent = '최근 30일'
    const exportButtonLabel = qsa('button').find((node) => node.textContent?.includes('Export PDF'))
    if (exportButtonLabel) exportButtonLabel.textContent = 'PDF 내보내기'
    const tabs = qsa('a').filter((node) => ['Overview', 'Participation', 'Completion Rates', 'Skill Gaps'].includes((node.textContent || '').trim()))
    if (tabs[0]) tabs[0].textContent = '개요'
    if (tabs[1]) tabs[1].textContent = '참여 현황'
    if (tabs[2]) tabs[2].textContent = '완료율'
    if (tabs[3]) tabs[3].textContent = '역량 격차'
    const pageHeader = qsa('h1').find((node) => node.textContent?.includes('운영 분석 개요') || node.textContent?.includes('Departmental Analytics'))
    if (pageHeader) pageHeader.textContent = '운영 분석 개요'
    const pageLead = qsa('p').find((node) => node.textContent?.includes('Performance overview'))
    if (pageLead) pageLead.textContent = '회원·진단·추천·신청 흐름을 실데이터 기준으로 확인합니다.'
    const sectionTitle = qsa('h2, h3').find((node) => node.textContent?.includes('Participation Rate by Department'))
    if (sectionTitle) sectionTitle.textContent = '부서별 참여율'
    const compareTitle = qsa('h2, h3').find((node) => node.textContent?.includes('Completion vs Competency'))
    if (compareTitle) compareTitle.textContent = '완료율·역량 점수 비교'
    const lowPerfTitle = qsa('h2, h3').find((node) => node.textContent?.includes('Low Performing Departments'))
    if (lowPerfTitle) lowPerfTitle.textContent = '집중 관리 필요 부서'
    qsa('span').forEach((node) => {
      const text = (node.textContent || '').trim()
      if (text === 'Completion %') node.textContent = '완료율'
      if (text === 'Competency Index') node.textContent = '역량 지수'
      if (text === 'Filter') node.textContent = '필터'
      if (text === 'Status') node.textContent = '상태'
    })
    const kpiCards = qsa('div.grid > div').filter((node) => qsa('h3, p.text-3xl, p.text-2xl', node).length)
    payload.kpis?.forEach((item, index) => {
      const card = kpiCards[index]
      if (!card) return
      const label = qsa('p', card).find((node) => (node.textContent || '').trim().length > 0 && !(node.textContent || '').includes('%'))
      const value = qs('h3, p.text-3xl, p.text-2xl', card)
      const delta = qsa('span', card).find((node) => (node.textContent || '').includes('%') || (node.textContent || '').includes('건') || (node.textContent || '').includes('동일') || (node.textContent || '').includes('긴급'))
      const subValue = qsa('p', card).find((node) => String(node.className || '').includes('text-xs'))
      const progressTrack = qsa('div', card).find((node) => String(node.className || '').includes('bg-slate-100') && String(node.className || '').includes('rounded-full'))
      const progressFill = progressTrack ? qsa('div', progressTrack)[0] : null
      if (label) label.textContent = item.label
      if (value) value.innerHTML = `${item.value}<span class="text-lg font-normal ml-1">${escapeHtml(item.unit || '')}</span>`
      if (delta) {
        delta.textContent = item.delta
        delta.className =
          item.tone === 'positive'
            ? 'text-green-500 bg-green-500/10 px-2 py-0.5 rounded text-xs font-bold'
            : item.tone === 'danger'
              ? 'text-red-500 bg-red-500/10 px-2 py-0.5 rounded text-xs font-bold'
              : item.tone === 'warning'
                ? 'text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded text-xs font-bold'
                : 'text-slate-500 bg-slate-500/10 px-2 py-0.5 rounded text-xs font-bold'
      }
      if (subValue) {
        if (index === 0) subValue.textContent = '전체 평균'
        if (index === 1) subValue.textContent = '전체 평균'
        if (index === 2) subValue.textContent = '100점 환산 기준'
        if (index === 3) subValue.textContent = '현재 기준'
      }
      if (progressFill) {
        progressFill.style.width = `${Math.max(0, Math.min(100, Number(item.progress || 0)))}%`
        if (index === 0) progressFill.className = 'bg-primary h-full rounded-full'
        if (index === 1) progressFill.className = 'bg-navy-wia h-full rounded-full'
        if (index === 2) progressFill.className = 'bg-amber-500 h-full rounded-full'
      }
    })
    const activeCard = kpiCards[3]
    if (activeCard) {
      const avatarRow = qsa('img, div', activeCard).filter((node) => {
        const className = String(node.className || '')
        return className.includes('inline-block h-6 w-6') || className.includes('rounded-full ring-2')
      })
      avatarRow.forEach((node, index) => {
        if (node.tagName === 'DIV' && index === avatarRow.length - 1) node.textContent = `+${Math.max(0, Number(payload.kpis?.[3]?.value || 0) - 3)}`
      })
    }
    const funnelRows = qsa('div').filter((node) => (node.textContent || '').includes('진단 완료') || (node.textContent || '').includes('추천 교육 확인') || (node.textContent || '').includes('신청 폼 진입') || (node.textContent || '').includes('신청 최종 완료'))
    payload.funnel?.forEach((item, index) => {
      const row = funnelRows[index]
      if (!row) return
      const spans = qsa('span', row)
      if (spans[0]) spans[0].textContent = item.label
      if (spans[1]) spans[1].textContent = `${item.percent}%`
      const fill = qsa('div', row).find((node) => String(node.className || '').includes('bg-primary') || String(node.className || '').includes('bg-hyundai-blue') || String(node.className || '').includes('bg-primary h-full'))
      if (fill) fill.style.width = `${item.percent}%`
    })
    const insightNodes = qsa('p').filter((node) => (node.textContent || '').includes('가장 큰') || (node.textContent || '').includes('신청 실패') || (node.textContent || '').includes('복귀'))
    payload.insights?.forEach((item, index) => {
      if (insightNodes[index]) insightNodes[index].textContent = `${item.title}: ${item.body}`
    })
    const actionList = qsa('li')
    payload.urgentActions?.forEach((item, index) => {
      if (actionList[index]) actionList[index].textContent = item
    })
    const participationRows = qsa('div.flex.items-center.gap-4').filter((node) => qsa('span', node).some((span) => String(span.textContent || '').includes('%')))
    payload.departmentComparisons?.slice(0, 5).forEach((department, index) => {
      const row = participationRows[index]
      if (!row) return
      const spans = qsa('span', row)
      if (spans[0]) spans[0].textContent = department.name
      if (spans[spans.length - 1]) spans[spans.length - 1].textContent = `${department.participation}%`
      const fill = qsa('div', row).find((node) => String(node.className || '').includes('bg-primary'))
      if (fill) fill.style.width = `${department.participation}%`
    })

    const trendColumns = qsa('div.flex.flex-col.items-center.flex-1').filter((node) => qsa('span', node).some((span) => ['Jan', 'Feb', 'Mar', 'Apr', 'May'].includes((span.textContent || '').trim())))
    payload.trendComparison?.forEach((item, index) => {
      const column = trendColumns[index]
      if (!column) return
      const bars = qsa('div.w-3', column)
      if (bars[0]) bars[0].style.height = `${item.completion}%`
      if (bars[1]) bars[1].style.height = `${item.competency}%`
      const monthLabel = qsa('span', column).find((node) => ['Jan', 'Feb', 'Mar', 'Apr', 'May'].includes((node.textContent || '').trim()))
      if (monthLabel) monthLabel.textContent = item.label
    })

    const departmentRows = qsa('tbody tr')
    payload.departmentComparisons?.slice(0, 5).forEach((department, index) => {
      const row = departmentRows[index]
      if (!row) return
      const cells = qsa('td', row)
      if (cells[0]) cells[0].textContent = department.name
      if (cells[1]) cells[1].textContent = `${department.users}명`
      if (cells[2]) cells[2].textContent = `${department.participation}%`
      if (cells[3]) {
        const bar = qsa('div.bg-green-500, div.bg-amber-500, div.bg-primary', cells[3])[0]
        const label = qsa('span', cells[3]).find((node) => String(node.textContent || '').includes('%'))
        if (bar) {
          bar.style.width = `${department.completion}%`
          bar.className =
            department.completion >= 85
              ? 'bg-green-500 h-full rounded-full'
              : department.completion >= 70
                ? 'bg-primary h-full rounded-full'
                : 'bg-amber-500 h-full rounded-full'
        }
        if (label) label.textContent = `${department.completion}%`
      }
      if (cells[4]) cells[4].textContent = `${department.avgScore}점`
      if (cells[5]) {
        const badge = qs('span', cells[5])
        const statusText = department.completion >= 85 ? '우수' : department.completion >= 70 ? '정상' : '주의'
        if (badge) {
          badge.textContent = statusText
          badge.className =
            statusText === '우수'
              ? 'px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
              : statusText === '정상'
                ? 'px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : 'px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
        }
      }
    })
    const summaryText = qsa('span').find((node) => (node.textContent || '').includes('전체 32개 부서'))
    if (summaryText && payload.summary) {
      summaryText.textContent = `전체 ${payload.summary.departmentCount}개 부서 중 ${payload.summary.displayedDepartments}개 표시`
    }
    const buttons = qsa('button', document)
    bindAction(buttons.find((button) => button.textContent?.includes('상세 리포트')), 'open-detail-report')
    bindAction(
      buttons.find((button) => button.textContent?.includes('Excel 다운로드') || button.textContent?.includes('Export')),
      'export-dashboard-report',
    )
    const actionsContainer = qsa('div').find((node) => {
      const className = String(node.className || '')
      return className.includes('bg-white') && node.textContent.includes('즉시 권장 액션')
    })
    if (actionsContainer) {
      const buttonsInActions = qsa('button', actionsContainer)
      bindAction(buttonsInActions[0], 'run-admin-action', { key: 'users' })
      bindAction(buttonsInActions[1], 'run-admin-action', { key: 'questions' })
      bindAction(buttonsInActions[2], 'run-admin-action', { key: 'courses' })
      if (buttonsInActions[3]) bindAction(buttonsInActions[3], 'run-admin-action', { key: 'departments' })
    }
    const footerText = qsa('p').find((node) => node.textContent?.includes('Confidential') || node.textContent?.includes('All rights reserved'))
    if (footerText) footerText.textContent = '© 2026 HYUNDAI WIA Corp. All rights reserved. 관리자 페이지는 운영 데이터 관리를 위해 제공됩니다.'
  }

  function renderAdminDepartments(payload) {
    hydrateAdminProfile(payload)
    document.title = '현대위아 On Learning Searcher - 부서 분석'
    const title = qsa('h1').find((node) => node.textContent?.includes('부서별 상세 분석'))
    if (title) title.textContent = '부서별 상세 분석'
    const cards = qsa('section.grid > div')
    if (cards[0]) {
      const heading = qsa('p', cards[0])
      if (heading[0]) heading[0].textContent = '부서 평균 참여율'
      const value = qs('h3', cards[0])
      if (value) value.innerHTML = `${payload.departments?.[0]?.participation ?? 0}%`
    }
    const tableBody = qs('tbody')
    if (tableBody && Array.isArray(payload.departments)) {
      tableBody.innerHTML = payload.departments.map((department) => `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="px-6 py-4 text-sm font-semibold">${escapeHtml(department.name)}</td>
          <td class="px-6 py-4 text-sm text-slate-600">${department.users}명</td>
          <td class="px-6 py-4 text-sm text-slate-600">${department.participation}%</td>
          <td class="px-6 py-4 text-sm text-slate-600">${department.completion}%</td>
          <td class="px-6 py-4 text-sm text-slate-600">${department.avgScore}점</td>
        </tr>
      `).join('')
    }
    const exportButton = qsa('button').find((node) => node.textContent?.includes('보고서 내보내기'))
    bindAction(exportButton, 'export-departments-report')
    const searchInput = qsa('input').find((node) => node.placeholder === '검색' || node.placeholder?.includes('Search departments'))
    const ensureFilterStatus = (input, key) => {
      const host = input.parentElement?.parentElement || input.parentElement
      if (!host) return null
      let status = host.querySelector(`[data-admin-filter-status="${key}"]`)
      if (!status) {
        status = document.createElement('p')
        status.setAttribute('data-admin-filter-status', key)
        status.className = 'mt-2 text-xs text-slate-500'
        host.appendChild(status)
      }
      return status
    }
    const ensureEmptyState = (container, key, message) => {
      if (!container) return null
      const host = container.parentElement || container
      let empty = host.querySelector(`[data-admin-empty-state="${key}"]`)
      if (!empty) {
        empty = document.createElement('div')
        empty.setAttribute('data-admin-empty-state', key)
        empty.className = 'hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500 text-center'
        empty.textContent = message
        host.appendChild(empty)
      }
      return empty
    }
    const updateTableFilterState = (input, rows, key, message) => {
      const visibleRows = rows.filter((row) => row.style.display !== 'none')
      const status = ensureFilterStatus(input, key)
      if (status) {
        status.textContent = `${visibleRows.length} / ${rows.length}건 표시`
      }
      const empty = ensureEmptyState(rows[0]?.closest('table') || qs('table'), key, message)
      if (empty) empty.classList.toggle('hidden', visibleRows.length !== 0)
    }
    if (searchInput && searchInput.dataset.stitchFilterBound !== '1') {
      searchInput.placeholder = '부서를 검색하세요'
      searchInput.dataset.stitchFilterBound = '1'
      searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim().toLowerCase()
        const rows = qsa('tbody tr')
        rows.forEach((row) => {
          const visible = !keyword || (row.textContent || '').toLowerCase().includes(keyword)
          row.style.display = visible ? '' : 'none'
        })
        updateTableFilterState(searchInput, rows, 'departments', '검색 조건에 맞는 부서가 없습니다.')
      })
      updateTableFilterState(searchInput, qsa('tbody tr'), 'departments', '검색 조건에 맞는 부서가 없습니다.')
    }
    const footerText = qsa('p').find((node) => node.textContent?.includes('Confidential') || node.textContent?.includes('All rights reserved'))
    if (footerText) footerText.textContent = '© 2026 HYUNDAI WIA Corp. All rights reserved. 관리자 페이지는 운영 데이터 관리를 위해 제공됩니다.'
  }

  function renderAdminQuestions(payload) {
    hydrateAdminProfile(payload)
    document.title = '현대위아 On Learning Searcher - 역량진단 문항 관리'
    const brand = qsa('h1, h2').find((node) => node.innerHTML?.includes('On-Learning Admin'))
    if (brand) brand.innerHTML = 'HYUNDAI WIA<br/><span class="text-[10px] font-normal opacity-80 uppercase">On Learning Searcher</span>'
    const profileName = qsa('p').find((node) => node.textContent?.includes('Admin Master'))
    if (profileName) profileName.textContent = payload.userName || '현대위아 관리자'
    const sideLinks = qsa('a').filter((node) => ['Overview', 'Competency Questions', 'Learning Path', 'Assessments', 'Analytics'].includes((node.textContent || '').trim()))
    if (sideLinks[0]) sideLinks[0].textContent = '대시보드'
    if (sideLinks[1]) sideLinks[1].textContent = '역량진단 문항'
    if (sideLinks[2]) sideLinks[2].textContent = '추천 경로'
    if (sideLinks[3]) sideLinks[3].textContent = '진단 기록'
    if (sideLinks[4]) sideLinks[4].textContent = '운영 분석'
    const systemStatus = qsa('p, div, span').find((node) => (node.textContent || '').trim() === 'System Status')
    if (systemStatus) systemStatus.textContent = '시스템 상태'
    const searchInput = qsa('input').find((node) => node.placeholder?.includes('Search by ID'))
    if (searchInput) searchInput.placeholder = '문항 ID, 진단 영역, 내용으로 검색'
    qsa('button, span').forEach((node) => {
      const text = (node.textContent || '').trim()
      if (text === 'Filter') node.textContent = '필터'
      if (text === 'Export') node.textContent = '내보내기'
      if (text === 'Question Health') node.textContent = '문항 상태'
      if (text === 'Top Category') node.textContent = '최다 영역'
      if (text === 'Awaiting Review') node.textContent = '검토 필요'
      if (text === 'Previous') node.textContent = '이전'
      if (text === 'Next') node.textContent = '다음'
    })
    qsa('th').forEach((node) => {
      const text = (node.textContent || '').trim()
      if (text === 'ID') node.textContent = '문항 ID'
      if (text === 'Category') node.textContent = '진단 영역'
      if (text === 'Content') node.textContent = '문항 내용'
      if (text === 'Status') node.textContent = '상태'
      if (text === 'Actions') node.textContent = '관리'
    })
    const title = qsa('h1, h2').find((node) => node.textContent?.includes('역량진단 문항 설정') || node.textContent?.includes('Competency Question Management'))
    if (title) title.textContent = '역량진단 문항 설정'
    const lead = qsa('p').find((node) => node.textContent?.includes('Configure and organize'))
    if (lead) lead.textContent = '역량진단에 사용되는 문항을 추가, 수정, 삭제하고 실제 설문 화면에 반영할 수 있습니다.'
    const primaryButton = qsa('button').find((node) => node.textContent?.includes('Add New Question') || node.textContent?.includes('Add'))
    if (primaryButton) {
      primaryButton.innerHTML = '<span class="material-symbols-outlined">add</span><span>문항 추가</span>'
      bindAction(primaryButton, 'add-question')
    }
    const exportButton = qsa('button, span').find((node) => (node.textContent || '').trim() === '내보내기')
    if (exportButton) bindAction(exportButton.closest('button') || exportButton, 'export-questions')
    const tbody = qs('tbody')
    if (tbody && Array.isArray(payload.questions)) {
      tbody.innerHTML = payload.questions.slice(0, 12).map((question) => `
        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td class="px-6 py-4 text-sm font-semibold text-slate-400">#Q-${question.order}</td>
          <td class="px-6 py-4"><span class="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">${escapeHtml(question.area)}</span></td>
          <td class="px-6 py-4"><p class="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-md line-clamp-1">${escapeHtml(question.title)}</p></td>
          <td class="px-6 py-4 text-sm text-slate-500">${escapeHtml(question.date)}</td>
          <td class="px-6 py-4 text-center"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold"><span class="size-1.5 rounded-full bg-green-500"></span>${escapeHtml(question.status)}</span></td>
          <td class="px-6 py-4 text-right">
            <div class="flex justify-end gap-3">
              <button data-stitch-edit-question="${question.id}" class="text-primary dark:text-accent font-bold text-sm hover:underline">수정</button>
              <button data-stitch-delete-question="${question.id}" class="text-red-500 font-bold text-sm hover:underline">삭제</button>
            </div>
          </td>
        </tr>
      `).join('')
      qsa('[data-stitch-edit-question]').forEach((button) => bindAction(button, 'edit-question', { id: button.getAttribute('data-stitch-edit-question') }))
      qsa('[data-stitch-delete-question]').forEach((button) => bindAction(button, 'delete-question', { id: button.getAttribute('data-stitch-delete-question') }))
    }
    const questionSearch = qsa('input').find((node) => node.placeholder?.includes('문항 ID'))
    if (questionSearch && questionSearch.dataset.stitchFilterBound !== '1') {
      questionSearch.dataset.stitchFilterBound = '1'
      questionSearch.addEventListener('input', () => {
        const keyword = questionSearch.value.trim().toLowerCase()
        const rows = qsa('tbody tr')
        rows.forEach((row) => {
          row.style.display = !keyword || (row.textContent || '').toLowerCase().includes(keyword) ? '' : 'none'
        })
        const visibleRows = rows.filter((row) => row.style.display !== 'none')
        updateFilteredListState({
          host: questionSearch.parentElement?.parentElement,
          key: 'questions',
          total: rows.length,
          visible: visibleRows.length,
          message: '검색 조건에 맞는 문항이 없습니다.',
          formatter: (visible, total) => `${visible} / ${total}건 표시`,
        })
      })
      questionSearch.dispatchEvent(new Event('input'))
    }
    const footerText = qsa('p').find((node) => node.textContent?.includes('Confidential') || node.textContent?.includes('All rights reserved'))
    if (footerText) footerText.textContent = '© 2026 HYUNDAI WIA Corp. All rights reserved. 관리자 페이지는 운영 데이터 관리를 위해 제공됩니다.'
  }

  function renderAdminCourses(payload) {
    hydrateAdminProfile(payload)
    document.title = '현대위아 On Learning Searcher - 교육과정 관리'
    const brand = qsa('h2').find((node) => node.textContent?.includes('Hyundai Wia On-Learning Admin'))
    if (brand) brand.innerHTML = 'HYUNDAI WIA <span class="text-primary">On Learning Searcher</span>'
    const topNav = qsa('span').filter((node) => ['Dashboard', 'System Settings'].includes((node.textContent || '').trim()))
    if (topNav[0]) topNav[0].textContent = '대시보드'
    if (topNav[1]) topNav[1].textContent = '시스템 설정'
    const searchInput = qsa('input').find((node) => node.placeholder?.includes('Search courses'))
    if (searchInput) searchInput.placeholder = '과정명 또는 영역으로 검색'
    qsa('th').forEach((node) => {
      const text = (node.textContent || '').trim()
      if (text === 'Enrolled Users') node.textContent = '연결 신청 건수'
      if (text === 'Status') node.textContent = '상태'
      if (text === 'Actions') node.textContent = '관리'
    })
    qsa('p, span').forEach((node) => {
      const text = (node.textContent || '').trim()
      if (text === 'Total Online Courses') node.textContent = '전체 추천 과정'
      if (text === 'Overview') node.textContent = '개요'
      if (text === 'Export List') node.textContent = '목록 내보내기'
    })
    const primaryButton = qsa('button').find((node) => node.textContent?.includes('Add New Course') || node.textContent?.includes('Add'))
    if (primaryButton) {
      primaryButton.innerHTML = '<span class="material-symbols-outlined">add</span><span>과정 추가</span>'
      bindAction(primaryButton, 'add-course')
    }
    const uploadButton = qsa('button, span').find((node) => (node.textContent || '').trim() === '과정 데이터 업로드')
    if (uploadButton) bindAction(uploadButton.closest('button') || uploadButton, 'upload-course-catalog')
    const exportButton = qsa('button, span').find((node) => (node.textContent || '').trim() === '목록 내보내기')
    if (exportButton) bindAction(exportButton.closest('button') || exportButton, 'export-courses')
    const tbody = qs('tbody')
    if (tbody && Array.isArray(payload.courses)) {
      tbody.innerHTML = payload.courses.slice(0, 8).map((course) => `
        <tr class="border-b border-slate-100 dark:border-slate-800">
          <td class="px-6 py-4"><div class="text-sm font-semibold">${escapeHtml(course.title)}</div></td>
          <td class="px-6 py-4 text-sm text-slate-600">${escapeHtml(course.category)}</td>
          <td class="px-6 py-4 text-sm text-slate-600">${escapeHtml(course.level)}</td>
          <td class="px-6 py-4 text-sm text-slate-600">${course.durationHours}h</td>
          <td class="px-6 py-4 text-center text-sm font-semibold text-slate-700">${course.users}</td>
          <td class="px-6 py-4"><span class="inline-flex items-center px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-bold">${escapeHtml(course.status)}</span></td>
          <td class="px-6 py-4 text-right">
            <div class="flex justify-end gap-3">
              <button data-stitch-manage-course="${escapeHtml(course.id)}" class="text-primary font-bold text-sm hover:underline">수정</button>
              <button data-stitch-delete-course="${escapeHtml(course.id)}" class="text-red-500 font-bold text-sm hover:underline">삭제</button>
            </div>
          </td>
        </tr>
      `).join('')
      qsa('[data-stitch-manage-course]').forEach((button) => bindAction(button, 'manage-course', { id: button.getAttribute('data-stitch-manage-course') }))
      qsa('[data-stitch-delete-course]').forEach((button) => bindAction(button, 'delete-course', { id: button.getAttribute('data-stitch-delete-course') }))
    }
    if (searchInput && searchInput.dataset.stitchFilterBound !== '1') {
      searchInput.dataset.stitchFilterBound = '1'
      searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim().toLowerCase()
        const rows = qsa('tbody tr')
        rows.forEach((row) => {
          row.style.display = !keyword || (row.textContent || '').toLowerCase().includes(keyword) ? '' : 'none'
        })
        const visibleRows = rows.filter((row) => row.style.display !== 'none')
        updateFilteredListState({
          host: searchInput.parentElement?.parentElement,
          key: 'courses',
          total: rows.length,
          visible: visibleRows.length,
          message: '검색 조건에 맞는 과정이 없습니다.',
          formatter: (visible, total) => `${visible} / ${total}건 표시`,
        })
      })
      searchInput.dispatchEvent(new Event('input'))
    }
    const footerText = qsa('p').find((node) => node.textContent?.includes('Confidential') || node.textContent?.includes('All rights reserved'))
    if (footerText) footerText.textContent = '© 2026 HYUNDAI WIA Corp. All rights reserved. 관리자 페이지는 운영 데이터 관리를 위해 제공됩니다.'
  }

  function renderAdminUsers(payload) {
    hydrateAdminProfile(payload)
    document.title = '현대위아 On Learning Searcher - 회원 관리'
    const brand = qsa('h2').find((node) => node.textContent?.includes('On-Learning Admin'))
    if (brand) brand.innerHTML = 'HYUNDAI WIA <span class="text-primary">On Learning Searcher</span>'
    const topNav = qsa('a').filter((node) => ['Dashboard', 'Reports'].includes((node.textContent || '').trim()))
    if (topNav[0]) topNav[0].textContent = '대시보드'
    if (topNav[1]) topNav[1].textContent = '운영 리포트'
    const searchInput = qsa('input').find((node) => node.placeholder?.includes('Search by name'))
    if (searchInput) searchInput.placeholder = '이름, 사번, 이메일로 검색'
    const selectNodes = qsa('select')
    const divisionSelect = selectNodes[0]
    const statusSelect = selectNodes[1]
    if (divisionSelect) {
      const divisionOptions = ['전체 본부', ...(payload.filters?.divisions || [])]
      divisionSelect.innerHTML = divisionOptions.map((label) => `<option>${escapeHtml(label)}</option>`).join('')
    }
    if (statusSelect) {
      const statusOptions = ['전체 상태', ...(payload.filters?.statuses || [])]
      statusSelect.innerHTML = statusOptions.map((label) => `<option>${escapeHtml(label)}</option>`).join('')
    }
    qsa('th').forEach((node) => {
      const text = (node.textContent || '').trim()
      if (text === 'Status') node.textContent = '상태'
      if (text === 'Actions') node.textContent = '관리'
    })
    const exportButton = qsa('button, span').find((node) => ['내보내기', 'Export'].includes((node.textContent || '').trim()))
    if (exportButton) bindAction(exportButton.closest('button') || exportButton, 'export-users')
    const getStatusTone = (status) => {
      if (status === '수강완료') {
        return {
          wrap: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
          dot: 'bg-green-500',
        }
      }
      if (status === '신청완료') {
        return {
          wrap: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
          dot: 'bg-blue-500',
        }
      }
      if (status === '확인필요') {
        return {
          wrap: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
          dot: 'bg-amber-500',
        }
      }
      if (status === '신청실패') {
        return {
          wrap: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
          dot: 'bg-red-500',
        }
      }
      if (status === '진단완료') {
        return {
          wrap: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
          dot: 'bg-purple-500',
        }
      }
      return {
        wrap: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400',
        dot: 'bg-slate-400',
      }
    }
    const tbody = qs('tbody')
    if (tbody && Array.isArray(payload.users)) {
      tbody.innerHTML = payload.users.map((user) => {
        const tone = getStatusTone(user.status)
        return `
        <tr class="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
          <td class="px-6 py-4">
            <div class="flex items-center gap-3">
              <div class="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">${escapeHtml((user.name || '?').slice(0, 2))}</div>
              <div>
                <div class="text-sm font-semibold text-slate-900 dark:text-slate-100">${escapeHtml(user.name)}</div>
                <div class="text-xs text-slate-500">${escapeHtml(user.email)}</div>
              </div>
            </div>
          </td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${escapeHtml(user.employeeId)}</td>
          <td class="px-6 py-4"><span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200">${escapeHtml(user.division)} / ${escapeHtml(user.team)}</span></td>
          <td class="px-6 py-4 text-sm text-slate-600 dark:text-slate-400">${escapeHtml(user.diagnosisDate)}</td>
          <td class="px-6 py-4"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tone.wrap}"><span class="w-1.5 h-1.5 rounded-full ${tone.dot}"></span>${escapeHtml(user.status)}</span></td>
          <td class="px-6 py-4 text-right">
            <div class="flex justify-end gap-3">
              <button data-stitch-edit-user="${escapeHtml(user.id)}" class="text-primary hover:text-primary/80 font-semibold text-sm">수정</button>
              <button data-stitch-role-user="${escapeHtml(user.id)}" class="text-slate-500 hover:text-slate-900 font-semibold text-sm">권한</button>
              <button data-stitch-delete-user="${escapeHtml(user.id)}" class="text-red-500 hover:text-red-600 font-semibold text-sm">삭제</button>
            </div>
          </td>
        </tr>
      `}).join('')
      qsa('[data-stitch-edit-user]').forEach((button) => bindAction(button, 'edit-user', { id: button.getAttribute('data-stitch-edit-user') }))
      qsa('[data-stitch-role-user]').forEach((button) => bindAction(button, 'change-user-role', { id: button.getAttribute('data-stitch-role-user') }))
      qsa('[data-stitch-delete-user]').forEach((button) => bindAction(button, 'delete-user', { id: button.getAttribute('data-stitch-delete-user') }))
    }
    const applyUserFilter = () => {
      const keyword = searchInput?.value.trim().toLowerCase() || ''
      const divisionFilter = selectNodes[0]?.value || '전체 본부'
      const statusFilter = selectNodes[1]?.value || '전체 상태'
      const rows = qsa('tbody tr')
      rows.forEach((row) => {
        const text = (row.textContent || '').toLowerCase()
        const matchesKeyword = !keyword || text.includes(keyword)
        const matchesDivision = divisionFilter === '전체 본부' || text.includes(divisionFilter.toLowerCase())
        const matchesStatus = statusFilter === '전체 상태' || text.includes(statusFilter.toLowerCase())
        row.style.display = matchesKeyword && matchesDivision && matchesStatus ? '' : 'none'
      })
      const visibleRows = rows.filter((row) => row.style.display !== 'none')
      updateFilteredListState({
        host: searchInput?.parentElement?.parentElement,
        key: 'users',
        total: rows.length,
        visible: visibleRows.length,
        message: '검색 조건에 맞는 회원이 없습니다.',
        formatter: (visible, total) => `${visible} / ${total}명 표시`,
      })
    }
    if (searchInput && searchInput.dataset.stitchFilterBound !== '1') {
      searchInput.dataset.stitchFilterBound = '1'
      searchInput.addEventListener('input', applyUserFilter)
    }
    selectNodes.slice(0, 2).forEach((select) => {
      if (select.dataset.stitchFilterBound !== '1') {
        select.dataset.stitchFilterBound = '1'
        select.addEventListener('change', applyUserFilter)
      }
    })
    applyUserFilter()
    const footerText = qsa('p').find((node) => node.textContent?.includes('Confidential') || node.textContent?.includes('All rights reserved'))
    if (footerText) footerText.textContent = '© 2026 HYUNDAI WIA Corp. All rights reserved. 관리자 페이지는 운영 데이터 관리를 위해 제공됩니다.'
  }

  function renderAdminBoards(payload) {
    hydrateAdminProfile(payload)
    document.title = '현대위아 On Learning Searcher - 공지 및 FAQ 관리'
    const brand = qsa('h2').find((node) => node.textContent?.includes('On-Learning Admin'))
    if (brand) brand.innerHTML = 'HYUNDAI WIA <span class="text-primary">On Learning Searcher</span>'
    const topNav = qsa('a').filter((node) => ['Dashboard', 'Settings'].includes((node.textContent || '').trim()))
    if (topNav[0]) topNav[0].textContent = '대시보드'
    if (topNav[1]) topNav[1].textContent = '시스템 설정'
    const quickTabs = qsa('span').filter((node) => ['Overview', 'Competency Questions'].includes((node.textContent || '').trim()))
    if (quickTabs[0]) quickTabs[0].textContent = '개요'
    if (quickTabs[1]) quickTabs[1].textContent = '공지 / FAQ'
    const systemStatus = qsa('p').find((node) => (node.textContent || '').trim() === 'System Status')
    if (systemStatus) systemStatus.textContent = '시스템 상태'
    const searchInput = qsa('input').find((node) => node.placeholder?.includes('Search resources') || node.placeholder?.includes('Search by ID'))
    if (searchInput) searchInput.placeholder = '공지 제목 또는 FAQ 질문으로 검색'
    qsa('span, button').forEach((node) => {
      const text = (node.textContent || '').trim()
      if (text === 'Filter') node.textContent = '필터'
      if (text === 'Export') node.textContent = '내보내기'
      if (text === 'Previous') node.textContent = '이전'
      if (text === 'Next') node.textContent = '다음'
      if (text === 'Question Health') node.textContent = '등록 상태'
      if (text === 'Top Category') node.textContent = '상위 구분'
      if (text === 'Awaiting Review') node.textContent = '검토 필요'
    })
    qsa('th').forEach((node) => {
      const text = (node.textContent || '').trim()
      if (text === 'Status') node.textContent = '등록일'
      if (text === 'Actions') node.textContent = '관리'
    })
    const title = qsa('h1, h2').find((node) => node.textContent?.includes('Competency Question Management') || node.textContent?.includes('Question'))
    if (title) title.textContent = '공지 / FAQ 관리'
    const lead = qsa('p').find((node) => node.textContent?.includes('Configure and organize'))
    if (lead) lead.textContent = '공지사항과 FAQ를 실데이터 기준으로 관리합니다.'
    const primaryButton = qsa('button').find((node) => node.textContent?.includes('Add New Question') || node.textContent?.includes('Add'))
    if (primaryButton) {
      primaryButton.innerHTML = '<span class="material-symbols-outlined">add</span><span>공지 추가</span>'
      bindAction(primaryButton, 'add-notice')
    }
    const exportButton = qsa('button, span').find((node) => (node.textContent || '').trim() === '내보내기')
    if (exportButton) bindAction(exportButton.closest('button') || exportButton, 'export-boards')
    const tbody = qs('tbody')
    if (tbody && Array.isArray(payload.notices)) {
      tbody.innerHTML = payload.notices.slice(0, 10).map((notice) => `
        <tr class="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
          <td class="px-6 py-4 text-sm font-semibold text-slate-400">${escapeHtml(notice.id)}</td>
          <td class="px-6 py-4"><span class="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">${escapeHtml(notice.category)}</span></td>
          <td class="px-6 py-4"><p class="text-sm font-medium text-slate-700 dark:text-slate-200 max-w-md line-clamp-1">${escapeHtml(notice.title)}</p></td>
          <td class="px-6 py-4 text-center"><span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold"><span class="size-1.5 rounded-full bg-green-500"></span>${escapeHtml(notice.date)}</span></td>
          <td class="px-6 py-4 text-right">
            <div class="flex justify-end gap-2">
              <button data-stitch-edit-notice="${escapeHtml(notice.id)}" class="p-1.5 text-slate-400 hover:text-primary transition-colors"><span class="material-symbols-outlined">edit</span></button>
              <button data-stitch-delete-notice="${escapeHtml(notice.id)}" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined">delete</span></button>
            </div>
          </td>
        </tr>
      `).join('')
      qsa('[data-stitch-edit-notice]').forEach((button) => bindAction(button, 'edit-notice', { id: button.getAttribute('data-stitch-edit-notice') }))
      qsa('[data-stitch-delete-notice]').forEach((button) => bindAction(button, 'delete-notice', { id: button.getAttribute('data-stitch-delete-notice') }))
    }
    if (searchInput && searchInput.dataset.stitchFilterBound !== '1') {
      searchInput.dataset.stitchFilterBound = '1'
      searchInput.addEventListener('input', () => {
        const keyword = searchInput.value.trim().toLowerCase()
        const rows = qsa('tbody tr')
        rows.forEach((row) => {
          row.style.display = !keyword || (row.textContent || '').toLowerCase().includes(keyword) ? '' : 'none'
        })
        const faqCards = qsa('[data-stitch-edit-faq]').map((button) => button.closest('.rounded-xl')).filter(Boolean)
        faqCards.forEach((card) => {
          card.style.display = !keyword || (card.textContent || '').toLowerCase().includes(keyword) ? '' : 'none'
        })
        const visibleRows = rows.filter((row) => row.style.display !== 'none').length
        const visibleFaqs = faqCards.filter((card) => card.style.display !== 'none').length
        const total = rows.length + faqCards.length
        const visible = visibleRows + visibleFaqs
        updateFilteredListState({
          host: searchInput.parentElement?.parentElement,
          key: 'boards',
          total,
          visible,
          message: '검색 조건에 맞는 공지나 FAQ가 없습니다.',
          formatter: (shown, count) => `${shown} / ${count}건 표시`,
        })
      })
      searchInput.dispatchEvent(new Event('input'))
    }
    const faqSection = qsa('h3').find((node) => node.textContent?.includes('온라인 과정 데이터 업로드'))?.closest('div.bg-white')
    if (faqSection) {
      faqSection.classList.add('space-y-4')
      faqSection.innerHTML = `
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-lg font-bold text-slate-900 dark:text-white">FAQ 관리</h3>
            <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">자주 묻는 질문을 추가하고 삭제할 수 있습니다.</p>
          </div>
          <button data-stitch-add-faq class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold shadow-md hover:bg-primary/90 transition-all">FAQ 추가</button>
        </div>
        <div class="space-y-3">
          ${(Array.isArray(payload.faqs) ? payload.faqs : []).slice(0, 8).map((faq) => `
            <div class="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 p-4">
              <div class="flex items-start justify-between gap-4">
                <div>
                  <p class="text-sm font-bold text-slate-900 dark:text-white">${escapeHtml(faq.question)}</p>
                  <p class="text-sm text-slate-500 dark:text-slate-400 mt-2">${escapeHtml(faq.answer)}</p>
                </div>
                <div class="flex items-center gap-2">
                  <button data-stitch-edit-faq="${escapeHtml(faq.id)}" class="p-1.5 text-slate-400 hover:text-primary transition-colors"><span class="material-symbols-outlined">edit</span></button>
                  <button data-stitch-delete-faq="${escapeHtml(faq.id)}" class="p-1.5 text-slate-400 hover:text-red-500 transition-colors"><span class="material-symbols-outlined">delete</span></button>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      `
      bindAction(qs('[data-stitch-add-faq]', faqSection), 'add-faq')
      qsa('[data-stitch-edit-faq]', faqSection).forEach((button) => bindAction(button, 'edit-faq', { id: button.getAttribute('data-stitch-edit-faq') }))
      qsa('[data-stitch-delete-faq]', faqSection).forEach((button) => bindAction(button, 'delete-faq', { id: button.getAttribute('data-stitch-delete-faq') }))
    }
    const footerText = qsa('p').find((node) => node.textContent?.includes('Confidential') || node.textContent?.includes('All rights reserved'))
    if (footerText) footerText.textContent = '© 2026 HYUNDAI WIA Corp. All rights reserved. 관리자 페이지는 운영 데이터 관리를 위해 제공됩니다.'
  }

  function render(payload) {
    currentPayload = payload
    if (page === '01-home.html') return renderHome(payload)
    if (page === '02-diagnosis.html') return renderDiagnosis(payload)
    if (page === '03-diagnosis-results.html') return renderResults(payload)
    if (page === '04-learning-path.html') return renderLearningPath(payload)
    if (page === '05-recommendation.html') return renderRecommendation(payload)
    if (page === '06-course-linking.html') return renderCourseLinking(payload)
    if (page === '07-history.html') return renderHistory(payload)
    if (page === '08-analytics.html') return renderAnalytics(payload)
    if (page === '09-chatbot.html') return renderChatbot(payload)
    if (page === '10-platform-intro.html') return renderPlatformIntro(payload)
    if (page === '11-admin-dashboard.html') return renderAdminDashboard(payload)
    if (page === '12-admin-departments.html') return renderAdminDepartments(payload)
    if (page === '13-admin-questions.html') return renderAdminQuestions(payload)
    if (page === '14-admin-courses.html') return renderAdminCourses(payload)
    if (page === '15-admin-users.html') return renderAdminUsers(payload)
    if (page === '16-admin-boards.html') return renderAdminBoards(payload)
  }

  window.addEventListener('message', (event) => {
    if (event.origin !== window.location.origin) return
    if (event.data?.source !== 'stitch-host') return
    if (event.data?.type !== 'stitch-data') return
    render(event.data.payload)
    normalizePageLayout()
    if (isAdminPage()) {
      applyAdminShell()
    } else {
      applyUnifiedShell()
      applyUnifiedFooter()
    }
    bindFallbackInteractions()
    bindIconButtons()
    post('height', { height: syncBoundaryHeight() })
  })

  document.addEventListener('DOMContentLoaded', () => {
    normalizePageLayout()
    if (isAdminPage()) {
      applyAdminShell()
    } else {
      applyUnifiedFooter()
    }
    post('ready')
    observeHeight()
  })
})()
