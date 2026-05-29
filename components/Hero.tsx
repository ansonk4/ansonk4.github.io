import Image from "next/image";
import type { Profile } from "@/lib/content-types";
import { EmailCopy } from "./EmailCopy";
import { PortraitToggle } from "./PortraitToggle";
import { RandomHeroPanel } from "./RandomHeroPanel";

type HeroProps = {
  profile: Profile;
  children: React.ReactNode;
};

export function Hero({ profile, children }: HeroProps) {
  return (
    <section className="hero-grid" aria-labelledby="site-title">
      <PortraitToggle name={profile.name} />

      <div className="intro-panel">
        <h1 id="site-title">{profile.name}</h1>
        <div className="bio-copy">{children}</div>
        <EmailCopy email={profile.email} />
        <nav className="profile-links" aria-label="Profile links">
          {profile.links.map((link) => (
            <a key={link.label} href={link.href}>
              <span className="profile-link-icon" aria-hidden="true">
                <Image src={link.icon} alt="" width={18} height={18} />
              </span>
              <span>{link.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <RandomHeroPanel className="hero-panel-desktop" />
    </section>
  );
}
