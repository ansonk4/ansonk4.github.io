"use client";

import { type CSSProperties, type RefObject, useEffect, useState } from "react";

const DRAW_SPEED_PX_PER_SECOND = 1600;
const EPSILON = 0.75;

type VerticalSegment = {
  id: string;
  orientation: "vertical";
  x: number;
  y1: number;
  y2: number;
};

type HorizontalSegment = {
  id: string;
  orientation: "horizontal";
  y: number;
  x1: number;
  x2: number;
};

type GrowthPart = {
  id: string;
  orientation: "vertical" | "horizontal";
  left: number;
  top: number;
  length: number;
  delay: number;
  duration: number;
  transformOrigin: "top" | "left" | "right";
};

type Intersection = {
  verticalId: string;
  horizontalId: string;
  x: number;
  y: number;
};

interface SplitLineTreeOverlayProps {
  containerRef: RefObject<HTMLElement | null>;
  onDone?: () => void;
}

interface GrowthPlan {
  parts: GrowthPart[];
  totalDuration: number;
}

interface SplitChildBounds {
  element: HTMLElement;
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface VerticalActivation {
  time: number;
  startY: number;
}

interface HorizontalActivation {
  time: number;
  originX: number;
}

type QueueEvent =
  | {
      kind: "vertical";
      id: string;
      time: number;
      value: number;
    }
  | {
      kind: "horizontal";
      id: string;
      time: number;
      value: number;
    };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function withinRange(value: number, min: number, max: number) {
  return value >= min - EPSILON && value <= max + EPSILON;
}

function collectSegments(container: HTMLElement) {
  const rootRect = container.getBoundingClientRect();
  const offsetLeft = rootRect.left + container.clientLeft;
  const offsetTop = rootRect.top + container.clientTop;

  const dividerElements = Array.from(container.querySelectorAll<HTMLElement>("[data-split-divider]"));
  const verticalSegments: VerticalSegment[] = [];
  const horizontalSegments: HorizontalSegment[] = [];

  dividerElements.forEach((divider, index) => {
    const rect = divider.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) {
      return;
    }

    const left = rect.left - offsetLeft;
    const right = rect.right - offsetLeft;
    const top = rect.top - offsetTop;
    const bottom = rect.bottom - offsetTop;

    if (rect.height >= rect.width) {
      verticalSegments.push({
        id: `v-${index}`,
        orientation: "vertical",
        x: left + rect.width / 2,
        y1: top,
        y2: bottom,
      });
    } else {
      horizontalSegments.push({
        id: `h-${index}`,
        orientation: "horizontal",
        y: top + rect.height / 2,
        x1: left,
        x2: right,
      });
    }
  });

  return { verticalSegments, horizontalSegments };
}

