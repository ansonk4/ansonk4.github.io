import Image from "next/image";
import type { Publication } from "@/lib/content-types";
import { SectionTitle } from "./SectionTitle";

type PublicationsSectionProps = {
  publications: Publication[];
};

const accentClass: Record<Publication["accent"], string> = {
  blue: "accent-blue",
  green: "accent-green",
  orange: "accent-orange"
};

export function PublicationsSection({ publications }: PublicationsSectionProps) {
  return (
    <section className="publications" aria-labelledby="publications-title">
      <SectionTitle icon="/assets/icon-book.png">
        <span id="publications-title">Selected Publications</span>
      </SectionTitle>
      <div className="publication-list">
        {publications.map((publication) => (
          <article className="publication-row" key={publication.title}>
            <div className="venue-block">
              <div className="venue-heading">
                <strong className={accentClass[publication.accent]}>{publication.venue}</strong>
                {publication.badge ? (
                  <span
                    className={`publication-badge ${accentClass[publication.accent]}${
                      publication.badge === "Oral" ? " publication-badge-bold" : ""
                    }`}
                  >
                    {publication.badge}
                  </span>
                ) : null}
              </div>
              <span>{publication.year}</span>
              {publication.links?.length ? (
                <div className="paper-links">
                  {publication.links.map((link) => (
                    <a key={link.label} href={link.href} aria-label={`${publication.title} ${link.label}`}>
                      <Image src={link.icon} alt="" width={20} height={20} />
                    </a>
                  ))}
                </div>
              ) : null}
            </div>
            <div className="publication-copy">
              <h3>{publication.title}</h3>
              <p>
                {publication.authors.map((author, index) => (
                  <span key={author.name}>
                    {index > 0 ? ", " : ""}
                    {author.highlighted ? <strong>{author.name}</strong> : author.name}
                  </span>
                ))}
                .
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
