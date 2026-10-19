import { PublishingGuide, guideMetadata } from "@/components/publishing-guide";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props) {
  return guideMetadata(`/docs/${(await params).slug}`);
}

export default async function Guide({ params }: Props) {
  return <PublishingGuide path={`/docs/${(await params).slug}`} />;
}
