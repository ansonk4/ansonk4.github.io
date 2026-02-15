"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";

import SplitPane from "@/app/components/SplitPane";
import SplitLineTreeOverlay from "@/app/components/SplitLineTreeOverlay";
import TypingName from "@/app/components/TypingName";

const papers = [
  {
    title: "[Hidden for double blind review]",
    authors: (
      <>
        <span className="font-semibold text-black">Tsun On Kwok</span>, Xi Yang, Ki Sen Hung, Chang Liu, Yangqiu
        Song
      </>
    ),
    venue: "Under Review, 2026",
  },
  {
    title: "Into the Gray Zone: Domain Contexts Can Blur LLM Safety Boundaries",
    authors: (
      <>
        Ki Sen Hung, Xi Yang, Chang Liu, Haoran Li, Kejiang Chen, Changxuan Fan,{" "}
        <span className="font-semibold text-black">Tsun On Kwok</span>, Weiming Zhang, Xiaomeng Li, Yangqiu Song
      </>
    ),
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
    degree: "B.Sc. in Computer Science, First Class Honours",
    years: "2020 - 2025",
  },
];

const academicServices = [
  {
    role: "Reviewer",
    detail: "ACL ARR 2026 January",
  },
];

const teaching = [
  {
    course: "COMP 1023: Introduction to Python Programming",
    role: "Teaching Assistant · HKUST",
    term: "Spring 2026",
  },
];

const ENABLE_ENTRANCE_ANIMATION = false;

export default function Home() {
  const [isEmailHovered, setIsEmailHovered] = useState(false);
  const [isEmailCopied, setIsEmailCopied] = useState(false);
  const [isSplitLineAnimating, setIsSplitLineAnimating] = useState(ENABLE_ENTRANCE_ANIMATION);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const emailCopyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finishSplitLineAnimation = useCallback(() => {
    setIsSplitLineAnimating(false);
  }, []);
  const handleEmailCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText("tokwok@connect.ust.hk");
      setIsEmailCopied(true);
      if (emailCopyTimeoutRef.current) {
        clearTimeout(emailCopyTimeoutRef.current);
      }
      emailCopyTimeoutRef.current = setTimeout(() => {
        setIsEmailCopied(false);
      }, 1200);
    } catch {
      setIsEmailCopied(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (emailCopyTimeoutRef.current) {
        clearTimeout(emailCopyTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={`relative h-screen min-h-[600px] w-screen overflow-hidden border border-black ${
        isSplitLineAnimating ? "split-lines-animating" : ""
      }`}
    >
      <SplitPane direction="vertical" defaultSplit={25}>
        <SplitPane direction="horizontal" defaultSplit={45}>
          <div className="bento-cell flex items-center">
            <h1 className="text-[clamp(1.8rem,3.5vw,3.2rem)] font-semibold leading-tight tracking-[-0.5px]">
              <span className="block">Hi, I&apos;m</span>
              <span className="block"><TypingName /></span>
            </h1>
          </div>

          <div className="bento-cell flex flex-col bento-safe-center">
            <h2 className="text-[1.7rem] font-semibold">Research</h2>
            <div className="mt-2">
              <p className="leading-relaxed text-black font-medium">
                My research interests lie in the security and alignment of Large Language Models.
                I am currently working on developing robust frameworks for database copyright protection and mitigating context-aware adversarial vulnerabilities.
              </p>
            </div>
          </div>
        </SplitPane>

        <SplitPane direction="horizontal" defaultSplit={25}>
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

          <SplitPane direction="vertical" defaultSplit={45}>
            <div className="bento-cell flex flex-col bento-safe-center">
              <div className="flex flex-row-reverse items-center gap-6">
                <Image
                  src="/me.png"
                  alt="Photo of Tsun On Kwok"
                  width={128}
                  height={165}
                  priority
                  className="mobile-profile-image h-[165px] w-[128px] shrink-0 rounded-lg object-cover"
                />

                <div>
                  <p className="text-lg leading-relaxed text-black font-medium">
                    I am a first-year MPhil student in the{" "}
                    <a
                      href="https://cse.hkust.edu.hk/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      Department of Computer Science and Engineering
                    </a>{" "}
                    at the{" "}
                    <a
                      href="https://hkust.edu.hk/zh-hant"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      Hong Kong University of Science and Technology
                    </a>
                    , supervised by{" "}
                    <a
                      href="https://www.cse.ust.hk/~yqsong/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      Prof. Yangqiu Song
                    </a>
                    . Previously, I earned my B.Sc. in Computer Science from{" "}
                    <a
                      href="https://www.cse.cuhk.edu.hk/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline decoration-1 underline-offset-4 hover:decoration-2"
                    >
                      The Chinese University of Hong Kong
                    </a>
                    .
                  </p>
                  <p
                    className="mt-4 flex w-fit cursor-pointer items-center gap-2 text-base underline"
                    title="Click to copy email"
                    onClick={handleEmailCopy}
                    onMouseEnter={() => setIsEmailHovered(true)}
                    onMouseLeave={() => setIsEmailHovered(false)}
                  >
                    tokwok@connect.ust.hk
                    {(isEmailHovered || isEmailCopied) && (
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
                        {isEmailCopied ? (
                          <path d="M20 6 9 17l-5-5" />
                        ) : (
                          <>
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                          </>
                        )}
                      </svg>
                    )}
                  </p>
                </div>
              </div>
            </div>

            <SplitPane direction="horizontal" defaultSplit={45}>
              <div className="bento-cell flex flex-col bento-safe-center">
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

              <SplitPane direction="vertical" defaultSplit={50}>
                <div className="bento-cell flex flex-col bento-safe-center">
                  <h2 className="mb-1 text-[1.2rem] font-semibold">Academic Service</h2>
                  <div className="mt-2 flex flex-col gap-3">
                    {academicServices.map((item) => (
                      <article key={`${item.role}-${item.detail}`}>
                        <h3 className="text-sm font-semibold">{item.role}</h3>
                        <p className="text-xs text-zinc-600">{item.detail}</p>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="bento-cell flex flex-col bento-safe-center">
                  <h2 className="mb-1 text-[1.2rem] font-semibold">Teaching</h2>
                  <div className="mt-2 flex flex-col gap-3">
                    {teaching.map((item) => (
                      <article key={item.course}>
                        <h3 className="text-sm font-semibold">{item.course}</h3>
                        <p className="text-xs text-zinc-600">{item.role}</p>
                        <p className="text-xs text-zinc-500">{item.term}</p>
                      </article>
                    ))}
                  </div>
                </div>
              </SplitPane>
            </SplitPane>
          </SplitPane>
        </SplitPane>
      </SplitPane>

      {isSplitLineAnimating && (
        <SplitLineTreeOverlay containerRef={rootRef} onDone={finishSplitLineAnimation} />
      )}
    </div>
  );
}
