import { Button } from "@/app/Button";

export default function DeliveryInductionTask({ onLearnDelivery }: { onLearnDelivery: () => void }) {
  return (
    <article data-kind="induction" className="space-y-3 rounded-2xl bg-white p-4 text-center text-2xl shadow">
      <p>Now that you&rsquo;ve made some connections, you&rsquo;re ready to...</p>
      <Button onClick={onLearnDelivery}>learn about duck delivery!</Button>
    </article>
  );
}
