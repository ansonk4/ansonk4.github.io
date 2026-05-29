import type { CvEntry } from "@/lib/content-types";
import { SectionTitle } from "./SectionTitle";

type CvSectionProps = {
  id: string;
  title: string;
  items: CvEntry[];
};

export function CvSection({ id, title, items }: CvSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section className="cv-section" aria-labelledby={titleId}>
      <SectionTitle>
        <span id={titleId}>{title}</span>
      </SectionTitle>
      <div className="cv-list">
        {items.map((item) => (
          <article className="cv-row" key={`${item.title}-${item.period}`}>
            <div>
              <h3>{item.title}</h3>
              {item.detail ? <p>{item.detail}</p> : null}
            </div>
            {item.period ? <time>{item.period}</time> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
