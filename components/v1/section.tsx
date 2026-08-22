import type { ReactNode } from "react";
import styles from "@/components/v1/entrance.module.css";

export function SectionV1({
  heading,
  index,
  children,
}: {
  heading: string;
  index: number;
  children: ReactNode;
}) {
  return (
    <section className={styles.fadeUp} style={{ animationDelay: `${index * 80}ms` }}>
      <h2 className="text-sm font-medium text-zinc-400 dark:text-zinc-500">{heading}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
