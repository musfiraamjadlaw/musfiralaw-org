import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

function Ornament() {
  return (
    <div
      className="my-20 flex items-center justify-center gap-4 text-muted-foreground/60"
      aria-hidden
    >
      <span className="h-px w-16 bg-border" />
      <span style={{ fontFamily: "var(--font-serif)" }} className="text-lg">
        ❦
      </span>
      <span className="h-px w-16 bg-border" />
    </div>
  );
}

function ColophonPage() {
  return (
    <article
      className="max-w-2xl mx-auto pb-32 px-6 md:px-0"
      style={{ fontFamily: "var(--font-serif)" }}
    >
      {/* Masthead */}
      <header className="pt-4 pb-12 text-center">
        <p className="text-[10px] tracking-[0.32em] uppercase text-muted-foreground">
          Colophon · No. 01
        </p>
        <div className="mx-auto mt-4 h-px w-24 bg-border" />
        <p className="mt-4 text-[11px] tracking-[0.18em] uppercase text-muted-foreground/80 italic">
          A note from the author
        </p>
      </header>

      {/* Opening image — editorial, large, unframed */}
      <figure className="-mx-6 md:mx-0 mb-14">
        <img
          src={PHOTO_2}
          alt=""
          loading="eager"
          className="w-full h-auto"
        />
        <figcaption className="mt-3 px-6 md:px-0 text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
          Plate I — Field notes
        </figcaption>
      </figure>

      <h1
        className="text-foreground leading-[1.02] tracking-tight text-center"
        style={{ fontSize: "clamp(44px, 7vw, 72px)", fontWeight: 400 }}
      >
        Why I built<br />
        <em className="italic">Untangle.</em>
      </h1>

      <p className="mt-6 text-center text-[11px] tracking-[0.24em] uppercase text-muted-foreground">
        By Musfira Amjad
      </p>

      <div className="mx-auto mt-10 h-px w-16 bg-border" />

      <div
        className="mt-12 text-foreground space-y-7"
        style={{ fontSize: "20px", lineHeight: 1.75 }}
      >
        <p>
          <span
            className="float-left mr-3 mt-1 leading-[0.85] text-foreground"
            style={{
              fontFamily: "var(--font-serif)",
              fontSize: "5.2em",
              fontWeight: 400,
            }}
          >
            F
          </span>
          or a long time, I thought my problem was discipline. Then organization. Then productivity. Then ADHD. Then discipline again, because apparently I enjoy repeating failed experiments.
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

      <Ornament />

      <figure className="-mx-6 md:mx-0 mb-14">
        <img src={PHOTO_1} alt="" loading="lazy" className="w-full h-auto" />
        <figcaption className="mt-3 px-6 md:px-0 text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
          Plate II — On patterns
        </figcaption>
      </figure>

      <div
        className="text-foreground space-y-7"
        style={{ fontSize: "20px", lineHeight: 1.75 }}
      >
        <p>
          Over time, I started noticing patterns. Sometimes I couldn't start because there was no urgency. Sometimes because the task wasn't meaningful. Sometimes because I was trying to hold twenty unfinished thoughts in my head at the same time. Sometimes I wasn't stuck at all — I just hadn't identified the real problem yet.
        </p>

        <p>
          The more attention I paid, the less it felt like a character flaw and the more it felt like a system.
        </p>
      </div>

      <Ornament />

      <figure className="-mx-6 md:mx-0 mb-14">
        <img src={PHOTO_3} alt="" loading="lazy" className="w-full h-auto" />
        <figcaption className="mt-3 px-6 md:px-0 text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
          Plate III — A place to investigate
        </figcaption>
      </figure>

      <div
        className="text-foreground space-y-7"
        style={{ fontSize: "20px", lineHeight: 1.75 }}
      >
        <p>
          Untangle grew out of that realization. Not as a productivity tool. Not as a planner. Not as a way to optimize every waking minute of my life. Just a place to investigate what isn't making sense.
        </p>

        <p>
          A place to take a thought like <em>"I have a million things to do"</em> and ask <em>"what's actually going on here?"</em> — because most of the time, the thing causing the problem isn't the thing we think is causing the problem. And that's usually where the interesting answers live.
        </p>
      </div>

      <Ornament />

      <figure className="-mx-6 md:mx-0 mb-8">
        <img src={PHOTO_4} alt="" loading="lazy" className="w-full h-auto" />
        <figcaption className="mt-3 px-6 md:px-0 text-[11px] tracking-[0.14em] uppercase text-muted-foreground">
          Plate IV — The margin
        </figcaption>
      </figure>

      {/* PULL QUOTE — closing */}
      <blockquote className="my-24 text-center px-4">
        <span
          aria-hidden
          className="block text-muted-foreground/40 leading-none"
          style={{ fontFamily: "var(--font-serif)", fontSize: "72px" }}
        >
          “
        </span>
        <p
          className="-mt-6 text-foreground leading-[1.15] tracking-tight italic"
          style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 400 }}
        >
          Those aren't explanations.<br />
          They're descriptions.
        </p>
        <div className="mx-auto mt-8 h-px w-12 bg-border" />
      </blockquote>

      <SourceMaterial />



      <footer className="pt-10 border-t border-border">
        <div className="text-center space-y-5">
          <p className="text-muted-foreground italic" style={{ fontSize: "18px" }}>
            Xoxo,
          </p>
          <img
            src={signatureAsset.url}
            alt="Musfira"
            className="block h-16 w-auto mx-auto"
            style={{ mixBlendMode: "multiply" }}
          />
          <p className="text-[10px] tracking-[0.28em] uppercase text-muted-foreground pt-2">
            Musfira Amjad · Author
          </p>
        </div>

        <div className="mx-auto my-10 h-px w-16 bg-border" />

        {/* Editorial colophon block */}
        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5 text-[12px] leading-relaxed max-w-md mx-auto">
          {[
            ["Set in", "Cormorant Garamond & Source Serif"],
            ["Composed in", "Brooklyn, NY"],
            ["Subject", "Attention, not productivity"],
            ["Edition", "Untangle, vol. I"],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col">
              <dt className="text-[10px] tracking-[0.2em] uppercase text-muted-foreground">
                {k}
              </dt>
              <dd
                className="mt-1 text-foreground italic"
                style={{ fontFamily: "var(--font-serif)" }}
              >
                {v}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-12 flex flex-col items-center gap-3">
          <a
            href="https://musfiraamjadlaw.substack.com/"
            target="_blank"
            rel="noreferrer"
            className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            Read the Substack →
          </a>
          <a
            href="mailto:musfiraamjadlaw@gmail.com"
            className="text-[11px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
          >
            musfiraamjadlaw@gmail.com
          </a>
        </div>
      </footer>
    </article>
  );
}
