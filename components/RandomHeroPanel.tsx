"use client";

import Image from "next/image";
import { useState } from "react";

type HeroPhoto = {
  src: string;
  alt: string;
  width: number;
  height: number;
  label: string;
  caption: string;
};

type RandomHeroPanelProps = {
  className?: string;
};

const photos: HeroPhoto[] = [
  {
    src: "/assets/random/drx.png",
    alt: "2023 World Final DRX 3:2 T1",
    width: 1672,
    height: 941,
    label: "DRX",
    caption: "Deft lifting the torphy after 10 years"
  },
  {
    src: "/assets/random/blg.png",
    alt: "2024 World Final BLG 2:3 T1",
    width: 1535,
    height: 1024,
    label: "BLG",
    caption: "BLG after losing to T1 in 2024 Worlds Final"
  }
];

export function RandomHeroPanel({ className }: RandomHeroPanelProps) {
  const [photoIndex, setPhotoIndex] = useState(0);
  const photo = photos[photoIndex];

  const showNextPhoto = () => {
    setPhotoIndex((currentIndex) => (currentIndex + 1) % photos.length);
  };

  return (
    <button
      className={["research-asset", className].filter(Boolean).join(" ")}
      type="button"
      onClick={showNextPhoto}
      aria-label={`Show next hero panel photo. Current photo: ${photo.label}`}
    >
      <span className="research-title">Random Moments</span>
      <Image
        src={photo.src}
        alt={photo.alt}
        width={photo.width}
        height={photo.height}
        sizes="(max-width: 768px) 90vw, 365px"
        priority
      />
      <span className="research-caption">{photo.caption}</span>
    </button>
  );
}
