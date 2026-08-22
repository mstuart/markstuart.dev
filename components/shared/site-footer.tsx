import { Mrs_Saint_Delafield } from "next/font/google";
import { SocialLinks } from "@/components/shared/social-links";
import { site } from "@/lib/data/site";

// Signature-style script face for the footer sign-off. Swap for a real
// handwriting scan (SVG/PNG) any time by replacing the span below.
const signatureFont = Mrs_Saint_Delafield({
  weight: "400",
  subsets: ["latin"],
});

export function SiteFooter() {
  return (
    <footer>
      <div className="flex flex-col items-center px-6 pb-16 pt-6">
        <p
          className={`${signatureFont.className} mt-16 -rotate-2 text-5xl text-zinc-900 dark:text-zinc-100`}
        >
          {site.name}
        </p>
      </div>
      <div className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-6 py-10 text-sm text-zinc-500 dark:text-zinc-400 sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} {site.name}</p>
          <SocialLinks />
        </div>
      </div>
    </footer>
  );
}
