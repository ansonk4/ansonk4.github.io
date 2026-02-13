"use client";

import { useState, useRef, useCallback, useEffect } from "react";

/**
 * SplitPane — a resizable split container.
 *
 * Props:
 *  - direction: "horizontal" (left | right) or "vertical" (top | bottom)
 *  - defaultSplit: initial % for the first child (0-100)
 *  - minSize: minimum % for either child (default 5)
 *  - children: exactly 2 React nodes
 *  - style: optional extra styles on the container
 */
export default function SplitPane({
    direction = "horizontal",
    defaultSplit = 50,
    minSize = 5,
    children,
    style,
}) {
    const [split, setSplit] = useState(defaultSplit);
    const containerRef = useRef(null);
    const dragging = useRef(false);

    const isHorizontal = direction === "horizontal";

    const onMouseDown = useCallback(
        (e) => {
            e.preventDefault();
            dragging.current = true;
            document.body.style.cursor = isHorizontal ? "col-resize" : "row-resize";
            document.body.style.userSelect = "none";
        },
        [isHorizontal]
    );

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            let pct;
            if (isHorizontal) {
                pct = ((e.clientX - rect.left) / rect.width) * 100;
            } else {
                pct = ((e.clientY - rect.top) / rect.height) * 100;
            }
            pct = Math.max(minSize, Math.min(100 - minSize, pct));
            setSplit(pct);
        };

        const onMouseUp = () => {
            if (dragging.current) {
                dragging.current = false;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            }
        };

        // Touch support
        const onTouchMove = (e) => {
            if (!dragging.current || !containerRef.current) return;
            const touch = e.touches[0];
            const rect = containerRef.current.getBoundingClientRect();
            let pct;
            if (isHorizontal) {
                pct = ((touch.clientX - rect.left) / rect.width) * 100;
            } else {
                pct = ((touch.clientY - rect.top) / rect.height) * 100;
            }
            pct = Math.max(minSize, Math.min(100 - minSize, pct));
            setSplit(pct);
        };

        const onTouchEnd = () => {
            if (dragging.current) {
                dragging.current = false;
                document.body.style.cursor = "";
                document.body.style.userSelect = "";
            }
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);
        window.addEventListener("touchmove", onTouchMove, { passive: false });
        window.addEventListener("touchend", onTouchEnd);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
            window.removeEventListener("touchmove", onTouchMove);
            window.removeEventListener("touchend", onTouchEnd);
        };
    }, [isHorizontal, minSize]);

    const containerStyle = {
        display: "flex",
        flexDirection: isHorizontal ? "row" : "column",
        width: "100%",
        height: "100%",
        ...style,
    };

    const firstStyle = isHorizontal
        ? { width: `${split}%`, height: "100%" }
        : { height: `${split}%`, width: "100%" };

    const secondStyle = isHorizontal
        ? { width: `${100 - split}%`, height: "100%" }
        : { height: `${100 - split}%`, width: "100%" };

    const dividerStyle = {
        flexShrink: 0,
        background: "#000",
        zIndex: 10,
        ...(isHorizontal
            ? {
                width: "2px",
                cursor: "col-resize",
                height: "100%",
            }
            : {
                height: "2px",
                cursor: "row-resize",
                width: "100%",
            }),
    };

    // Invisible hit area for easier grabbing
    const hitAreaStyle = {
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

    const childArray = Array.isArray(children) ? children : [children];

    return (
        <div ref={containerRef} style={containerStyle}>
            <div className="split-child" style={firstStyle}>
                {childArray[0]}
            </div>

            <div
                style={{ ...dividerStyle, position: "relative" }}
                onMouseDown={onMouseDown}
                onTouchStart={onMouseDown}
            >
                <div style={hitAreaStyle} />
            </div>

            <div className="split-child" style={secondStyle}>
                {childArray[1]}
            </div>
        </div>
    );
}
