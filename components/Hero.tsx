import Image from "next/image";
import type { Profile } from "@/lib/content-types";

type HeroProps = {
  profile: Profile;
  children: React.ReactNode;
};

export function Hero({ profile, children }: HeroProps) {
  return (
    <section className="hero-grid" aria-labelledby="site-title">
      <div className="portrait-wrap">
        <Image
          src="/assets/portrait.png"
          alt="Illustrated portrait of Kai Lin"
          fill
          sizes="(max-width: 768px) 70vw, 290px"
          priority
          className="portrait-image"
        />
      </div>

      <div className="intro-panel">
        <h1 id="site-title">{profile.name}</h1>
        <div className="bio-copy">{children}</div>
        <a className="email" href={`mailto:${profile.email}`}>
          {profile.email}
        </a>
        <nav className="profile-links" aria-label="Profile links">
          {profile.links.map((link) => (
            <a key={link.label} href={link.href}>
              <Image src={link.icon} alt="" width={22} height={22} />
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <div className="research-asset">
        <svg
          className="sketch-card-border"
          viewBox="0 0 360 450"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M13 7 C54 3 112 8 166 5 C226 2 281 6 346 5 C353 7 357 14 355 24 C353 86 358 139 354 198 C352 256 357 315 354 379 C354 410 354 431 347 443 C288 447 238 441 181 444 C119 447 62 443 14 445 C7 438 6 411 8 382 C10 315 5 261 7 198 C9 136 5 78 8 21 C8 14 9 10 13 7 Z" />
        </svg>
        <Image
          src="/assets/research-illustration.png"
          alt="Hand-drawn illustration of trustworthy AI for language and learning"
          width={355}
          height={390}
          sizes="(max-width: 768px) 90vw, 365px"
          priority
        />
        <p>{profile.tagline}</p>
      </div>
    </section>
  );
}
