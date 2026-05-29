import type { Education } from "@/lib/content-types";
import { SectionTitle } from "./SectionTitle";

type EducationSectionProps = {
  education: Education[];
};

export function EducationSection({ education }: EducationSectionProps) {
  return (
    <section className="education" aria-labelledby="education-title">
      <SectionTitle icon="/assets/icon-cap.png">
        <span id="education-title">Education</span>
      </SectionTitle>
      <div className="education-list">
        {education.map((item) => (
          <article className="education-row" key={`${item.degree}-${item.year}`}>
            <div>
              <h3>
                {item.degree}, {item.institution}
              </h3>
              <p>{item.detail}</p>
            </div>
            <time>{item.year}</time>
          </article>
        ))}
      </div>
      <div className="skyline-wrap" aria-hidden="true">
        <img
          src="/assets/hong-kong-skyline.png"
          alt=""
        />
      </div>
    </section>
  );
}
