import type { CvEntry } from "@/lib/content-types";
import { SectionTitle } from "./SectionTitle";

type CvSectionProps = {
  id: string;
  title: string;
  items: CvEntry[];
  dateLeft?: boolean;
};

export function CvSection({ id, title, items, dateLeft = false }: CvSectionProps) {
  const titleId = `${id}-title`;

  return (
    <section
      className={`cv-section${dateLeft ? " cv-section-date-left" : ""}`}
      aria-labelledby={titleId}
    >
      <SectionTitle>
        <span id={titleId}>{title}</span>
      </SectionTitle>
      <div className="cv-list">
        {items.map((item) => {
          const date = item.period ? <time>{item.period}</time> : null;
          const copy = (
            <div>
              <h3>{item.title}</h3>
              {item.detail ? <p>{item.detail}</p> : null}
            </div>
          );

          return (
            <article className="cv-row" key={`${item.title}-${item.period}`}>
              {dateLeft ? (
                <>
                  {date}
                  {copy}
                </>
              ) : (
                <>
                  {copy}
                  {date}
                </>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
