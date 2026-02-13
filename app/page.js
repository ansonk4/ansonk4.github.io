"use client";

import SplitPane from "./components/SplitPane";

export default function Home() {
  return (
    <div style={{ width: "100vw", height: "100vh", minHeight: "600px" }}>
      {/* Outer split: top row vs bottom section */}
      <SplitPane direction="vertical" defaultSplit={20}>
        {/* ===== TOP ROW ===== */}
        <SplitPane direction="horizontal" defaultSplit={40}>
          {/* Intro */}
          <div className="bento-cell cell-intro">
            <h1>
              Hi, I am Zoe
              <br />
              A Full-stack Developer
            </h1>
          </div>

          {/* Skills */}
          <div className="bento-cell cell-skills">
            <h2>Skills</h2>
            <div className="skills-list">
              <span>CSS</span>
              <span>HTML</span>
              <span>JavaScript</span>
              <span>Node.js</span>
              <span>Python</span>
              <span className="highlight">React</span>
              <span>SQL</span>
              <span>Tailwind</span>
              <span className="highlight">Three.js</span>
              <span>TypeScript</span>
            </div>
          </div>
        </SplitPane>

        {/* ===== BOTTOM SECTION ===== */}
        <SplitPane direction="horizontal" defaultSplit={40}>
          {/* Work — left side */}
          <div className="bento-cell cell-work">
            <div className="work-header">
              <h2>Work</h2>
              <p>Web Development</p>
            </div>

            <div className="work-illustration">
              <svg
                className="eye"
                viewBox="0 0 100 50"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 25 Q50 -10 95 25 Q50 60 5 25Z"
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                />
                <circle cx="50" cy="25" r="10" fill="#000" />
              </svg>

              <span className="emotion-label">Emotion</span>

              <svg
                className="eye"
                viewBox="0 0 100 50"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5 25 Q50 -10 95 25 Q50 60 5 25Z"
                  fill="none"
                  stroke="#000"
                  strokeWidth="2"
                />
                <circle cx="50" cy="25" r="10" fill="#000" />
              </svg>
            </div>

            <div className="work-footer">
              <div>
                <span className="project-name">Emotion</span>
                <div className="social-icons">
                  <a href="#" aria-label="Twitter">
                    <svg
                      width="20"
                      height="20"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.3 4.3 0 001.88-2.38 8.59 8.59 0 01-2.72 1.04 4.28 4.28 0 00-7.32 3.91A12.16 12.16 0 013.16 4.86a4.28 4.28 0 001.33 5.71 4.24 4.24 0 01-1.94-.54v.05a4.28 4.28 0 003.43 4.19 4.27 4.27 0 01-1.93.07 4.29 4.29 0 004 2.98A8.59 8.59 0 012 19.54a12.13 12.13 0 006.56 1.92c7.88 0 12.2-6.53 12.2-12.2l-.01-.56A8.72 8.72 0 0024 5.06a8.56 8.56 0 01-2.54.7z" />
                    </svg>
                  </a>
                  <a href="#" aria-label="Link 1" style={{ fontWeight: 700, fontSize: "1rem" }}>L</a>
                  <a href="#" aria-label="Link 2" style={{ fontWeight: 700, fontSize: "1rem" }}>L</a>
                  <a href="#" aria-label="Link 3" style={{ fontWeight: 700, fontSize: "1rem" }}>L</a>
                  <a href="#" aria-label="Link 4" style={{ fontWeight: 700, fontSize: "1rem" }}>L</a>
                </div>
              </div>
              <div className="tech-tags">
                <span>GSAP</span>
                <span>Three.js</span>
              </div>
            </div>
          </div>

          {/* Right column: About Me / Contact Me */}
          <SplitPane direction="vertical" defaultSplit={60}>
            {/* About Me */}
            <div className="bento-cell cell-about">
              <h2>About Me</h2>
              <div className="about-content">
                <svg
                  className="about-avatar"
                  viewBox="0 0 120 120"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <rect width="120" height="120" rx="60" fill="#e0e0e0" />
                  <circle cx="60" cy="42" r="28" fill="#333" />
                  <rect x="32" y="55" width="56" height="40" rx="8" fill="#333" />
                  <circle cx="48" cy="44" r="10" fill="none" stroke="#fff" strokeWidth="2" />
                  <circle cx="72" cy="44" r="10" fill="none" stroke="#fff" strokeWidth="2" />
                  <line x1="58" y1="44" x2="62" y2="44" stroke="#fff" strokeWidth="2" />
                </svg>
                <p className="about-text">
                  Currently pursuing my master&apos;s degree at San Francisco State
                  University, majoring in Data Science and Artificial Intelligence.
                  Passionate about interactive frontend development and curious about
                  user experience.
                </p>
              </div>
            </div>

            {/* Contact Me */}
            <div className="bento-cell cell-contact">
              <h2>Contact Me</h2>
              <p className="email">zeyulong0908@gmail.com</p>
            </div>
          </SplitPane>
        </SplitPane>
      </SplitPane>
    </div>
  );
}
