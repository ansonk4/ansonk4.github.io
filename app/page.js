"use client";

import SplitPane from "./components/SplitPane";

export default function Home() {
  return (
    <div style={{ width: "100vw", height: "100vh", minHeight: "600px", border: "1px solid #000" }}>
      {/* Outer split: top row vs bottom section */}
      <SplitPane direction="vertical" defaultSplit={25}>
        {/* ===== TOP ROW ===== */}
        <SplitPane direction="horizontal" defaultSplit={55}>
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
            <h2 style={{ fontSize: "2.2rem", fontWeight: 700, marginBottom: "4px" }}>Work</h2>
            <p style={{ fontSize: "0.85rem", color: "#666" }}>Web Development</p>
            <div style={{ marginTop: "20px" }}>
              <p>Simple text area for work description.</p>
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
