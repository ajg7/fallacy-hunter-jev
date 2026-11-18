import { createFileRoute } from "@tanstack/react-router";
import { Counter } from "@/components/Counter";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  return (
    <section className="space-y-6">
      <h1 className="text-4xl font-bold">Fallacy Hunter</h1>
      <Counter />
    </section>
  );
}
