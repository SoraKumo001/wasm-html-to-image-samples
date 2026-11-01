import React, { useState } from "react";

interface ZoomControlProps {
  label?: string;
  zoom: number;
  onChangeZoom: (zoom: number) => void;
  min?: number;
  max?: number;
}

export const ZoomControl: React.FC<ZoomControlProps> = ({
  label,
  zoom,
  onChangeZoom,
  min = 25,
  max = 400,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputVal, setInputVal] = useState(String(zoom));

  const clamp = (val: number) => Math.max(min, Math.min(max, Math.round(val)));

  const handleStep = (delta: number, e: React.MouseEvent) => {
    e.preventDefault();
    const step = e.shiftKey ? 1 : 5;
    onChangeZoom(clamp(zoom + delta * step));
  };

  const handleCommit = () => {
    setIsEditing(false);
    const parsed = Number(inputVal.replace(/[^0-9.]/g, ""));
    if (Number.isFinite(parsed) && parsed > 0) {
      onChangeZoom(clamp(parsed));
    } else {
      setInputVal(String(zoom));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleCommit();
    } else if (e.key === "Escape") {
      setIsEditing(false);
      setInputVal(String(zoom));
    }
  };

  return (
    <div className="flex items-center gap-1 text-[11px]">
      {label && <span className="text-slate-400 font-medium select-none">{label}:</span>}
      <div className="flex items-center bg-slate-900/90 border border-slate-700 rounded overflow-hidden shadow-inner">
        {/* Zoom Out (-) */}
        <button
          type="button"
          title="Zoom out (-5%, Shift: -1%)"
          onClick={(e) => handleStep(-1, e)}
          disabled={zoom <= min}
          className="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors select-none font-bold"
        >
          -
        </button>

        {/* Current zoom or input */}
        {isEditing ? (
          <input
            type="text"
            value={inputVal}
            autoFocus
            onChange={(e) => setInputVal(e.target.value)}
            onBlur={handleCommit}
            onKeyDown={handleKeyDown}
            className="w-11 text-center bg-slate-950 text-white font-mono text-[11px] px-0.5 py-0.5 outline-none border-x border-indigo-500"
          />
        ) : (
          <button
            type="button"
            title="Click to type, double-click or Reset to 100%"
            onClick={() => {
              setInputVal(String(zoom));
              setIsEditing(true);
            }}
            className={`w-12 text-center font-mono py-0.5 px-0.5 text-[11px] select-none hover:bg-slate-800 transition-colors cursor-text ${
              zoom !== 100 ? "text-indigo-300 font-semibold" : "text-slate-300"
            }`}
          >
            {zoom}%
          </button>
        )}

        {/* Zoom In (+) */}
        <button
          type="button"
          title="Zoom in (+5%, Shift: +1%)"
          onClick={(e) => handleStep(1, e)}
          disabled={zoom >= max}
          className="px-1.5 py-0.5 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed transition-colors select-none font-bold"
        >
          +
        </button>
      </div>

      {/* Reset button when not 100% */}
      {zoom !== 100 && (
        <button
          type="button"
          title="Reset to 100%"
          onClick={() => onChangeZoom(100)}
          className="text-[10px] px-1 py-0.5 text-indigo-400 hover:text-indigo-200 hover:underline cursor-pointer transition-colors"
        >
          100%
        </button>
      )}
    </div>
  );
};
