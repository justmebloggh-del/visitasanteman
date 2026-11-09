import { ButtonLink, Container } from "@/components/ui";

export default function NotFound() {
  return (
    <Container className="py-28 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-gold">404</p>
      <h1 className="mt-2 text-4xl font-semibold text-forest">We could not find that page</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">It may have moved, or it may not be published yet.</p>
      <div className="mt-6 flex justify-center gap-3"><ButtonLink href="/">Back home</ButtonLink><ButtonLink href="/attractions" variant="outline">Browse attractions</ButtonLink></div>
    </Container>
  );
}
