"use client";

import { useState } from "react";

const ASSET_BASE = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

export default function CurtainOverlay({
  onOpen,
}: {
  onOpen: () => void;
}) {
  const [open, setOpen] = useState(false);
  const leftPanelTransition = "transform 1.35s cubic-bezier(0.2, 0.85, 0.16, 1)";
  const rightPanelTransition = "transform 1.45s cubic-bezier(0.18, 0.82, 0.18, 1)";
  const curtainImage = `${ASSET_BASE}/story.png`;

  const handleClick = () => {
    if (open) return;
    setOpen(true);
    setTimeout(onOpen, 1200);
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 1000,
        overflow: "hidden",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(circle at center, rgba(0,0,0,0.18) 0%, rgba(0,0,0,0.62) 100%)",
          opacity: open ? 0.4 : 1,
          transition: "opacity 1.2s ease",
        }}
      />

      {/* Левая штора */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "calc(50vw + 2px)",
          height: "100vh",
          backgroundColor: "#5d0408",
          backgroundImage: `url('${curtainImage}')`,
          backgroundSize: "200% 106%",
          backgroundPosition: "left top",
          backgroundRepeat: "no-repeat",
          boxShadow: "inset -18px 0 28px rgba(0,0,0,0.42)",
          transformOrigin: "left center",
          transform: open
            ? "translateX(-106%) rotate(-2deg) scaleX(0.95) translateY(-0.6%)"
            : "translateX(0) rotate(0deg) scaleX(1)",
          transition: leftPanelTransition,
          filter: open ? "brightness(0.9) saturate(1.05)" : "brightness(1) saturate(1)",
        }}
      />

      {/* Правая штора */}
      <div
        style={{
          position: "absolute",
          top: 0,
          right: 0,
          width: "calc(50vw + 2px)",
          height: "100vh",
          backgroundColor: "#5d0408",
          backgroundImage: `url('${curtainImage}')`,
          backgroundSize: "200% 106%",
          backgroundPosition: "right top",
          backgroundRepeat: "no-repeat",
          boxShadow: "inset 18px 0 28px rgba(0,0,0,0.42)",
          transformOrigin: "right center",
          transform: open
            ? "translateX(106%) rotate(2deg) scaleX(0.95) translateY(-0.6%)"
            : "translateX(0) rotate(0deg) scaleX(1)",
          transition: rightPanelTransition,
          filter: open ? "brightness(0.9) saturate(1.05)" : "brightness(1) saturate(1)",
        }}
      />


      <div
        style={{
          position: "absolute",
          top: "36%",
          left: "calc(50% - 56px)",
          width: "42px",
          height: "10px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #e2b86d 0%, #a57630 100%)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
          zIndex: 3,
          transform: open ? "translateX(-74px) rotate(-8deg)" : "translateX(0) rotate(0deg)",
          transition: leftPanelTransition,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "36%",
          right: "calc(50% - 56px)",
          width: "42px",
          height: "10px",
          borderRadius: "999px",
          background: "linear-gradient(180deg, #e2b86d 0%, #a57630 100%)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.45)",
          zIndex: 3,
          transform: open ? "translateX(74px) rotate(8deg)" : "translateX(0) rotate(0deg)",
          transition: rightPanelTransition,
        }}
      />

      {!open && (
        <div
          style={{
            position: "absolute",
            width: "100%",
            top: "44%",
            textAlign: "center",
            padding: "0 20px",
            color: "#ffd79a",
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: "clamp(30px, 5vw, 62px)",
              fontFamily: "Georgia, serif",
              textShadow: "0 6px 22px rgba(0,0,0,0.55)",
            }}
          >
            Театр достижений
          </p>
          <p
            style={{
              margin: "14px 0 0",
              fontSize: "clamp(14px, 1.8vw, 22px)",
              color: "#ffe6be",
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              fontFamily: "Georgia, serif",
            }}
          >
            Нажмите на занавес, чтобы открыть сцену
          </p>
        </div>
      )}
    </div>
  );
}
