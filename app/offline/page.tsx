import type { Metadata } from "next";
import { Container } from "@/components/ui";

export const metadata: Metadata = { title: "You are offline", robots: { index: false } };

export default function Offline() {
  return (
    <Container className="py-28 text-center">
      <h1 className="text-3xl font-semibold text-forest">You are offline</h1>
      <p className="mx-auto mt-3 max-w-md text-muted">Pages you have already visited may still open. Reconnect to browse the rest of Lake Bosomtwe.</p>
    </Container>
  );
}
