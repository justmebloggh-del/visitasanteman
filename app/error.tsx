"use client";

import { Button, Container } from "@/components/ui";

export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <Container className="py-28 text-center">
      <h1 className="text-3xl font-semibold text-forest">Something went wrong</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">Please try again. If the problem continues, contact us.</p>
      <Button className="mt-6" onClick={reset}>Try again</Button>
    </Container>
  );
}
