import { useEffect, useState } from "react";

interface UseScrollSpyOptions {
  offset?: number;
}

export function useScrollSpy(
  sectionIds: string[],
  options: UseScrollSpyOptions = {}
) {
  const { offset = 100 } = options;
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    if (sectionIds.length === 0) {
      setActiveId(null);
      return;
    }

    const handleScroll = () => {
      if (window.scrollY < offset) {
        setActiveId(null);
        return;
      }

      const scrollPosition = window.scrollY + offset;

      for (const id of sectionIds) {
        const element = document.getElementById(id);
        if (!element) continue;
        const { offsetTop, offsetHeight } = element;
        if (scrollPosition >= offsetTop && scrollPosition < offsetTop + offsetHeight) {
          setActiveId(id);
          return;
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, [sectionIds, offset]);

  return activeId;
}
