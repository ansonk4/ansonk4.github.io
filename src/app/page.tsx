"use client";

import { useState } from "react";

import SplitPane from "@/app/components/SplitPane";

const papers = [
  {
    title: "SentinelRAG: Synthetic Sentinel Knowledge for RAG Database Copyright Protection",
    authors: "Tsun On Kwok, Xi Yang, Ki Sen Hung, Chang Liu, Yangqiu Song",
    venue: "Under Review, 2026",
  },
  {
    title: "Into the Gray Zone: Domain Contexts Can Blur LLM Safety Boundaries",
    authors:
      "Ki Sen Hung, Xi Yang, Chang Liu, Haoran Li, Kejiang Chen, Changxuan Fan, Tsun On Kwok, Weiming Zhang, Xiaomeng Li, Yangqiu Song",
    venue: "Under Review, 2026",
  },
];

const education = [
  {
    school: "HKUST",
    degree: "MPhil in Computer Science & Engineering",
    years: "2025 - Present",
  },
  {
    school: "CUHK",
    degree: "B.Sc. in Computer Science",
    years: "2020 - 2025",
  },
];

export default function Home() {
  const [isEmailHovered, setIsEmailHovered] = useState(false);

  return (
    <div className="h-screen min-h-[600px] w-screen overflow-hidden border border-black">
      <SplitPane direction="vertical" defaultSplit={25}>
        <SplitPane direction="horizontal" defaultSplit={55}>
          <div className="bento-cell flex items-center">
            <h1 className="text-[clamp(1.8rem,3.5vw,3.2rem)] font-semibold leading-tight tracking-[-0.5px]">
              <span className="block">Hi, I&apos;m</span>
              <span className="block">Anson Kwok</span>
            </h1>
          </div>

          <div className="bento-cell flex flex-col justify-center">
            <h2 className="text-[1.7rem] font-semibold">Research</h2>
            <div className="mt-2">
              <p className="leading-relaxed text-black font-medium">
                My research interests lie in the security and alignment of Large Language Models. 
                I am currently working on developing robust frameworks for database copyright protection and mitigating context-aware adversarial vulnerabilities, 
                ensuring both the integrity and safety of AI systems in deployment.
              </p>
            </div>
          </div>
        </SplitPane>

        <SplitPane direction="horizontal" defaultSplit={40}>
          <div className="bento-cell flex flex-col bg-white">
            <h2 className="mb-1 text-[1.7rem] font-semibold">Selected Papers</h2>

            <div className="mt-2 flex flex-col gap-4">
              {papers.map((paper) => (
                <article key={paper.title}>
                  <h3 className="text-base font-semibold leading-snug">{paper.title}</h3>
                  <p className="text-xs text-zinc-700">{paper.authors}</p>
                  <p className="text-xs italic text-zinc-500">{paper.venue}</p>
                </article>
              ))}
            </div>
          </div>

          <SplitPane direction="vertical" defaultSplit={60}>
            <div className="bento-cell flex flex-col">
              <div className="flex flex-row-reverse items-start gap-6">
                <svg className="h-[120px] w-[120px] shrink-0" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="120" rx="60" fill="#e0e0e0" />
                  <circle cx="60" cy="42" r="28" fill="#333" />
                  <rect x="32" y="55" width="56" height="40" rx="8" fill="#333" />
                  <circle cx="48" cy="44" r="10" fill="none" stroke="#fff" strokeWidth="2" />
                  <circle cx="72" cy="44" r="10" fill="none" stroke="#fff" strokeWidth="2" />
                  <line x1="58" y1="44" x2="62" y2="44" stroke="#fff" strokeWidth="2" />
                </svg>

                <div>
                  <p className="text-lg leading-relaxed text-black font-medium">
                    I am a first-year MPhil student in the Department of Computer Science and Engineering at the Hong
                    Kong University of Science and Technology, supervised by Prof. Yangqiu Song. Previously, I earned
                    my B.Sc. in Computer Science from The Chinese University of Hong Kong.
                  </p>
                  <p
                    className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-base underline"
                    title="Click to copy email"
                    onClick={() => navigator.clipboard.writeText("tokwok@connect.ust.hk")}
                    onMouseEnter={() => setIsEmailHovered(true)}
                    onMouseLeave={() => setIsEmailHovered(false)}
                  >
                    tokwok@connect.ust.hk
                    {isEmailHovered && (
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="opacity-60"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bento-cell flex flex-col justify-center">
              <h2 className="mb-1 text-[1.7rem] font-semibold">Education</h2>

              <div className="mt-2 flex flex-col gap-4">
                {education.map((item) => (
                  <article key={item.school}>
                    <h3 className="text-sm font-semibold">{item.school}</h3>
                    <p className="text-xs text-zinc-600">{item.degree}</p>
                    <p className="text-xs text-zinc-500">{item.years}</p>
                  </article>
                ))}
              </div>
            </div>
          </SplitPane>
        </SplitPane>
      </SplitPane>
    </div>
  );
}
