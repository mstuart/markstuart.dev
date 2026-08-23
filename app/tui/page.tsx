import type { Metadata } from "next";
import { TuiTerminal } from "@/components/tui-terminal";

export const metadata: Metadata = {
  title: "Terminal",
  description: "A terminal interface to Mark Stuart's site.",
};

export default function TuiPage() {
  return <TuiTerminal />;
}
