// The hardware, apps, and tools Mark actually uses. Hardware entries omit
// health details and purchase history while retaining useful model specifics.

export type Platform = "macOS" | "iOS" | "Windows" | "Web" | "Physical";

// Display order for tag chips.
export const PLATFORM_ORDER: Platform[] = ["macOS", "iOS", "Windows", "Web", "Physical"];

export interface StackItem {
  name: string;
  description: string;
  url?: string;
  /** Phosphor icon name used for the generic item tile. */
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
        tags: ["Physical"],
      },
      {
        name: "LG UltraGear 45GX950A",
        description: '45" 5K2K OLED at 165Hz, or 330Hz in WFHD. The whole workspace on one panel.',
        url: "https://www.amazon.com/dp/B0DYG9DKX8?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "SHW Electric Standing Desk",
        description: '48" walnut top that goes up and down. Holding the whole setup since 2020.',
        url: "https://www.amazon.com/dp/B07MHVXHT7?tag=mstuartsite-20",
        icon: "Desk",
        tags: ["Physical"],
      },
      {
        name: "Keychron K2",
        description:
          "75% mechanical, Gateron Reds. Loud enough to be satisfying, quiet enough for calls.",
        url: "https://www.amazon.com/dp/B07QBPCGY2?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "Anker 7-in-2 USB-C Hub",
        description: "One cable connects the desk setup to power, display, and peripherals.",
        url: "https://www.amazon.com/dp/B0BNZ5V1TF?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "USB 3.0 KVM Switch",
        description: "4K at 60Hz across machines, so the big panel and one keyboard serve everything.",
        url: "https://www.amazon.com/dp/B0BWNDX4VL?tag=mstuartsite-20",
        icon: "Monitor",
        tags: ["Physical"],
      },
      {
        name: "Logitech Brio 4K",
        description: "The webcam on the monitor mount, for the calls that need a face.",
        url: "https://www.amazon.com/dp/B09NBWWP79?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "AirPods Pro 3",
        description: "Noise cancelling for focus blocks, and the only headphones I never forget.",
        url: "https://www.amazon.com/dp/B0FQFB8FMG?tag=mstuartsite-20",
        tags: ["Physical"],
      },
      {
        name: "Sennheiser HD 6XX",
        description: "Open-back headphones from Drop with replaceable ear pads.",
        url: "https://drop.com/buy/massdrop-sennheiser-hd6xx",
        tags: ["Physical"],
      },
      {
        name: "LUKETURE Under-Desk Organizer",
        description: "A clamp-on steel tray that keeps the laptop off the desktop.",
        url: "https://www.amazon.com/dp/B0C995H5S4?tag=mstuartsite-20",
        icon: "Tray",
        tags: ["Physical"],
      },
      {
        name: "UREVO Walking Pad",
        description: "A compact treadmill for slow walks under the standing desk.",
        url: "https://www.amazon.com/dp/B0BVQMSVM1?tag=mstuartsite-20",
        icon: "PersonSimpleWalk",
        tags: ["Physical"],
      },
    ],
  },
  {
    heading: "AI",
    items: [
      {
        name: "Codex",
        description: "A coding agent for building and reviewing software.",
        url: "https://openai.com/codex/",
        tags: ["macOS", "Web"],
      },
      {
        name: "Claude Code",
        description: "A coding assistant for development and review.",
        url: "https://claude.com/claude-code",
        tags: ["macOS", "Web"],
      },
      {
        name: "agent-browser",
        description: "Browser automation for testing web interfaces.",
        url: "https://github.com/vercel-labs/agent-browser",
        tags: ["macOS"],
      },
      {
        name: "LM Studio",
        description: "A desktop interface for local model experiments.",
        url: "https://lmstudio.ai/",
        tags: ["macOS", "Windows"],
      },
      {
        name: "Ollama",
        description: "Local models without a UI, for scripts and experiments.",
        url: "https://ollama.com/",
        tags: ["macOS", "Windows"],
      },
      {
        name: "Wispr Flow",
        description: "Voice dictation that keeps up with how fast I want to prompt.",
        url: "https://wisprflow.ai/",
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
        tags: ["macOS", "Windows", "Web"],
      },
      {
        name: "Ghostty",
        description: "A fast native terminal for development work.",
        url: "https://ghostty.org/",
        tags: ["macOS"],
      },
      {
        name: "zsh + Oh My Zsh",
        description: "A flexible shell with a practical set of developer tools.",
        url: "https://ohmyz.sh/",
        tags: ["macOS"],
      },
      {
        name: "tmux",
        description: "Sessions that survive whatever the terminal is doing.",
        url: "https://github.com/tmux/tmux",
        tags: ["macOS"],
      },
      {
        name: "lazygit",
        icon: "GitBranch",
        description: "A terminal interface for everyday Git workflows.",
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
        description: "A browser for development, testing, and everyday use.",
        url: "https://www.google.com/chrome/",
        tags: ["macOS", "Windows", "iOS"],
      },
      {
        name: "Slack",
        description: "Work happens here whether I like it or not.",
        url: "https://slack.com/",
        tags: ["macOS", "Windows", "iOS"],
      },
      {
        name: "Docker",
        description: "Local services and the odd reproduction case.",
        url: "https://www.docker.com/",
        tags: ["macOS", "Windows"],
      },
      {
        name: "Zoom",
        description: "Meetings, when Slack is not enough.",
        url: "https://zoom.us/",
        tags: ["macOS", "Windows", "iOS"],
      },
      {
        name: "Divvy",
        description: "Window management I set up a decade ago and never think about.",
        url: "https://mizage.com/divvy/",
        tags: ["macOS"],
      },
      {
        name: "Hidden Bar",
        description: "Keeps the menu bar from becoming a second dock.",
        url: "https://github.com/dwarvesf/hidden",
        tags: ["macOS"],
      },
      {
        name: "Pearcleaner",
        description: "Clean uninstalls when apps leave.",
        url: "https://github.com/alienator88/Pearcleaner",
        tags: ["macOS"],
      },
    ],
  },
];

export interface CliTool {
  name: string;
  url: string;
}

// A representative command-line kit, kept as a compact cloud.
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
