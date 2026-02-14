"use client";

import { Children, isValidElement, type CSSProperties, type ReactNode, useCallback, useEffect, useRef, useState } from "react";

type SplitDirection = "horizontal" | "vertical";

interface SplitPaneProps {
  direction?: SplitDirection;
  defaultSplit?: number;
  minSize?: number;
  children: ReactNode;
  style?: CSSProperties;
}

export default function SplitPane({
  direction = "horizontal",
  defaultSplit = 50,
  minSize = 5,
  children,
  style,
}: SplitPaneProps) {
  const [split, setSplit] = useState(defaultSplit);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const draggingRef = useRef(false);

  const isHorizontal = direction === "horizontal";

  const startDrag = useCallback(() => {
    draggingRef.current = true;
    document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
    document.body.style.userSelect = "none";
  }, [isHorizontal]);

  const stopDrag = useCallback(() => {
    if (!draggingRef.current) {
      return;
    }

    draggingRef.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, []);

  useEffect(() => {
    const onMouseMove = (event: MouseEvent) => {
      if (!draggingRef.current || !containerRef.current) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const pct = isHorizontal
        ? ((event.clientX - rect.left) / rect.width) * 100
        : ((event.clientY - rect.top) / rect.height) * 100;

      setSplit(Math.max(minSize, Math.min(100 - minSize, pct)));
    };

    const onTouchMove = (event: TouchEvent) => {
      if (!draggingRef.current || !containerRef.current) {
        return;
      }

      event.preventDefault();
      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const pct = isHorizontal
        ? ((touch.clientX - rect.left) / rect.width) * 100
        : ((touch.clientY - rect.top) / rect.height) * 100;

      setSplit(Math.max(minSize, Math.min(100 - minSize, pct)));
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", stopDrag);
    window.addEventListener("touchcancel", stopDrag);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", stopDrag);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", stopDrag);
      window.removeEventListener("touchcancel", stopDrag);
    };
  }, [isHorizontal, minSize, stopDrag]);

  const containerStyle: CSSProperties = {
    display: "flex",
    flexDirection: isHorizontal ? "row" : "column",
    width: "100%",
    height: "100%",
    ...style,
  };

  const firstStyle: CSSProperties = isHorizontal
    ? { width: `${split}%`, height: "100%" }
    : { height: `${split}%`, width: "100%" };

  const secondStyle: CSSProperties = isHorizontal
    ? { width: `${100 - split}%`, height: "100%" }
    : { height: `${100 - split}%`, width: "100%" };

  const dividerStyle: CSSProperties = {
    flexShrink: 0,
    background: "#000",
    zIndex: 10,
    ...(isHorizontal
      ? {
          width: "1px",
          cursor: "col-resize",
          height: "100%",
        }
      : {
          height: "1px",
          cursor: "row-resize",
          width: "100%",
        }),
  };

  const hitAreaStyle: CSSProperties = {
    position: "absolute",
    zIndex: 11,
    ...(isHorizontal
      ? {
          width: "12px",
          height: "100%",
          left: "-5px",
          top: 0,
          cursor: "col-resize",
        }
      : {
          height: "12px",
          width: "100%",
          top: "-5px",
          left: 0,
          cursor: "row-resize",
        }),
  };

  const childArray = Children.toArray(children);
  const firstChild = childArray[0];
  const secondChild = childArray[1];
  const firstIsLeaf = !(isValidElement(firstChild) && firstChild.type === SplitPane);
  const secondIsLeaf = !(isValidElement(secondChild) && secondChild.type === SplitPane);

  return (
    <div ref={containerRef} style={containerStyle}>
      <div className={`split-child ${firstIsLeaf ? "split-leaf-child" : ""}`} data-split-child style={firstStyle}>
        {firstChild}
      </div>

      <div
        className="relative"
        data-split-divider
        style={dividerStyle}
        onMouseDown={(event) => {
          event.preventDefault();
          startDrag();
        }}
        onTouchStart={(event) => {
          event.preventDefault();
          startDrag();
        }}
      >
        <div style={hitAreaStyle} />
      </div>

      <div className={`split-child ${secondIsLeaf ? "split-leaf-child" : ""}`} data-split-child style={secondStyle}>
        {secondChild}
      </div>
    </div>
  );
}
