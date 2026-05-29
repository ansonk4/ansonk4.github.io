"use client";

import { useState } from "react";
import Image from "next/image";

type PortraitToggleProps = {
  name: string;
};

const portraitSrc = "/assets/portrait.webp";
const alternatePortraitSrc = "/assets/me.webp";

export function PortraitToggle({ name }: PortraitToggleProps) {
  const [showAlternate, setShowAlternate] = useState(false);

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
        src={portraitSrc}
        alt={showAlternate ? "" : `Portrait of ${name}`}
        aria-hidden={showAlternate}
        fill
        sizes="(max-width: 768px) 70vw, 290px"
        priority
        className="portrait-image portrait-image-default"
      />
      <Image
        src={alternatePortraitSrc}
        alt={showAlternate ? `Portrait of ${name}` : ""}
        aria-hidden={!showAlternate}
        fill
        sizes="(max-width: 768px) 70vw, 290px"
        loading="eager"
        className="portrait-image portrait-image-alternate"
      />
    </button>
  );
}
