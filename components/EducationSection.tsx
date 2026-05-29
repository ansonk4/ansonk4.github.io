import type { Education } from "@/lib/content-types";
import { SectionTitle } from "./SectionTitle";

type EducationSectionProps = {
  education: Education[];
};

export function EducationSection({ education }: EducationSectionProps) {
  return (
    <section className="education" aria-labelledby="education-title">
      <SectionTitle>
        <span id="education-title">Education</span>
      </SectionTitle>
      <div className="education-list">
        {education.map((item) => (
          <article className="education-row" key={`${item.degree}-${item.year}`}>
            <time>{item.year}</time>
            <div>
              <h3>
                {item.degree}, {item.institution}
              </h3>
              <p>{item.detail}</p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
