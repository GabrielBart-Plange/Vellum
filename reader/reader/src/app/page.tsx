import Hero from "@/components/home/Hero";
import StoriesSection from "@/components/home/StoriesSection";
import NovelsSection from "@/components/home/NovelsSection";
import GenreGrid from "@/components/home/GenreGrid";

export default function HomePage() {
  return (
    <main>
      <Hero />
      <GenreGrid />
      <StoriesSection />
      <NovelsSection />
    </main>
  );
}