function buildGrowthPlan(verticalSegments: VerticalSegment[], horizontalSegments: HorizontalSegment[]): GrowthPlan {
  if (verticalSegments.length === 0 && horizontalSegments.length === 0) {
    return { parts: [], totalDuration: 0 };
  }

  const intersectionsByVertical = new Map<string, Intersection[]>();
  const intersectionsByHorizontal = new Map<string, Intersection[]>();

  for (const vertical of verticalSegments) {
    intersectionsByVertical.set(vertical.id, []);
  }

  for (const horizontal of horizontalSegments) {
    intersectionsByHorizontal.set(horizontal.id, []);
  }

  for (const vertical of verticalSegments) {
    for (const horizontal of horizontalSegments) {
      if (!withinRange(vertical.x, horizontal.x1, horizontal.x2)) {
        continue;
      }

      if (!withinRange(horizontal.y, vertical.y1, vertical.y2)) {
        continue;
      }

      const intersection = {
        verticalId: vertical.id,
        horizontalId: horizontal.id,
        x: vertical.x,
        y: horizontal.y,
      };

      intersectionsByVertical.get(vertical.id)?.push(intersection);
      intersectionsByHorizontal.get(horizontal.id)?.push(intersection);
    }
  }

  for (const value of intersectionsByVertical.values()) {
    value.sort((a, b) => a.y - b.y);
  }

  for (const value of intersectionsByHorizontal.values()) {
    value.sort((a, b) => a.x - b.x);
  }

  const verticalById = new Map(verticalSegments.map((segment) => [segment.id, segment]));
  const horizontalById = new Map(horizontalSegments.map((segment) => [segment.id, segment]));

  const verticalActivation = new Map<string, VerticalActivation>();
  const horizontalActivation = new Map<string, HorizontalActivation>();
  const queue: QueueEvent[] = [];

  const pushEvent = (event: QueueEvent) => {
    queue.push(event);
  };

  const popNextEvent = () => {
    if (queue.length === 0) {
      return undefined;
    }

    let minIndex = 0;
    for (let index = 1; index < queue.length; index += 1) {
      if (queue[index].time < queue[minIndex].time) {
        minIndex = index;
      }
    }

    const [event] = queue.splice(minIndex, 1);
    return event;
  };

  const activateVertical = (id: string, startY: number, time: number) => {
    const segment = verticalById.get(id);
    if (!segment) {
      return;
    }

    const normalizedStartY = clamp(startY, segment.y1, segment.y2);
    const existing = verticalActivation.get(id);
    if (existing && time >= existing.time - 0.0001) {
      return;
    }

    verticalActivation.set(id, { time, startY: normalizedStartY });
    pushEvent({
      kind: "vertical",
      id,
      time,
      value: normalizedStartY,
    });
  };

  const activateHorizontal = (id: string, originX: number, time: number) => {
    const segment = horizontalById.get(id);
    if (!segment) {
      return;
    }

    const normalizedOriginX = clamp(originX, segment.x1, segment.x2);
    const existing = horizontalActivation.get(id);
    if (existing && time >= existing.time - 0.0001) {
      return;
    }

    horizontalActivation.set(id, { time, originX: normalizedOriginX });
    pushEvent({
      kind: "horizontal",
      id,
      time,
      value: normalizedOriginX,
    });
  };

  if (verticalSegments.length > 0) {
    const minY = Math.min(...verticalSegments.map((segment) => segment.y1));
    const topVerticalCandidates = verticalSegments.filter((segment) => Math.abs(segment.y1 - minY) <= EPSILON);
    const allX = [
      ...verticalSegments.map((segment) => segment.x),
      ...horizontalSegments.map((segment) => segment.x1),
      ...horizontalSegments.map((segment) => segment.x2),
    ];
    const centerX = allX.length > 0 ? (Math.min(...allX) + Math.max(...allX)) / 2 : 0;

    const firstVertical = topVerticalCandidates.reduce((best, current) =>
      Math.abs(current.x - centerX) < Math.abs(best.x - centerX) ? current : best
    );

    activateVertical(firstVertical.id, firstVertical.y1, 0);
  } else {
    const topHorizontal = horizontalSegments.reduce((best, current) => (current.y < best.y ? current : best));
    activateHorizontal(topHorizontal.id, (topHorizontal.x1 + topHorizontal.x2) / 2, 0);
  }

  while (queue.length > 0) {
    const event = popNextEvent();
    if (!event) {
      break;
    }

    if (event.kind === "vertical") {
      const activation = verticalActivation.get(event.id);
      if (
        !activation ||
        Math.abs(activation.time - event.time) > 0.0001 ||
        Math.abs(activation.startY - event.value) > EPSILON
      ) {
        continue;
      }

      const relatedIntersections = intersectionsByVertical.get(event.id) ?? [];
      for (const intersection of relatedIntersections) {
        if (intersection.y + EPSILON < activation.startY) {
          continue;
        }

        const travelDistance = Math.max(0, intersection.y - activation.startY);
        activateHorizontal(
          intersection.horizontalId,
          intersection.x,
          activation.time + travelDistance / DRAW_SPEED_PX_PER_SECOND
        );
      }
    } else {
      const activation = horizontalActivation.get(event.id);
      if (
        !activation ||
        Math.abs(activation.time - event.time) > 0.0001 ||
        Math.abs(activation.originX - event.value) > EPSILON
      ) {
        continue;
      }

      const relatedIntersections = intersectionsByHorizontal.get(event.id) ?? [];
      for (const intersection of relatedIntersections) {
        const travelDistance = Math.abs(intersection.x - activation.originX);
        activateVertical(
          intersection.verticalId,
          intersection.y,
          activation.time + travelDistance / DRAW_SPEED_PX_PER_SECOND
        );
      }
    }
  }

  const parts: GrowthPart[] = [];
  for (const vertical of verticalSegments) {
    const activation = verticalActivation.get(vertical.id);
    if (!activation) {
      continue;
    }

    const length = vertical.y2 - activation.startY;
    if (length <= EPSILON) {
      continue;
    }

    parts.push({
      id: `${vertical.id}-down`,
      orientation: vertical.orientation,
      left: vertical.x,
      top: activation.startY,
      length,
      delay: activation.time,
      duration: length / DRAW_SPEED_PX_PER_SECOND,
      transformOrigin: "top",
    });
  }

  for (const horizontal of horizontalSegments) {
    const activation = horizontalActivation.get(horizontal.id);
    if (!activation) {
      continue;
    }

    const leftLength = activation.originX - horizontal.x1;
    if (leftLength > EPSILON) {
      parts.push({
        id: `${horizontal.id}-left`,
        orientation: horizontal.orientation,
        left: horizontal.x1,
        top: horizontal.y,
        length: leftLength,
        delay: activation.time,
        duration: leftLength / DRAW_SPEED_PX_PER_SECOND,
        transformOrigin: "right",
      });
    }

    const rightLength = horizontal.x2 - activation.originX;
    if (rightLength > EPSILON) {
      parts.push({
        id: `${horizontal.id}-right`,
        orientation: horizontal.orientation,
        left: activation.originX,
        top: horizontal.y,
        length: rightLength,
        delay: activation.time,
        duration: rightLength / DRAW_SPEED_PX_PER_SECOND,
        transformOrigin: "left",
      });
    }
  }

  const reachableSegmentIds = new Set<string>([
    ...Array.from(verticalActivation.keys()),
    ...Array.from(horizontalActivation.keys()),
  ]);

  const longestReachableDuration = parts.reduce((maxDuration, part) => {
    return Math.max(maxDuration, part.delay + part.duration);
  }, 0);

  const fallbackStartDelay = longestReachableDuration + 0.05;

  for (const vertical of verticalSegments) {
    if (reachableSegmentIds.has(vertical.id)) {
      continue;
    }

    const length = vertical.y2 - vertical.y1;
    if (length <= EPSILON) {
      continue;
    }

    parts.push({
      id: `${vertical.id}-fallback`,
      orientation: vertical.orientation,
      left: vertical.x,
      top: vertical.y1,
      length,
      delay: fallbackStartDelay,
      duration: length / DRAW_SPEED_PX_PER_SECOND,
      transformOrigin: "top",
    });
  }

  for (const horizontal of horizontalSegments) {
    if (reachableSegmentIds.has(horizontal.id)) {
      continue;
    }

    const originX = (horizontal.x1 + horizontal.x2) / 2;
    const leftLength = originX - horizontal.x1;
    if (leftLength > EPSILON) {
      parts.push({
        id: `${horizontal.id}-fallback-left`,
        orientation: horizontal.orientation,
        left: horizontal.x1,
        top: horizontal.y,
        length: leftLength,
        delay: fallbackStartDelay,
        duration: leftLength / DRAW_SPEED_PX_PER_SECOND,
        transformOrigin: "right",
      });
    }

    const rightLength = horizontal.x2 - originX;
    if (rightLength > EPSILON) {
      parts.push({
        id: `${horizontal.id}-fallback-right`,
        orientation: horizontal.orientation,
        left: originX,
        top: horizontal.y,
        length: rightLength,
        delay: fallbackStartDelay,
        duration: rightLength / DRAW_SPEED_PX_PER_SECOND,
        transformOrigin: "left",
      });
    }
  }

  const totalDuration = parts.reduce((maxDuration, part) => {
    return Math.max(maxDuration, part.delay + part.duration);
  }, 0);

  return { parts, totalDuration };
}

