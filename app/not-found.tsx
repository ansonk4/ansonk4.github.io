import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-page">
      <div className="site-canvas not-found-page">
        <section className="intro-panel not-found-content">
          <h1>404</h1>
          <div className="bio-copy">
            <p>Page not found.</p>
            <p>
              <Link href="/">Return home</Link>
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
