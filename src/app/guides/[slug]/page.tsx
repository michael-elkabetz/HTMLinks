import { PublishingGuide, guideMetadata } from "@/components/publishing-guide";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return guideMetadata(`/guides/${(await params).slug}`);
}

export default async function Guide({ params }: Props) {
  return <PublishingGuide path={`/guides/${(await params).slug}`} />;
}
