import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";

import { cn } from "~/lib/utils";

export type AccordionItem = {
  question: string;
  answer: string;
};

type AccordionProps = {
  items: readonly AccordionItem[];
  className?: string;
};

/**
 * Keyboard-accessible FAQ list built on native buttons and `aria-expanded`,
 * rather than `<details>`, so the open/close transition can be animated.
 */
export function Accordion({ items, className }: AccordionProps) {
  const baseId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <ul className={cn("divide-y divide-line", className)}>
      {items.map((item, index) => {
        const isOpen = openIndex === index;
        const panelId = `${baseId}-panel-${index}`;
        const buttonId = `${baseId}-button-${index}`;

        return (
          <li key={item.question}>
            <h3>
              <button
                type="button"
                id={buttonId}
                aria-expanded={isOpen}
                aria-controls={panelId}
                onClick={() => setOpenIndex(isOpen ? null : index)}
                className="flex w-full items-start justify-between gap-6 py-5 text-left"
              >
                <span className="text-lg font-semibold text-content">
                  {item.question}
                </span>
                <ChevronDown
                  aria-hidden="true"
                  className={cn(
                    "mt-1 h-5 w-5 shrink-0 text-content-brand transition-transform duration-300 ease-spring",
                    isOpen && "rotate-180",
                  )}
                />
              </button>
            </h3>
            <div
              id={panelId}
              role="region"
              aria-labelledby={buttonId}
              hidden={!isOpen}
              className="pb-6 pr-10"
            >
              <p className="leading-relaxed text-content-secondary">{item.answer}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
