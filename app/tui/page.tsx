import { TuiTerminal } from "@/components/tui-terminal";
import { pageMetadata } from "@/lib/metadata";

export const metadata = {
  ...pageMetadata({
    title: "Terminal",
    description: "A terminal interface to Mark Stuart's site.",
    path: "/",
  }),
  robots: { index: false, follow: true },
};

export default function TuiPage() {
  return <TuiTerminal />;
}
