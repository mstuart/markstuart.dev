// The hardware, apps, and tools actually in use on Mark's machine, curated
// from a live inventory of this Mac (2026-08). Icons under /public/stack are
// extracted from the installed app bundles themselves. Tags mark the
// platforms each item runs on.

export type Platform = "macOS" | "iOS" | "Windows" | "Web" | "Physical";

// Display order for tag chips.
export const PLATFORM_ORDER: Platform[] = ["macOS", "iOS", "Windows", "Web", "Physical"];

export interface StackItem {
  name: string;
  description: string;
  url?: string;
  /** Path under /public for a real app or brand icon tile. */
  iconSrc?: string;
  /** Phosphor icon name, used when the item has no brand logo. */
  icon?: string;
  tags: Platform[];
}

export interface StackSection {
  heading: string;
  items: StackItem[];
}

export const stackSections: StackSection[] = [
  {
    heading: "Hardware",
    items: [
      {
        name: 'MacBook Pro 14"',
        description: "M4 Max, 36 GB RAM. One machine for everything.",
        url: "https://www.amazon.com/dp/B0DMKZSTQH?tag=mstuartsite-20",
        iconSrc: "/stack/apple.png",
        tags: ["Physical"],
      },
      {
        name: "LG UltraGear 45GX950A",
        description: '45" 5K2K OLED at 330Hz. The whole workspace on one panel.',
        url: "https://www.amazon.com/dp/B0DYG9DKX8?tag=mstuartsite-20",
        iconSrc: "/stack/lg.png",
        tags: ["Physical"],
      },
      {
        name: "SHW Electric Standing Desk",
        icon: "Desk",
        description: '48" walnut top that goes up and down. Holding the whole setup since 2020.',
        url: "https://www.amazon.com/dp/B07MHVXHT7?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "Keychron K2",
        iconSrc: "/stack/keychron.png",
        description: "75% mechanical, Gateron Reds. Loud enough to be satisfying, quiet enough for calls.",
        url: "https://www.amazon.com/dp/B07QBPCGY2?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "Anker 7-in-2 USB-C Hub",
        iconSrc: "/stack/anker.png",
        description: "One cable to the desk. I have bought this three times, which tells you how it goes.",
        url: "https://www.amazon.com/dp/B0BNZ5V1TF?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "USB 3.0 KVM Switch",
        icon: "Monitor",
        description: "4K at 60Hz across machines, so the big panel and one keyboard serve everything.",
        url: "https://www.amazon.com/dp/B0BWNDX4VL?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "Logitech Brio 4K",
        iconSrc: "/stack/logitech.png",
        description: "The webcam on the monitor mount, for the calls that need a face.",
        url: "https://www.amazon.com/dp/B09NBWWP79?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "AirPods Pro 3",
        iconSrc: "/stack/airpods.png",
        description: "Noise cancelling for focus blocks, and the only headphones I never forget.",
        url: "https://www.amazon.com/dp/B0FQFB8FMG?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "Sennheiser HD 6XX",
        iconSrc: "/stack/sennheiser.png",
        description: "Open-back cans from Drop, already on their second set of ear pads.",
        url: "https://www.amazon.com/dp/B00018MSNI?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "LUKETURE Under-Desk Organizer",
        icon: "Tray",
        description: "Clamp-on steel tray that gets the laptop off the desk. Bought twice, once per desk edge.",
        url: "https://www.amazon.com/dp/B0C995H5S4?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "Fitbit Air",
        iconSrc: "/stack/fitbit.png",
        description: "Feeds the health data my vitals project archives through the Google Health API.",
        url: "https://www.amazon.com/dp/B0GTMTZF3V?tag=mstuartsite-20",
        tags: ["Physical"],
      },
    ],
  },
  {
    heading: "AI",
    items: [
      {
        name: "Codex",
        description: "Agentic coding CLI, and where I spend most of my time.",
        url: "https://openai.com/codex/",
        iconSrc: "/stack/chatgpt.png",
        tags: ["macOS", "Web"],
      },
      {
        name: "Claude Code",
        description: "Second agentic coding CLI, for cross-checking agents against each other.",
        url: "https://claude.com/claude-code",
        iconSrc: "/stack/claude.png",
        tags: ["macOS", "Web"],
      },
      {
        name: "agent-browser",
        iconSrc: "/stack/agentbrowser.png",
        description: "Browser automation CLI my agents use to see and click what they build.",
        url: "https://github.com/vercel-labs/agent-browser",
        tags: ["macOS"],
      },
      {
        name: "LM Studio",
        description: "Local models with a UI; the lms CLI is wired into my shell.",
        url: "https://lmstudio.ai/",
        iconSrc: "/stack/lmstudio.png",
        tags: ["macOS", "Windows"],
      },
      {
        name: "Ollama",
        iconSrc: "/stack/ollama.png",
        description: "Local models without a UI, for scripts and experiments.",
        url: "https://ollama.com/",
        tags: ["macOS", "Windows"],
      },
      {
        name: "Wispr Flow",
        description: "Voice dictation that keeps up with how fast I want to prompt.",
        url: "https://wisprflow.ai/",
        iconSrc: "/stack/wisprflow.png",
        tags: ["macOS", "Windows", "iOS"],
      },
    ],
  },
  {
    heading: "Editor and terminal",
    items: [
      {
        name: "VS Code",
        description: "Editor for the code I still read and write by hand.",
        url: "https://code.visualstudio.com/",
        iconSrc: "/stack/vscode.png",
        tags: ["macOS", "Windows", "Web"],
      },
      {
        name: "Ghostty",
        description: "Terminal. Fast, native, and where the agents live.",
        url: "https://ghostty.org/",
        iconSrc: "/stack/ghostty.png",
        tags: ["macOS"],
      },
      {
        name: "zsh + Oh My Zsh",
        iconSrc: "/stack/ohmyzsh.png",
        description: "Stock-ish shell: eza over ls, bat over cat, fd over find, difftastic for diffs.",
        url: "https://ohmyz.sh/",
        tags: ["macOS"],
      },
      {
        name: "tmux",
        iconSrc: "/stack/tmux.png",
        description: "Sessions that survive whatever the terminal is doing.",
        url: "https://github.com/tmux/tmux",
        tags: ["macOS"],
      },
      {
        name: "lazygit",
        icon: "GitBranch",
        description: "Git UI in the terminal, aliased to lg.",
        url: "https://github.com/jesseduffield/lazygit",
        tags: ["macOS"],
      },
    ],
  },
  {
    heading: "Apps",
    items: [
      {
        name: "Google Chrome",
        description: "Primary browser, plus the tab my agents drive.",
        url: "https://www.google.com/chrome/",
        iconSrc: "/stack/chrome.png",
        tags: ["macOS", "Windows", "iOS"],
      },
      {
        name: "1Password",
        description: "Every secret lives here and nowhere else.",
        url: "https://1password.com/",
        iconSrc: "/stack/1password.png",
        tags: ["macOS", "Windows", "iOS"],
      },
      {
        name: "Slack",
        description: "Work happens here whether I like it or not.",
        url: "https://slack.com/",
        iconSrc: "/stack/slack.png",
        tags: ["macOS", "Windows", "iOS"],
      },
      {
        name: "Docker",
        description: "Local services and the odd reproduction case.",
        url: "https://www.docker.com/",
        iconSrc: "/stack/docker.png",
        tags: ["macOS", "Windows"],
      },
      {
        name: "Zoom",
        description: "Meetings, when Slack is not enough.",
        url: "https://zoom.us/",
        iconSrc: "/stack/zoom.png",
        tags: ["macOS", "Windows", "iOS"],
      },
      {
        name: "Divvy",
        description: "Window management I set up a decade ago and never think about.",
        url: "https://mizage.com/divvy/",
        iconSrc: "/stack/divvy.png",
        tags: ["macOS"],
      },
      {
        name: "Amphetamine",
        description: "Keeps the Mac awake while long agent runs finish.",
        url: "https://apps.apple.com/us/app/amphetamine/id937984704",
        iconSrc: "/stack/amphetamine.png",
        tags: ["macOS"],
      },
      {
        name: "RepoBar",
        description: "Repo and PR status in the menu bar, across all my worktrees.",
        url: "https://repobar.app/",
        iconSrc: "/stack/repobar.png",
        tags: ["macOS"],
      },
      {
        name: "Hidden Bar",
        description: "Keeps the menu bar from becoming a second dock.",
        url: "https://github.com/dwarvesf/hidden",
        iconSrc: "/stack/hiddenbar.png",
        tags: ["macOS"],
      },
      {
        name: "Pearcleaner",
        description: "Clean uninstalls when apps leave.",
        url: "https://github.com/alienator88/Pearcleaner",
        iconSrc: "/stack/pearcleaner.png",
        tags: ["macOS"],
      },
    ],
  },
];

export interface CliTool {
  name: string;
  url: string;
}

// The command line kit, kept as a compact cloud. All installed via Homebrew.
export const cliTools: CliTool[] = [
  { name: "gh", url: "https://cli.github.com/" },
  { name: "ripgrep", url: "https://github.com/BurntSushi/ripgrep" },
  { name: "fzf", url: "https://github.com/junegunn/fzf" },
  { name: "zoxide", url: "https://github.com/ajeetdsouza/zoxide" },
  { name: "eza", url: "https://github.com/eza-community/eza" },
  { name: "bat", url: "https://github.com/sharkdp/bat" },
  { name: "fd", url: "https://github.com/sharkdp/fd" },
  { name: "difftastic", url: "https://github.com/Wilfred/difftastic" },
  { name: "hyperfine", url: "https://github.com/sharkdp/hyperfine" },
  { name: "just", url: "https://github.com/casey/just" },
  { name: "watchexec", url: "https://github.com/watchexec/watchexec" },
  { name: "direnv", url: "https://direnv.net/" },
  { name: "uv", url: "https://github.com/astral-sh/uv" },
  { name: "pnpm", url: "https://pnpm.io/" },
];
