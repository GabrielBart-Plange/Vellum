import Hero from "@/components/home/Hero";
import StoriesSection from "@/components/home/StoriesSection";
import NovelsSection from "@/components/home/NovelsSection";

export default function HomePage() {
  return (
    <main className="bg-black text-gray-200">
      <Hero />
      <StoriesSection />
      <NovelsSection />
    </main>
  );
}
