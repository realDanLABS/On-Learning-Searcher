const allowedModes = ['legacy-api', 'supabase'] as const

export type DataMode = (typeof allowedModes)[number]

export function getDataMode(): DataMode {
  const raw = process.env.NEXT_PUBLIC_ON_LEARNING_DATA_MODE
  if (raw === 'supabase') return 'supabase'
  return 'legacy-api'
}

export function isSupabaseMode() {
  return getDataMode() === 'supabase'
}

export function assertKnownDataMode(value: string): value is DataMode {
  return (allowedModes as readonly string[]).includes(value)
}
