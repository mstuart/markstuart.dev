// A representative selection of tools and workspace categories. This is a
// public toolkit, not an inventory of a particular machine or account.

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
        name: "Laptop",
        description: "A portable workstation for software development and design.",
        url: "https://www.apple.com/macbook-pro/",
        iconSrc: "/stack/apple.png",
        tags: ["Physical"],
      },
      {
        name: "Ultrawide display",
        description: "A wide canvas for code, documentation, and design work.",
        url: "https://www.lg.com/us/monitors",
        iconSrc: "/stack/lg.png",
        tags: ["Physical"],
      },
      {
        name: "Mechanical keyboard",
        iconSrc: "/stack/keychron.png",
        description: "A compact keyboard for writing and development.",
        url: "https://www.keychron.com/",
        tags: ["Physical"],
      },
      {
        name: "Headphones",
        iconSrc: "/stack/airpods.png",
        description: "Focused listening for calls and deep work.",
        url: "https://www.apple.com/airpods/",
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
        iconSrc: "/stack/claude.png",
        tags: ["macOS", "Web"],
      },
      {
        name: "agent-browser",
        iconSrc: "/stack/agentbrowser.png",
        description: "Browser automation for testing web interfaces.",
        url: "https://github.com/vercel-labs/agent-browser",
        tags: ["macOS"],
      },
      {
        name: "LM Studio",
        description: "A desktop interface for local model experiments.",
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
        description: "A fast native terminal for development work.",
        url: "https://ghostty.org/",
        iconSrc: "/stack/ghostty.png",
        tags: ["macOS"],
      },
      {
        name: "zsh + Oh My Zsh",
        iconSrc: "/stack/ohmyzsh.png",
        description: "A flexible shell with a practical set of developer tools.",
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
        iconSrc: "/stack/chrome.png",
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
