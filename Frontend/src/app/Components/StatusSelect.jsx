// app/Components/Controls/StatusSelect.jsx
"use client";

import React, { useEffect, useRef, useState } from "react";


export default function StatusSelect({ value = "all", onChange = () => {}, className = "" }) {
  const options = [
    { value: "all", label: "All" },
    { value: "scheduled", label: "Scheduled" },
   
    { value: "ended", label: "Ended" },
  ];

  const ref = useRef(null);
  const [open, setOpen] = useState(false);
  const [focusIndex, setFocusIndex] = useState(-1);

  useEffect(() => {
    function onDoc(e) {
      if (!ref.current) return;
      if (!ref.current.contains(e.target)) {
        setOpen(false);
        setFocusIndex(-1);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    if (!open) { setFocusIndex(-1); return; }
    const idx = options.findIndex(o => o.value === value);
    setFocusIndex(idx === -1 ? 0 : idx);
  }, [open, value]);

  function onKeyDown(e) {
    if (!open) {
      if (["Enter"," ","ArrowDown"].includes(e.key)) { e.preventDefault(); setOpen(true); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIndex(i => Math.min(options.length-1, i+1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setFocusIndex(i => Math.max(0, i-1)); }
    else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const opt = options[focusIndex] || options[0];
      onChange(opt.value);
      setOpen(false);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const selectedLabel = options.find(o => o.value === value)?.label || "All";

  return (
    <div ref={ref} className={`custom-select ${open ? "open" : ""} ${className}`} style={{ display: "inline-block" }}>
      <div
        className="custom-select__button"
        role="button"
        tabIndex={0}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        onKeyDown={onKeyDown}
      >
        <span style={{ fontWeight: 600, color: "#fff" }}>{selectedLabel}</span>
        <span className="custom-select__chev" aria-hidden />
      </div>

      {open && (
        <div className="custom-select__list" role="listbox" onKeyDown={onKeyDown}>
          {options.map((opt, i) => {
            const isSelected = opt.value === value;
            const isFocused = i === focusIndex;
            return (
              <div
                id={`status-opt-${i}`}
                key={opt.value}
                role="option"
                data-selected={isSelected ? "true" : "false"}
                data-focus={isFocused ? "true" : "false"}
                className="custom-select__option"
                onMouseEnter={() => setFocusIndex(i)}
                onMouseLeave={() => setFocusIndex(-1)}
                onClick={() => { onChange(opt.value); setOpen(false); }}
              >
                <span style={{ flex: 1 }}>{opt.label}</span>
                {isSelected && <span style={{ color: "#FCCC22", fontWeight: 700 }}></span>}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
