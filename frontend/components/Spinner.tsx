export default function Spinner({ size = 32 }: { size?: number }) {
  return (
    <div
      className="animate-spin rounded-full border-[3px] border-pingray-300 border-t-pinred"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Loading"
    />
  );
}
