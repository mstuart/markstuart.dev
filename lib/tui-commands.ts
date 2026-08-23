// Command implementations for the /tui terminal. Every content command reads
// the same data the rest of the site renders, so the terminal never drifts
// from the pages. Hidden commands are real but deliberately absent from
// `help`, for people who poke around.

import { resumeRoles, resumeSummary, awards } from "@/lib/data/resume";
import { projects } from "@/lib/data/projects";
import { writing } from "@/lib/data/writing";
import { talks } from "@/lib/data/talks";
import { stackSections } from "@/lib/data/stack";
import { site } from "@/lib/data/site";

export interface CommandOutput {
  lines: string[];
  /** Navigate away from the terminal to a site route. */
  navigateTo?: string;
  clear?: boolean;
  toggleTheme?: boolean;
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

// Rendered from public/poster-cat-8bit.png, Mark's own pixel artwork.
const CAT = [
  ":::.............::-.............::",
  "::...........:-:........:--==--:.:",
  "::.......-=*%#:....-:..-===-====:.",
  "::.....-#@@@@*:....:...===:..-=+-.",
  "::....:@@@%#++=--==:-:.:==---===:.",
  ":.... =@@@%#%%%##@%=*=..:--==-:...",
  "::...-@@@@@@@@@%**+==:............",
  ":.:+%@@%**#@@%*+#*=:-*:...........",
  ".-%@@@@#**+*#+**+-+:..............",
  ".#@@@@@+*%*-+%*+..................",
  "::*@@@@++*#*:=::.................:",
  "=--@@@@#++#@=::-.................:",
  "==+@@@@#+*@@===-::..............::",
  "==+@@@@*+%@%=+-:---:-::::::::....:",
  "==*@@@@+=#@%+#=-=-----------------",
  "==*@@@@@*-=#*%-.----=====--=======",
  "==#@@@@@#*==+%#:-===-------=======",
  "==*@@@@@%#%##%=-:======--=========",
  "===+%@@@@@@@@@%+:-================",
];

const MONOGRAM = [
  "  ███▄ ▄███▓  ██████ ",
  " ▓██▒▀█▀ ██▒▒██    ▒ ",
  " ▓██    ▓██░░ ▓██▄   ",
  " ▒██    ▒██   ▒   ██▒",
  " ▒██▒   ░██▒▒██████▒▒",
];

const FORTUNES = [
  "The best platform work is invisible. Nobody thanks you for the outage that never happened.",
  "Every API is a promise you have to keep for a decade.",
  "If your paved road is slower than the dirt path, engineers will take the dirt path.",
  "Deprecation is the hardest feature to ship.",
  "The fastest code review is the one an agent already fixed.",
  "Ship the boring thing. Boring scales.",
  "A migration nobody notices is the highest form of engineering.",
];

function careerYears(): number {
  // Career started at State Farm, May 2007.
  const start = new Date("2007-05-01T00:00:00Z").getTime();
  return Math.floor((Date.now() - start) / (365.25 * 24 * 60 * 60 * 1000));
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
        resumeSummary,
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
  neofetch: {
    description: "System info",
    hidden: true,
    run: () => {
      const info = [
        `mark@markstuart.dev`,
        `-------------------`,
        `Role: Distinguished Engineer @ Rocket`,
        `Uptime: ${careerYears()} years in industry`,
        `Shell: zsh + oh-my-zsh`,
        `Editor: VS Code`,
        `Terminal: Ghostty`,
        `Agents: Codex, Claude Code`,
        `Lang: TypeScript, Node.js, GraphQL`,
        `Coffee: yes`,
      ];
      const height = Math.max(MONOGRAM.length, info.length);
      const lines: string[] = [];
      for (let i = 0; i < height; i++) {
        const left = (MONOGRAM[i] ?? "").padEnd(24);
        lines.push(`${left}${info[i] ?? ""}`);
      }
      return { lines };
    },
  },
  coffee: {
    description: "Brew something",
    hidden: true,
    run: () => ({
      lines: [...CAT, "", "  I drew this. It is also the wallpaper on the homepage.", ""],
    }),
  },
  nowplaying: {
    description: "What is playing right now",
    hidden: true,
    run: async () => {
      try {
        const res = await fetch("/api/spotify/now-playing");
        const data = (await res.json()) as {
          isPlaying?: boolean;
          name?: string;
          artist?: string;
          album?: string;
        };
        if (!data.isPlaying || !data.name) {
          return { lines: ["Nothing playing right now.", "'open listening' for the full history."] };
        }
        return {
          lines: [
            "NOW PLAYING",
            "",
            `  ${data.name}`,
            `  ${data.artist}`,
            data.album ? `  ${data.album}` : "",
          ].filter(Boolean),
        };
      } catch {
        return { lines: ["Could not reach Spotify."] };
      }
    },
  },
  uptime: {
    description: "Years in the industry",
    hidden: true,
    run: () => ({
      lines: [
        `up ${careerYears()} years, 3 companies, 1 very long checkout flow`,
      ],
    }),
  },
  fortune: {
    description: "A hard-won opinion",
    hidden: true,
    run: () => ({
      lines: ["", `  "${FORTUNES[Math.floor(Math.random() * FORTUNES.length)]}"`, ""],
    }),
  },
  theme: {
    description: "Toggle light and dark",
    hidden: true,
    run: () => ({ lines: ["Flipping the lights."], toggleTheme: true }),
  },
  sudo: {
    description: "Elevate privileges",
    hidden: true,
    run: () => ({
      lines: [
        "mark is not in the sudoers file. This incident has been reported.",
        "(It has not been reported. But I appreciate the ambition.)",
      ],
    }),
  },
  vim: {
    description: "Open vim",
    hidden: true,
    run: () => ({
      lines: [
        "You are already trapped in one terminal. I would not do this to you.",
        "Type 'exit' to leave. See? Easy.",
      ],
    }),
  },
  ls: {
    description: "List sections",
    hidden: true,
    run: () => ({
      lines: [
        "whoami.txt   work/        projects/    writing/",
        "talks/       stack/       contact.txt  listening/",
      ],
    }),
  },
  hello: {
    description: "Say hi",
    hidden: true,
    run: () => ({ lines: ["Hey! Type 'whoami' to start, or 'contact' to reach me for real."] }),
  },
  "42": {
    description: "The answer",
    hidden: true,
    run: () => ({
      lines: ["The answer to life, the universe, and whether to rewrite it in Rust."],
    }),
  },
};

export async function runCommand(input: string): Promise<CommandOutput> {
  const trimmed = input.trim();
  if (!trimmed) return { lines: [] };
  const [rawName, ...args] = trimmed.split(/\s+/);
  const name = rawName.toLowerCase();

  // A couple of joke inputs that are not real command names.
  if (name === "rm" && args.join(" ").includes("-rf")) {
    return {
      lines: [
        "rm: refusing to remove '/': it has my whole career on it",
        "Nice try though.",
      ],
    };
  }
  if (name === "hi") return COMMANDS.hello.run([]);
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
