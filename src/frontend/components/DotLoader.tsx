import React from "react";

export default function DotLoader({
  size = 8,
  color = "bg-blue-600",
}: {
  size?: number;
  color?: string;
}) {
  return (
    <div className="flex items-center justify-center gap-1">
      <span
        className={`rounded-full ${color}`}
        style={{
          width: size,
          height: size,
          animation: "bounce 1s infinite",
          animationDelay: "-0.3s",
        }}
      />
      <span
        className={`rounded-full ${color}`}
        style={{
          width: size,
          height: size,
          animation: "bounce 1s infinite",
          animationDelay: "-0.15s",
        }}
      />
      <span
        className={`rounded-full ${color}`}
        style={{
          width: size,
          height: size,
          animation: "bounce 1s infinite",
        }}
      />

      <style jsx>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}