import { ImageResponse } from "next/og";
export const alt = "Perpetual Labs — Ideas in motion";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background: "#e3ebd5",
        color: "#20271f",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        padding: 75,
        justifyContent: "space-between",
      }}
    >
      <div style={{ fontSize: 30, display: "flex" }}>perpetual labs</div>
      <div
        style={{
          fontSize: 92,
          letterSpacing: -5,
          lineHeight: 1.05,
          display: "flex",
        }}
      >
        Big ideas.
        <br />
        Built to go further.
      </div>
      <div style={{ fontSize: 18, letterSpacing: 4, display: "flex" }}>
        THOUGHTFUL DESIGN. PURPOSEFUL ENGINEERING.
      </div>
    </div>,
    size,
  );
}
