export function maskEmployeeId(employeeId: string) {
  const raw = employeeId.trim()
  if (raw.length <= 3) return '*'.repeat(raw.length)
  return `${raw.slice(0, 1)}${'*'.repeat(raw.length - 3)}${raw.slice(-2)}`
}

export function sanitizeAuditDetail(detail: string) {
  return detail.replace(/\b[A-Za-z]?\d{4,}\b/g, (token) => maskEmployeeId(token))
}

