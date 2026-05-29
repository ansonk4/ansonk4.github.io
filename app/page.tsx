import Biography, { profile } from "@/content/biography.mdx";
import { academicService } from "@/content/academic-service.mdx";
import { education } from "@/content/education.mdx";
import { publications } from "@/content/publications.mdx";
import { teaching } from "@/content/teaching.mdx";
import { CvSection } from "@/components/CvSection";
import { EducationSection } from "@/components/EducationSection";
import { Hero } from "@/components/Hero";
import { PublicationsSection } from "@/components/PublicationsSection";
import { RandomHeroPanel } from "@/components/RandomHeroPanel";
import { SkylineFooter } from "@/components/SkylineFooter";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function Home() {
  return (
    <main className="site-page">
      <div className="site-canvas">
        <ThemeToggle />
        <Hero profile={profile}>
          <Biography />
        </Hero>
        <PublicationsSection publications={publications} />
        <EducationSection education={education} />
        <CvSection id="academic-service" title="Academic Service" items={academicService} />
        <CvSection id="teaching" title="Teaching" items={teaching} dateLeft />
        <RandomHeroPanel className="hero-panel-bottom" />
        <SkylineFooter />
      </div>
    </main>
  );
}
