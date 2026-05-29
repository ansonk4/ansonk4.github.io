import Image from "next/image";
import type { ProfileLink, Publication } from "@/lib/content-types";
import { SectionTitle } from "./SectionTitle";

type PublicationsSectionProps = {
  publications: Publication[];
};

type PublicationLink = ProfileLink & {
  size?: number;
};

function getPaperLink(href: string) {
  const isArxivLink = href.includes("arxiv.org");

  return {
    label: isArxivLink ? "arXiv" : "Paper",
    href,
    icon: isArxivLink ? "/assets/icon-arxiv.svg" : "/assets/icon-paper.svg",
    size: isArxivLink ? 16 : 20
  };
}

export function PublicationsSection({ publications }: PublicationsSectionProps) {
  return (
    <section className="publications" aria-labelledby="publications-title">
      <SectionTitle>
        <span id="publications-title">Selected Publications</span>
      </SectionTitle>
      <div className="publication-list">
        {publications.map((publication) => {
          const publicationLinks: PublicationLink[] = [
            ...(publication.paper ? [getPaperLink(publication.paper)] : []),
            ...(publication.code
              ? [{ label: "Code", href: publication.code, icon: "/assets/icon-github.svg" }]
              : []),
            ...(publication.links ?? [])
          ];

          return (
            <article className="publication-row" key={publication.title}>
              <div className="venue-block">
                <div className="venue-heading">
                  <strong className="accent-blue">{publication.venue}</strong>
                  {publication.badge ? (
                    <span
                      className={`publication-badge accent-blue${
                        publication.badge === "Oral" ? " publication-badge-bold" : ""
                      }`}
                    >
                      {publication.badge}
                    </span>
                  ) : null}
                </div>
                <div className="publication-meta">
                  <span>{publication.year}</span>
                  {publicationLinks.length ? (
                    <div className="paper-links">
                      {publicationLinks.map((link) => (
                        <a
                          key={`${link.label}-${link.href}`}
                          href={link.href}
                          aria-label={`${publication.title} ${link.label}`}
                        >
                          <Image src={link.icon} alt="" width={link.size ?? 20} height={link.size ?? 20} />
                        </a>
                      ))}
                    </div>
                  ) : null}
                </div>
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
          );
        })}
      </div>
    </section>
  );
}
