import { createFileRoute } from "@tanstack/react-router";
import { Header, Footer } from "@/components/site/Chrome";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About — Sheetal" },
      {
        name: "description",
        content: "Sheetal is a small studio shop of considered objects for daily use.",
      },
      { property: "og:title", content: "About — Sheetal" },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: About,
});

function About() {
  return (
    <div className="min-h-screen">
      <Header />
      <article className="mx-auto max-w-3xl px-6 py-24">
        <div className="text-xs uppercase tracking-[0.2em] text-muted-foreground">About</div>
        <h1 className="mt-4 font-display text-5xl md:text-6xl">A small studio, slowly built.</h1>
        <div className="mt-12 space-y-6 text-base leading-relaxed text-muted-foreground">
          <p>
            Sheetal is an independent studio that develops and sells a tight collection of everyday
            objects — apparel, accessories, and home goods made with natural materials and
            considered details.
          </p>
          <p>
            We work directly with small workshops who care about quality and provenance. Every piece
            is made in small runs and refined over multiple seasons before it reaches the shop.
          </p>
          <p>
            We believe in fewer, better things — objects you reach for daily and keep for years.
          </p>
        </div>
      </article>
      <Footer />
    </div>
  );
}
