"use client";
import { useState } from "react";
export function JournalShare() {
  const [message, setMessage] = useState("");
  return (
    <div className="journal-share">
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(window.location.href);
            setMessage("Link copied");
          } catch {
            setMessage(
              "Copy the address from your browser to share this entry.",
            );
          }
        }}
      >
        Copy article link ↗
      </button>
      <span role="status">{message}</span>
    </div>
  );
}