function toStyle(part: GrowthPart): CSSProperties {
  const shared: CSSProperties = {
    left: `${part.left}px`,
    top: `${part.top}px`,
    animationDelay: `${part.delay}s`,
    animationDuration: `${Math.max(part.duration, 0.001)}s`,
    transformOrigin: part.transformOrigin,
  };

  if (part.orientation === "vertical") {
    return {
      ...shared,
      width: "1px",
      height: `${part.length}px`,
    };
  }

  return {
    ...shared,
    width: `${part.length}px`,
    height: "1px",
  };
}

function collectSplitLeafChildren(container: HTMLElement): SplitChildBounds[] {
  const rootRect = container.getBoundingClientRect();
  const offsetLeft = rootRect.left + container.clientLeft;
  const offsetTop = rootRect.top + container.clientTop;

  const splitChildren = Array.from(container.querySelectorAll<HTMLElement>("[data-split-child]"));
  return splitChildren
    .filter((element) => !element.querySelector("[data-split-divider]"))
    .map((element) => {
      const rect = element.getBoundingClientRect();
      return {
        element,
        left: rect.left - offsetLeft,
        right: rect.right - offsetLeft,
        top: rect.top - offsetTop,
        bottom: rect.bottom - offsetTop,
      };
    });
}

function getPartPointArrivalTime(part: GrowthPart, x: number, y: number) {
  if (part.orientation === "vertical") {
    if (Math.abs(x - part.left) > EPSILON) {
      return undefined;
    }

    const startY = part.top;
    const endY = part.top + part.length;
    if (!withinRange(y, startY, endY)) {
      return undefined;
    }

    return part.delay + (y - startY) / DRAW_SPEED_PX_PER_SECOND;
  }

  if (Math.abs(y - part.top) > EPSILON) {
    return undefined;
  }

  const startX = part.left;
  const endX = part.left + part.length;
  if (!withinRange(x, startX, endX)) {
    return undefined;
  }

  if (part.transformOrigin === "left") {
    return part.delay + (x - startX) / DRAW_SPEED_PX_PER_SECOND;
  }

  return part.delay + (endX - x) / DRAW_SPEED_PX_PER_SECOND;
}

