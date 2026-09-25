"use client";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <section className="shell error-page">
      <span className="eyebrow">A brief interruption</span>
      <h1>Let’s try that again.</h1>
      <p>We couldn’t load this page. Please give it another moment.</p>
      <button className="button" onClick={reset}>
        Try again ↗
      </button>
    </section>
  );
}
