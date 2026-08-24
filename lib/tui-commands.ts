// Command implementations for the /tui terminal. Every content command reads
// the same data the rest of the site renders, so the terminal never drifts
// from the pages. Hidden commands are real but deliberately absent from
// `help`, for people who poke around.

import { resumeRoles, awards } from "@/lib/data/resume";
import { projects } from "@/lib/data/projects";
import { writing } from "@/lib/data/writing";
import { talks } from "@/lib/data/talks";
import { stackSections } from "@/lib/data/stack";
import { site } from "@/lib/data/site";
import { CAT_ART } from "@/lib/tui-art";

export interface CommandOutput {
  lines: string[];
  /** Navigate away from the terminal to a site route. */
  navigateTo?: string;
  clear?: boolean;
  toggleTheme?: boolean;
  /** Rows of packed hex pixels rendered as half-block color art. */
  art?: string[];
}

interface Command {
  description: string;
  /** Kept out of `help` output. Still runnable. */
  hidden?: boolean;
  usage?: string;
  run: (args: string[]) => CommandOutput | Promise<CommandOutput>;
}

function year(date: string): string {
  return date.slice(0, 4);
}

export const COMMANDS: Record<string, Command> = {
  help: {
    description: "List available commands",
    run: () => ({
      lines: [
        "Available commands:",
        "",
        ...Object.entries(COMMANDS)
          .filter(([, cmd]) => !cmd.hidden)
          .map(([name, cmd]) => `  ${name.padEnd(12)}${cmd.description}`),
        "",
        "Tab completes, up/down recalls history.",
        "There are a few commands not on this list. Poke around.",
      ],
    }),
  },
  whoami: {
    description: "Who I am, and what I have been given for it",
    run: () => ({
      lines: [
        site.name,
        "",
        "Distinguished Engineer at Rocket. Before that PayPal and eBay. Nearly two decades turning fragmented platforms into ones that scale.",
        "",
        "AWARDS",
        ...awards.map((a) => `  ${a}`),
        "",
        "Try 'work' for the full history, or 'exit' to leave the terminal.",
      ],
    }),
  },
  work: {
    description: "Career history",
    run: () => ({
      lines: [
        "EXPERIENCE",
        "",
        ...resumeRoles.flatMap((role) => [
          `  ${year(role.start)}-${role.end === "Present" ? "now " : year(role.end)}  ${role.title} at ${role.company}`,
          `            ${role.short}`,
          "",
        ]),
      ],
    }),
  },
  projects: {
    description: "Open source work",
    run: () => {
      const authored = projects.filter((p) => p.role === "author");
      const core = projects.filter((p) => p.role === "core contributor");
      const stars = core.reduce((sum, p) => sum + p.stars, 0);
      return {
        lines: [
          "BUILDING",
          "",
          ...authored.map((p) => `  ${p.name.padEnd(24)}${p.description}`),
          "",
          "CORE CONTRIBUTIONS",
          "",
          ...core.map((p) => `  ${p.name.padEnd(24)}${p.stars.toLocaleString()} stars`),
          "",
          `  ${stars.toLocaleString()} stars across projects I helped build.`,
        ],
      };
    },
  },
  writing: {
    description: "Published posts",
    run: () => {
      const views = writing.reduce((sum, w) => sum + (w.views ?? 0), 0);
      return {
        lines: [
          "WRITING",
          "",
          ...writing.map(
            (w) =>
              `  ${year(w.date)}  ${w.title}${w.views ? `  (${Math.round(w.views / 1000)}K views)` : ""}`
          ),
          "",
          `  ~${Math.floor(views / 10000) * 10}K reads total.`,
        ],
      };
    },
  },
  talks: {
    description: "Conference talks",
    run: () => ({
      lines: [
        "TALKS",
        "",
        ...talks.map((t) => `  ${year(t.date)}  ${t.title}`),
        "",
        "  'open talks' for appearances and community panels.",
      ],
    }),
  },
  stack: {
    description: "Tools I use",
    run: () => ({
      lines: [
        "STACK",
        "",
        ...stackSections.flatMap((section) => [
          section.heading.toUpperCase(),
          ...section.items.map((i) => `  ${i.name.padEnd(24)}${i.description}`),
          "",
        ]),
      ],
    }),
  },
  contact: {
    description: "How to reach me",
    run: () => ({
      lines: ["CONTACT", "", ...site.social.map((s) => `  ${s.name.padEnd(12)}${s.href}`)],
    }),
  },
  open: {
    description: "Open a page on the site",
    usage: "open <home|work|writing|projects|press|talks|listening|stack>",
    run: (args) => {
      const routes: Record<string, string> = {
        home: "/",
        work: "/work",
        writing: "/posts",
        posts: "/posts",
        projects: "/projects",
        press: "/press",
        talks: "/talks",
        listening: "/listening",
        stack: "/stack",
      };
      const target = args[0]?.toLowerCase();
      if (!target) {
        return { lines: ["usage: open <page>", `pages: ${Object.keys(routes).join(", ")}`] };
      }
      const route = routes[target];
      if (!route) return { lines: [`no such page: ${target}`] };
      return { lines: [`Opening /${target}...`], navigateTo: route };
    },
  },
  clear: {
    description: "Clear the screen",
    run: () => ({ lines: [], clear: true }),
  },
  exit: {
    description: "Return to the website",
    run: () => ({ lines: ["Exiting terminal..."], navigateTo: "/" }),
  },

  // ---- hidden ----
  coffee: {
    description: "Brew something",
    hidden: true,
    run: () => ({
      lines: ["", "  I drew this. It is also the wallpaper on the homepage.", ""],
      art: CAT_ART,
    }),
  },
  nowplaying: {
    description: "Listening privacy",
    hidden: true,
    run: () => ({
      lines: [
        "Live listening status is private.",
        "'open listening' for recent history grouped by week.",
      ],
    }),
  },
  theme: {
    description: "Toggle light and dark",
    hidden: true,
    run: () => ({ lines: ["Flipping the lights."], toggleTheme: true }),
  },
  graphql: {
    description: "Query me like an API",
    hidden: true,
    run: () => {
      const core = projects.filter((p) => p.role === "core contributor");
      const stars = core.reduce((sum, p) => sum + p.stars, 0);
      const current = resumeRoles[0];
      const payload = {
        data: {
          me: {
            name: site.name,
            role: current.title,
            company: current.company,
            since: current.start,
            openSource: { repos: projects.length, stars },
            writing: { posts: writing.length },
          },
        },
      };
      return {
        lines: [
          "query { me { name role company since openSource writing } }",
          "",
          ...JSON.stringify(payload, null, 2).split("\n").map((l) => `  ${l}`),
          "",
          "  I brought GraphQL to PayPal in 2018. It seemed rude not to offer one.",
        ],
      };
    },
  },
  "git": {
    description: "Career history, as commits",
    hidden: true,
    usage: "git log",
    run: (args) => {
      if (args[0] && args[0] !== "log") {
        return { lines: [`git: '${args[0]}' is not something I implemented. Try 'git log'.`] };
      }
      // Stable pseudo-hashes derived from the role, so output never churns.
      function hash(input: string): string {
        let h = 0;
        for (const ch of input) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
        return h.toString(16).padStart(7, "0").slice(0, 7);
      }
      return {
        lines: resumeRoles.flatMap((role) => [
          `commit ${hash(role.company + role.title)}`,
          `Author: ${site.name} <hi@markstuart.dev>`,
          `Date:   ${role.start}`,
          "",
          `    ${role.title} at ${role.company}`,
          `    ${role.short}`,
          "",
        ]),
      };
    },
  },
  deploy: {
    description: "Ship something",
    hidden: true,
    run: () => ({
      lines: [
        "Building...            done",
        "Running checks...      done",
        "Uploading...           done",
        "Deployed to production in 18s.",
        "",
        "  At Rocket I taught the agents to ship.",
        "  This one I shipped myself.",
      ],
    }),
  },
};

export async function runCommand(input: string): Promise<CommandOutput> {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };
  const [rawName, ...args] = trimmed.split(/\s+/);
  const name = rawName.toLowerCase();

  if (name === "about") return COMMANDS.whoami.run([]);
  if (name === "cd") return COMMANDS.open.run(args);

  const command = COMMANDS[name];
  if (!command) {
    return {
      lines: [`command not found: ${name}`, "Type 'help' for available commands."],
    };
  }
  return command.run(args);
}

export const COMMAND_NAMES = Object.keys(COMMANDS);
