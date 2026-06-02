import { createFileRoute } from "@tanstack/react-router";
import signatureAsset from "@/assets/signature.jpg.asset.json";

const PHOTO_1 =
  "https://substackcdn.com/image/fetch/$s_!Btg_!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F163f23ce-6e2e-4936-a181-71a6ab769b4e_885x787.jpeg";
const PHOTO_2 =
  "https://substackcdn.com/image/fetch/$s_!wqAU!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe1072df6-26a6-46c3-b2dc-665ed1e91cb2_1080x720.jpeg";
const PHOTO_3 =
  "https://substackcdn.com/image/fetch/$s_!0x5q!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F6317c4e3-7564-4af3-855a-d89507c161fc_695x657.jpeg";
const PHOTO_4 =
  "https://substackcdn.com/image/fetch/$s_!wT0Q!,w_1456,c_limit,f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdbd90b81-fd91-4282-89bd-ccd6da150946_736x736.jpeg";

export const Route = createFileRoute("/_authenticated/colophon")({
  component: ColophonPage,
  head: () => ({
    meta: [
      { title: "Colophon — Untangle" },
      {
        name: "description",
        content:
          "Why I built Untangle. Not a productivity tool. A place to investigate what isn't making sense.",
      },
    ],
  }),
});

function ColophonPage() {
  return (
    <article
      className="max-w-2xl mx-auto pb-24"
      style={{ fontFamily: "var(--font-serif)" }}
    >
      {/* Opening image — editorial, large, unframed */}
      <figure className="-mx-6 md:mx-0 mb-16">
        <img
          src={PHOTO_2}
          alt=""
          loading="eager"
          className="w-full h-auto"
        />
      </figure>

      <h1
        className="text-foreground leading-[1.05] tracking-tight"
        style={{ fontSize: "clamp(40px, 6vw, 64px)", fontWeight: 400 }}
      >
        Why I built Untangle.
      </h1>

      <div
        className="mt-16 text-foreground space-y-8"
        style={{ fontSize: "20px", lineHeight: 1.75 }}
      >
        <p>
          For a long time, I thought my problem was discipline. Then organization. Then productivity. Then ADHD. Then discipline again, because apparently I enjoy repeating failed experiments.
        </p>

        <p>
          The issue was that none of those explanations felt complete. I could spend six hours reading case law, researching a question nobody asked, or disappearing down a behavioral neuroscience rabbit hole. But somehow answering an email felt like lifting a Honda Civic. That never made sense to me.
        </p>

        <p>
          I have a background in science. I work in litigation. In both worlds, when something doesn't make sense, you're supposed to investigate it. Instead, most advice seemed content to stop at the observation. You're overwhelmed. You're procrastinating. You're distracted. Fine.
        </p>

        <p>
          But those aren't explanations. They're descriptions. The interesting question is <em>why.</em>
        </p>
      </div>

      <figure className="my-20 -mx-6 md:mx-0">
        <img src={PHOTO_1} alt="" loading="lazy" className="w-full h-auto" />
      </figure>

      <div
        className="text-foreground space-y-8"
        style={{ fontSize: "20px", lineHeight: 1.75 }}
      >
        <p>
          Over time, I started noticing patterns. Sometimes I couldn't start because there was no urgency. Sometimes because the task wasn't meaningful. Sometimes because I was trying to hold twenty unfinished thoughts in my head at the same time. Sometimes I wasn't stuck at all — I just hadn't identified the real problem yet.
        </p>

        <p>
          The more attention I paid, the less it felt like a character flaw and the more it felt like a system.
        </p>
      </div>

      <figure className="my-20 -mx-6 md:mx-0">
        <img src={PHOTO_3} alt="" loading="lazy" className="w-full h-auto" />
      </figure>

      <div
        className="text-foreground space-y-8"
        style={{ fontSize: "20px", lineHeight: 1.75 }}
      >
        <p>
          Untangle grew out of that realization. Not as a productivity tool. Not as a planner. Not as a way to optimize every waking minute of my life. Just a place to investigate what isn't making sense.
        </p>

        <p>
          A place to take a thought like <em>"I have a million things to do"</em> and ask <em>"what's actually going on here?"</em> — because most of the time, the thing causing the problem isn't the thing we think is causing the problem. And that's usually where the interesting answers live.
        </p>
      </div>

      <figure className="my-20 -mx-6 md:mx-0">
        <img src={PHOTO_4} alt="" loading="lazy" className="w-full h-auto" />
      </figure>

      {/* PULL QUOTE — closing */}
      <div className="my-24 text-center">
        <p
          className="text-foreground leading-[1.15] tracking-tight italic"
          style={{ fontSize: "clamp(34px, 5vw, 52px)", fontWeight: 400 }}
        >
          "Those aren't explanations.<br />
          They're descriptions."
        </p>
      </div>

      <footer className="text-center space-y-5 pt-8 border-t border-border">
        <p className="text-muted-foreground italic" style={{ fontSize: "18px" }}>
          Xoxo,
        </p>
        <img
          src={signatureAsset.url}
          alt="Musfira"
          className="block h-14 w-auto mx-auto"
          style={{ mixBlendMode: "multiply" }}
        />
        <div className="flex flex-col items-center gap-3 pt-4">
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
