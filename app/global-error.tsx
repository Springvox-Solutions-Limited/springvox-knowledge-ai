"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ margin: 0, background: "#0a0c0b", color: "#f3f5f4", fontFamily: "Inter, sans-serif" }}>
        <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", padding: 24 }}>
          <div style={{ maxWidth: 440, border: "1px solid #242a26", borderRadius: 12, padding: 24, background: "#141816" }}>
            <p style={{ margin: 0, fontSize: 12, color: "#7b847e" }}>Rekall-IQ could not start</p>
            <h1 style={{ margin: "8px 0 0", fontSize: 24, fontWeight: 500 }}>Please reload the app.</h1>
            <p style={{ margin: "8px 0 0", fontSize: 13, lineHeight: 1.6, color: "#b2bab5" }}>
              The application hit an unexpected error. Your data is unchanged.
            </p>
            <button
              type="button"
              onClick={() => reset()}
              style={{ marginTop: 16, height: 36, border: 0, borderRadius: 8, padding: "0 12px", background: "#14b8a6", color: "#04100e", fontWeight: 500, cursor: "pointer" }}
            >
              Reload
            </button>
            {error.digest ? <p style={{ marginTop: 16, fontSize: 11, color: "#7b847e" }}>Reference: {error.digest}</p> : null}
          </div>
        </main>
      </body>
    </html>
  );
}
