import { createFileRoute } from "@tanstack/react-router";
import signatureAsset from "@/assets/signature.jpg.asset.json";

export const Route = createFileRoute("/_authenticated/about")({
  component: AboutPage,
  head: () => ({
    meta: [
      { title: "About — Cognitive OS" },
      {
        name: "description",
        content:
          "Notes from Musfira Amjad — molecular biology, behavioral neuroscience, and civil litigation. The space between systems and people.",
      },
    ],
  }),
});

const IMG_PORTRAIT =
  "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F163f23ce-6e2e-4936-a181-71a6ab769b4e_885x787.jpeg";
const IMG_DESK =
  "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fe1072df6-26a6-46c3-b2dc-665ed1e91cb2_1080x720.jpeg";
const IMG_BOOKS =
  "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F6317c4e3-7564-4af3-855a-d89507c161fc_695x657.jpeg";
const IMG_CIRCLE =
  "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2Fdbd90b81-fd91-4282-89bd-ccd6da150946_736x736.jpeg";

function Figure({ src, alt }: { src: string; alt: string }) {
  return (
    <figure className="my-10">
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className="w-full h-auto rounded-sm border border-border shadow-sm"
      />
    </figure>
  );
}

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
          Hi! I'm Musfira.
        </h1>
        <p
          className="mt-4 text-muted-foreground italic"
          style={{ fontFamily: "var(--font-serif)", fontSize: "18px" }}
        >
          So, clearly, I loved science enough to do it twice. I love a good argument more.
          <span className="not-italic"> (Yes, these facts are related.)</span>
        </p>
      </header>

      <Figure src={IMG_PORTRAIT} alt="Musfira" />

      <div
        className="space-y-6 text-foreground"
        style={{ fontFamily: "var(--font-serif)", fontSize: "18px", lineHeight: 1.7 }}
      >
        <p>
          <em>Molecular biology. Behavioral neuroscience.</em> Years spent learning how to look at
          something broken and ask why, <em>precisely</em>, it broke. I liked the rigor of it. I
          liked the quiet arrogance of believing the truth was discoverable if you were disciplined
          enough to chase it. I was good at it. I was also, it turns out,{" "}
          <em>deeply annoying at dinner parties. Shocker!</em>
        </p>

        <Figure src={IMG_DESK} alt="Desk" />

        <p>
          Somewhere in another universe I am wearing a white coat and saying things like{" "}
          <em>"statistically significant"</em> with alarming sincerity. In this one, I accidentally
          fell in love with litigation.
        </p>

        <p>
          I walked into a law firm and something clicked hard enough that I still cannot fully
          explain it. Civil litigation is not what people think it is. It is rarely dramatic. Mostly
          it is attention. Pattern recognition. Reading a case file the same way you read a lab
          report:{" "}
          <em>
            looking for omitted variables, inconsistencies, narrative distortions, the exact moment
            the story stops making sense.
          </em>
        </p>

        <p className="italic text-muted-foreground">
          The main difference is that lab reports do not cry on you. Depositions are just very
          expensive experiments with worse coffee.
        </p>

        <Figure src={IMG_BOOKS} alt="Books" />

        <p>
          I work in law now — or as most people would say:{" "}
          <em>
            a person constitutionally incapable of letting a bad argument sit peacefully in the room
            without doing something about it.
          </em>{" "}
          This is professionally useful and <em>personally exhausting.</em>
        </p>

        <blockquote
          className="border-l-2 border-accent-foreground pl-6 my-10 text-foreground"
          style={{ fontFamily: "var(--font-serif)", fontSize: "22px", lineHeight: 1.5 }}
        >
          What keeps me writing is the distance between systems and people.
        </blockquote>

        <p>
          The law promises objectivity while being practiced by profoundly subjective human beings.
          Medicine does this too. Every institution eventually runs into the same problem: people
          are emotionally complex in ways systems hate accounting for. A client trying to compress
          the worst year of their life into a chronology. A physician documenting symptoms while
          missing the person attached to them. Rules written in the abstract, then handed to lives
          that are anything but.
        </p>

        <p>
          That gap fascinates me. It is where most of the interesting questions live — and where
          most of the comfortable answers go to die.
        </p>

        <p>
          Martin Schwartz once described science as <em>productive stupidity.</em> The uncomfortable
          experience of standing directly at the edge of your own understanding and staying there
          long enough to learn something. The older I get, the less intelligence seems connected to
          certainty. Real intelligence, to me, looks more like curiosity with endurance and a high
          tolerance for being wrong in public.
        </p>

        <p>
          Most of my writing starts there. Somewhere between ambition and meaning. Between ethics
          and performance. Between wanting to understand people and realizing people do not
          particularly enjoy being understood.
        </p>

        <Figure src={IMG_CIRCLE} alt="Circle" />

        <p className="text-center text-foreground" style={{ fontSize: "20px" }}>
          <em>The law matters. The person in front of you matters more.</em>
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
        <p
          className="text-foreground"
          style={{ fontFamily: "var(--font-script)", fontSize: "38px" }}
        >
          Musfira
        </p>
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
