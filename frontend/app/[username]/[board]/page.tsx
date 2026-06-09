import BoardView from "@/components/BoardView";

export default async function BoardPage({
  params,
}: {
  params: Promise<{ username: string; board: string }>;
}) {
  const { username, board } = await params;
  return <BoardView username={username} slug={board} />;
}
