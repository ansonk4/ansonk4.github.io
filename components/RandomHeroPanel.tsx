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

export function RandomHeroPanel() {
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
        <path d="M18 10 C66 3 121 10 175 7 C230 4 286 8 341 7 C352 10 356 22 354 38 C351 96 358 153 354 212 C350 279 357 348 351 430 C347 441 336 445 318 442 C255 438 198 447 139 443 C86 440 47 446 17 439 C8 421 10 381 8 332 C5 265 11 208 8 141 C5 77 8 31 18 10 Z" />
        <path
          className="sketch-card-border-echo"
          d="M15 14 C58 8 115 5 166 9 C223 13 276 4 345 11 C353 19 354 31 352 48 C356 116 350 174 355 230 C359 296 350 363 354 424 C348 437 334 441 307 440 C244 445 193 439 132 442 C79 445 40 439 14 443 C10 405 7 373 10 319 C13 252 5 201 9 134 C12 73 5 32 15 14 Z"
        />
      </svg>
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
