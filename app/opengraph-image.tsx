import { ImageResponse } from "next/og";

export const alt =
  "Rekall-IQ — Every answer comes with its source. Cited answers from approved company documents.";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0c0b",
          color: "#f3f5f4",
          padding: "64px 72px 56px",
          fontFamily: "Inter, sans-serif",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            backgroundImage:
              "linear-gradient(to right, rgba(36,42,38,0.55) 1px, transparent 1px), linear-gradient(to bottom, rgba(36,42,38,0.55) 1px, transparent 1px)",
            backgroundSize: "64px 64px",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: -160,
            top: -180,
            width: 620,
            height: 620,
            borderRadius: "50%",
            border: "1px solid #242a26",
            display: "flex",
          }}
        />
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
          }}
        >
          <div style={{ display: "flex", alignItems: "center" }}>
            <span style={{ fontSize: 26, fontWeight: 600, letterSpacing: "-0.02em" }}>
              Rekall<span style={{ color: "#14b8a6" }}>-IQ</span>
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              border: "1px solid #242a26",
              borderRadius: 999,
              padding: "7px 14px",
              color: "#b2bab5",
              fontSize: 14,
            }}
          >
            <span
              style={{
                display: "flex",
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: "#14b8a6",
              }}
            />
            Approved documents only
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 68,
              lineHeight: 1.02,
              letterSpacing: "-3.2px",
              fontWeight: 500,
              maxWidth: 840,
            }}
          >
            <span>Every answer</span>
            <span>comes with</span>
            <span>
              its source<span style={{ color: "#14b8a6" }}>.</span>
            </span>
          </div>
          <div
            style={{
              display: "flex",
              marginTop: 24,
              fontSize: 20,
              lineHeight: 1.5,
              color: "#b2bab5",
              maxWidth: 720,
            }}
          >
            Cited answers from the documents your company has approved. A reply that
            uses a document names the file and opens the cited page.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "relative",
            borderTop: "1px solid #242a26",
            paddingTop: 22,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            {["6 formats", "Workspace-isolated", "Sources attached"].map((label) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  border: "1px solid #242a26",
                  background: "#141816",
                  borderRadius: 8,
                  padding: "8px 12px",
                  fontSize: 13,
                  color: "#b2bab5",
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <div style={{ display: "flex", fontSize: 13, color: "#7b847e" }}>
            rekalliq.springvoxsl.com
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
