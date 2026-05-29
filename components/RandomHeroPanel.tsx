"use client";

import Image from "next/image";
import { useState } from "react";

type HeroPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
};

type RandomHeroPanelProps = {
  tagline: string;
};

const photos: HeroPhoto[] = [
  {
    src: "/assets/random/blg.png",
    alt: "Hand-drawn esports team lifting a championship trophy",
    width: 1535,
    height: 1024,
    label: "BLG"
  },
  {
    src: "/assets/random/drx.png",
    alt: "Hand-drawn esports player holding a championship trophy",
    width: 1672,
    height: 941,
    label: "DRX"
  }
];

export function RandomHeroPanel({ tagline }: RandomHeroPanelProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex];

  const showNextPhoto = () => {
    setPhotoIndex((currentIndex) => (currentIndex + 1) % photos.length);
  };

  return (
    <button
      className="research-asset"
      type="button"
      onClick={showNextPhoto}
      aria-label={`Show next hero panel photo. Current photo: ${photo.label}`}
    >
      <svg
        className="sketch-card-border"
        viewBox="0 0 360 450"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M13 7 C54 3 112 8 166 5 C226 2 281 6 346 5 C353 7 357 14 355 24 C353 86 358 139 354 198 C352 256 357 315 354 379 C354 410 354 431 347 443 C288 447 238 441 181 444 C119 447 62 443 14 445 C7 438 6 411 8 382 C10 315 5 261 7 198 C9 136 5 78 8 21 C8 14 9 10 13 7 Z" />
      </svg>
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes="(max-width: 768px) 90vw, 365px"
        priority
      />
      <span className="research-caption">{tagline}</span>
    </button>
  );
}
