"use client";

import { useState } from "react";
import Image from "next/image";

type PortraitToggleProps = {
  name: string;
};

const portraitSrc = "/assets/portrait.png";
const alternatePortraitSrc = "/assets/me.jpg";

export function PortraitToggle({ name }: PortraitToggleProps) {
  const [showAlternate, setShowAlternate] = useState(false);
  const src = showAlternate ? alternatePortraitSrc : portraitSrc;

  return (
    <button
      type="button"
      className="portrait-wrap"
      onClick={() => setShowAlternate((current) => !current)}
      aria-label={`Swap portrait image for ${name}`}
      aria-pressed={showAlternate}
      data-portrait={showAlternate ? "alternate" : "default"}
    >
      <Image
        src={src}
        alt={`Portrait of ${name}`}
        fill
        sizes="(max-width: 768px) 70vw, 290px"
        priority={!showAlternate}
        className="portrait-image"
      />
    </button>
  );
}
