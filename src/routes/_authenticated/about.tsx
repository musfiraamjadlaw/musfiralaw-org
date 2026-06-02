import { createFileRoute } from "@tanstack/react-router";
import signatureAsset from "@/assets/signature.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Untangle" },
      {
        name: "description",
        content:
          "Why I built Untangle — from discipline and productivity to the real question: what condition for action is missing?",
      },
    ],
  }),
});

function AboutPage() {
  return (
    <article className="max-w-2xl mx-auto">
      <header className="text-center mb-12">
        <p className="text-[11px] tracking-[3px] uppercase text-muted-foreground mb-4">
          Colophon
        </p>
        <h1
          className="text-foreground leading-tight"
          style={{ fontFamily: "var(--font-serif)", fontSize: "44px", fontWeight: 400 }}
        >
          Why I Built Untangle
        </h1>
      </header>

      <div
        className="space-y-6 text-foreground"
        style={{ fontFamily: "var(--font-serif)", fontSize: "18px", lineHeight: 1.7 }}
      >
        <p>
          For a long time, I thought my problem was discipline.
        </p>

        <p>
          Then organization.
        </p>

        <p>
          Then productivity.
        </p>

        <p>
          Then ADHD.
        </p>

        <p>
          Then discipline again, because apparently I enjoy repeating failed experiments.
        </p>

        <p>
          The issue was that none of those explanations felt complete.
        </p>

        <p>
          I could spend six hours reading case law, researching a question nobody asked, or disappearing down a behavioral neuroscience rabbit hole. But somehow answering an email felt like lifting a Honda Civic.
        </p>

        <p>
          That never made sense to me.
        </p>

        <p>
          I have a background in science. I work in litigation. In both worlds, when something doesn't make sense, you're supposed to investigate it.
        </p>

        <p>
          Instead, most advice seemed content to stop at the observation.
        </p>

        <p>
          You're overwhelmed.
        </p>

        <p>
          You're procrastinating.
        </p>

        <p>
          You're distracted.
        </p>

        <p>
          Fine.
        </p>

        <p>
          But those aren't explanations. They're descriptions.
        </p>

        <p>
          The interesting question is <em>why.</em>
        </p>

        <p>
          Over time, I started noticing patterns.
        </p>

        <p>
          Sometimes I couldn't start because there was no urgency.
        </p>

        <p>
          Sometimes because the task wasn't meaningful.
        </p>

        <p>
          Sometimes because I was trying to hold twenty unfinished thoughts in my head at the same time.
        </p>

        <p>
          Sometimes because I wasn't stuck at all — I just hadn't identified the real problem yet.
        </p>

        <p>
          The more attention I paid, the less it felt like a character flaw and the more it felt like a system.
        </p>

        <p>
          Untangle grew out of that realization.
        </p>

        <p>
          Not as a productivity tool.
        </p>

        <p>
          Not as a planner.
        </p>

        <p>
          Not as a way to optimize every waking minute of my life.
        </p>

        <p>
          Just a place to investigate what isn't making sense.
        </p>

        <p>
          A place to take a thought like:
        </p>

        <p className="italic text-muted-foreground pl-6">
          "I have a million things to do."
        </p>

        <p>
          and ask:
        </p>

        <p className="italic text-muted-foreground pl-6">
          "What's actually going on here?"
        </p>

        <p>
          Because most of the time, the thing causing the problem isn't the thing we think is causing the problem.
        </p>

        <p>
          And that's usually where the interesting answers live.
        </p>
      </div>

      <hr className="my-12 border-border" />

      <footer className="text-center space-y-4">
        <p
          className="text-muted-foreground italic"
          style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}
        >
          Xoxo,
        </p>
        <img
          src={signatureAsset.url}
          alt="Musfira"
          className="block h-14 w-auto mx-auto"
          style={{ mixBlendMode: "multiply" }}
        />
        <div className="flex flex-col items-center gap-3 pt-6">
          <a
            href="https://musfiraamjadlaw.substack.com/"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] tracking-[2px] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Read the Substack →
          </a>
          <a
            href="mailto:musfiraamjadlaw@gmail.com"
            className="text-[11px] tracking-[2px] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            musfiraamjadlaw@gmail.com
          </a>
        </div>
      </footer>
    </article>
  );
}
