"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type Achievement = {
  date: string;
  text: string;
};

type HallShowcaseProps = {
  name: string;
  achievements: Achievement[];
};

const SLOT_LEFTS = ["27%", "50%", "73%"] as const;

export default function HallShowcase({
  name,
  achievements,
}: HallShowcaseProps) {
  const [page, setPage] = useState(0);
  const pageCount = Math.max(1, Math.ceil(achievements.length / 3));

  const visible = useMemo(() => {
    const start = page * 3;
    return achievements.slice(start, start + 3);
  }, [achievements, page]);

  return (
    <main
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        color: "#fef3d8",
        fontFamily: "Georgia, serif",
      }}
    >
      <Image
        src="/hall-of-fame.png"
        alt={`${name} hall of fame`}
        fill
        priority
        style={{ objectFit: "cover", objectPosition: "center" }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.28) 0%, rgba(0,0,0,0.06) 25%, rgba(0,0,0,0.34) 100%)",
        }}
      />

      <Link
        href="/"
        style={{
          position: "absolute",
          top: "22px",
          left: "20px",
          color: "#ffe1a2",
          textDecoration: "none",
          background: "rgba(14, 9, 3, 0.64)",
          border: "1px solid rgba(255, 214, 148, 0.45)",
          borderRadius: "999px",
          padding: "8px 14px",
          zIndex: 4,
        }}
      >
        ← Back to stage
      </Link>

      <div
        style={{
          position: "absolute",
          top: "22px",
          right: "20px",
          zIndex: 4,
          color: "#ffe1a2",
          background: "rgba(14, 9, 3, 0.64)",
          border: "1px solid rgba(255, 214, 148, 0.45)",
          borderRadius: "999px",
          padding: "8px 14px",
          fontSize: "14px",
        }}
      >
        {name} • Page {page + 1}/{pageCount}
      </div>

      <button
        aria-label="Previous achievements"
        onClick={() => setPage((p) => Math.max(0, p - 1))}
        disabled={page === 0}
        style={{
          position: "absolute",
          left: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          width: "48px",
          height: "48px",
          borderRadius: "999px",
          border: "1px solid rgba(255, 214, 148, 0.55)",
          background: page === 0 ? "rgba(0,0,0,0.3)" : "rgba(18, 11, 3, 0.75)",
          color: page === 0 ? "rgba(255, 214, 148, 0.45)" : "#ffe1a2",
          fontSize: "28px",
          cursor: page === 0 ? "not-allowed" : "pointer",
        }}
      >
        ‹
      </button>

      <button
        aria-label="Next achievements"
        onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
        disabled={page >= pageCount - 1}
        style={{
          position: "absolute",
          right: "14px",
          top: "50%",
          transform: "translateY(-50%)",
          zIndex: 5,
          width: "48px",
          height: "48px",
          borderRadius: "999px",
          border: "1px solid rgba(255, 214, 148, 0.55)",
          background: page >= pageCount - 1 ? "rgba(0,0,0,0.3)" : "rgba(18, 11, 3, 0.75)",
          color: page >= pageCount - 1 ? "rgba(255, 214, 148, 0.45)" : "#ffe1a2",
          fontSize: "28px",
          cursor: page >= pageCount - 1 ? "not-allowed" : "pointer",
        }}
      >
        ›
      </button>

      <div
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 4,
          pointerEvents: "none",
        }}
      >
        {SLOT_LEFTS.map((left, i) => {
          const achievement = visible[i];
          if (!achievement) return null;

          return (
            <div key={`${page}-${i}`}>
              <article
                style={{
                  position: "absolute",
                  left,
                  top: "83.5%",
                  transform: "translateX(-50%)",
                  width: "min(23vw, 300px)",
                  textAlign: "center",
                  color: "#ffeac1",
                  textShadow: "0 2px 12px rgba(0,0,0,0.9)",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontWeight: 700,
                    letterSpacing: "0.03em",
                    fontSize: "clamp(13px, 1.2vw, 18px)",
                  }}
                >
                  {achievement.date}
                </p>
                <p
                  style={{
                    margin: "3px 0 0",
                    padding: 0,
                    minHeight: "clamp(44px, 5.6vw, 72px)",
                    fontSize: "clamp(12px, 1.1vw, 17px)",
                    lineHeight: 1.2,
                    color: "#ffe9bf",
                    fontFamily: "inherit",
                  }}
                >
                  {achievement.text}
                </p>
              </article>
            </div>
          );
        })}
      </div>
    </main>
  );
}
