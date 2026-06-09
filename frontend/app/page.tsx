import PinFeed from "@/components/PinFeed";

export default function Home() {
  return (
    <div className="py-4">
      <PinFeed queryKey={["feed"]} endpoint="/api/pins/feed" />
    </div>
  );
}
