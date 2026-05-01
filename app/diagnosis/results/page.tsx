import { DiagnosisResultsScreen } from '@/components/diagnosis-results-screen'

export default async function DiagnosisResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}) {
  const resolved = await searchParams
  const userId = typeof resolved.userId === 'string' ? resolved.userId : undefined
  const returnTo = typeof resolved.returnTo === 'string' ? resolved.returnTo : undefined
  return <DiagnosisResultsScreen userId={userId} returnTo={returnTo} />
}
