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
    src: "/assets/random/drx.webp",
    alt: "2023 World Final DRX 3:2 T1",
    width: 1280,
    height: 721,
    label: "DRX",
    caption: "Deft lifting the trophy after 10 years"
  },
  {
    src: "/assets/random/blg.webp",
    alt: "2024 World Final BLG 2:3 T1",
    width: 1280,
    height: 854,
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
      <span className="research-image-stack">
        {photos.map((heroPhoto, index) => {
          const isActive = index === photoIndex;

          return (
            <Image
              key={heroPhoto.src}
              src={heroPhoto.src}
              alt={isActive ? heroPhoto.alt : ""}
              aria-hidden={!isActive}
              width={heroPhoto.width}
              height={heroPhoto.height}
              sizes="(max-width: 768px) 90vw, 365px"
              className={`research-photo${isActive ? " is-active" : ""}`}
              {...(index === 0 ? { priority: true } : { loading: "eager" as const })}
            />
          );
        })}
      </span>
      <span className="research-caption">{photo.caption}</span>
    </button>
  );
}
