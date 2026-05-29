import Biography, { profile } from "@/content/biography.mdx";
import { education } from "@/content/education.mdx";
import { publications } from "@/content/publications.mdx";
import { EducationSection } from "@/components/EducationSection";
import { Hero } from "@/components/Hero";
import { PublicationsSection } from "@/components/PublicationsSection";

export default function Home() {
  return (
    <main className="site-page">
      <div className="site-canvas">
        <Hero profile={profile}>
          <Biography />
        </Hero>
        <PublicationsSection publications={publications} />
        <EducationSection education={education} />
      </div>
    </main>
  );
}
