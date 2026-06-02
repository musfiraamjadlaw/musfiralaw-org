import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/about")({
  beforeLoad: () => {
    throw redirect({ to: "/colophon" });
  },
});
