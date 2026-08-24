# Contributor tooling

This repository carries a small set of agent skills so contributors and
automation can read the same provider-specific guidance without downloading
instructions during a task.

## Vendored skills

The `.agents/skills/` directories are vendored snapshots from the upstream
`resend/resend-skills` repository. `skills-lock.json` records each upstream
source, skill path, and content hash. Treat the lock and vendored directory as
one review unit:

- Do not hand-edit a vendored skill to make an unrelated application change.
- Review upstream changes before refreshing a snapshot.
- Update the content and lock hash together using the same trusted installer or
  documented upstream process that produced the current lock.
- Never place credentials, provider responses, subscriber information, or
  local machine paths in a vendored skill.

`CLAUDE.md` points Claude-compatible tools to the repository's `AGENTS.md`.
The `.claude/skills/` entries are relative symbolic links to the canonical
vendored directories under `.agents/skills/`; they are not duplicate copies.

## Cloning on Windows

Git can preserve symbolic links on Windows when Windows Developer Mode is
enabled, or when Git runs with permission to create links. Configure this
before cloning:

```powershell
git config --global core.symlinks true
git clone https://github.com/mstuart/markstuart.dev.git
```

Confirm that `.claude/skills/resend` is a symbolic link rather than a small
text file containing a relative path. Existing clones made with
`core.symlinks=false` may need a fresh checkout after enabling link support.

If symbolic links cannot be enabled, use the canonical `.agents/skills/`
directories directly in tooling that supports them. A local copy may be used
as an untracked fallback, but do not commit duplicated skill directories or
replace the repository links with machine-specific absolute paths.

## Planning artifacts

Local agent plans belong only in ignored planning directories. The executable
repository policy checks Git's tracked path list and fails if a Superpowers
plan, spec, implementation report, or similar artifact becomes tracked. Run
`npm run policy` before requesting review.