function getContentRevealDelay(child: SplitChildBounds, parts: GrowthPart[]) {
  const xQuarter = child.left + (child.right - child.left) * 0.25;
  const xMid = (child.left + child.right) / 2;
  const xThreeQuarter = child.left + (child.right - child.left) * 0.75;
  const yQuarter = child.top + (child.bottom - child.top) * 0.25;
  const yMid = (child.top + child.bottom) / 2;
  const yThreeQuarter = child.top + (child.bottom - child.top) * 0.75;
  const edgePoints = [
    { x: child.left, y: yQuarter },
    { x: child.left, y: yMid },
    { x: child.left, y: yThreeQuarter },
    { x: child.right, y: yQuarter },
    { x: child.right, y: yMid },
    { x: child.right, y: yThreeQuarter },
    { x: xQuarter, y: child.top },
    { x: xMid, y: child.top },
    { x: xThreeQuarter, y: child.top },
    { x: xQuarter, y: child.bottom },
    { x: xMid, y: child.bottom },
    { x: xThreeQuarter, y: child.bottom },
  ];

  let earliest = Number.POSITIVE_INFINITY;
  for (const point of edgePoints) {
    for (const part of parts) {
      const arrivalTime = getPartPointArrivalTime(part, point.x, point.y);
      if (arrivalTime === undefined) {
        continue;
      }

      earliest = Math.min(earliest, arrivalTime);
    }
  }

  if (!Number.isFinite(earliest)) {
    return 0;
  }

  return Math.max(0, earliest + 0.04);
}

function applyContentRevealSchedule(container: HTMLElement, parts: GrowthPart[]) {
  const children = collectSplitLeafChildren(container);
  for (const child of children) {
    child.element.classList.add("split-content-reveal-target");
    child.element.style.setProperty("--split-content-delay", `${getContentRevealDelay(child, parts)}s`);
  }
}

function resetContentRevealSchedule(container: HTMLElement) {
  const children = Array.from(container.querySelectorAll<HTMLElement>(".split-content-reveal-target"));
  for (const child of children) {
    child.classList.remove("split-content-reveal-target");
    child.style.removeProperty("--split-content-delay");
  }
}

export default function SplitLineTreeOverlay({ containerRef, onDone }: SplitLineTreeOverlayProps) {
  const [parts, setParts] = useState<GrowthPart[]>([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      onDone?.();
      return;
    }

    let frameOne = 0;
    let frameTwo = 0;
    let doneTimeout: ReturnType<typeof setTimeout> | undefined;

    frameOne = window.requestAnimationFrame(() => {
      frameTwo = window.requestAnimationFrame(() => {
        const { verticalSegments, horizontalSegments } = collectSegments(container);
        const { parts: nextParts, totalDuration } = buildGrowthPlan(verticalSegments, horizontalSegments);

        if (nextParts.length === 0) {
          onDone?.();
          return;
        }

        applyContentRevealSchedule(container, nextParts);
        setParts(nextParts);

        doneTimeout = setTimeout(() => {
          onDone?.();
        }, Math.ceil((totalDuration + 0.08) * 1000));
      });
    });

    return () => {
      window.cancelAnimationFrame(frameOne);
      window.cancelAnimationFrame(frameTwo);
      if (doneTimeout) {
        clearTimeout(doneTimeout);
      }
      resetContentRevealSchedule(container);
    };
  }, [containerRef, onDone]);

  if (parts.length === 0) {
    return null;
  }

  return (
    <div className="split-line-tree-overlay" aria-hidden>
      {parts.map((part) => (
        <div
          key={part.id}
          className={`split-line-growth-segment ${
            part.orientation === "vertical" ? "split-line-growth-vertical" : "split-line-growth-horizontal"
          }`}
          style={toStyle(part)}
        />
      ))}
    </div>
  );
}
