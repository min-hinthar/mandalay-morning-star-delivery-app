export const dynamic = "force-dynamic";

export default function TestDynamicPage() {
  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Dynamic Test Page</h1>
      <p>Rendered at: {new Date().toISOString()}</p>
      <p>If you see this, SSR works through the root layout.</p>
    </div>
  );
}
