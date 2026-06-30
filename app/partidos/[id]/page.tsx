import MatchDetailPanel from '@/components/MatchDetailPanel';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function MatchDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <MatchDetailPanel matchId={id} />;
}
