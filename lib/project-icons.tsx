import {
  Bug,
  Cloud,
  Desk,
  GitBranch,
  Monitor,
  Database,
  Gauge,
  Graph,
  Package,
  PersonSimpleWalk,
  PlugsConnected,
  ShieldCheck,
  Stack,
  Terminal,
  Tray,
  Waveform,
} from "@phosphor-icons/react/dist/ssr";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";

/** Maps the icon name strings stored in project data to their Phosphor components. */
export const projectIconMap: Record<string, PhosphorIcon> = {
  Bug,
  Cloud,
  Desk,
  GitBranch,
  Monitor,
  Database,
  Gauge,
  Graph,
  Package,
  PersonSimpleWalk,
  PlugsConnected,
  ShieldCheck,
  Stack,
  Terminal,
  Tray,
  Waveform,
};

/** Resolves a project's icon name to a component, falling back to a generic package icon. */
export function getProjectIcon(name?: string): PhosphorIcon {
  return (name && projectIconMap[name]) || Package;
}
