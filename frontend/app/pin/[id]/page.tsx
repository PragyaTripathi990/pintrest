import PinDetail from "@/components/PinDetail";

export default async function PinPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PinDetail pinId={Number(id)} />;
}
