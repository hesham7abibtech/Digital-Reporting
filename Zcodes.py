#!/usr/bin/env python3
"""
Zcodes - one-shot publisher.

Pipeline (all in THIS terminal - no new window is ever opened):
  1. [clean]  remove local build caches (.next / .vercel) so we publish clean versions
  2. [stage]  git add -A
  3. [commit] commit (if there are changes)
  4. [push]   push current branch -> `main` on BOTH repos:
        - origin  -> https://github.com/hesham7abibtech/Digital-Reporting.git          (user portal)
        - console -> https://github.com/hesham7abibtech/Digital-Reporting-Console.git   (admin console)

Usage (PowerShell / any terminal, from the repo root):
    python Zcodes.py                      # default timestamped commit message
    python Zcodes.py "feat: my message"   # custom commit message

Notes:
  * Run it from an OPEN terminal (`python Zcodes.py`) so output stays here.
    Don't double-click the file - that launches its own transient console window.
  * Every git step is echoed and its output streams live into this same terminal.
  * Needs git credentials with push access to both repos (run `gh auth login` on 403).
"""

import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

# ── Config ───────────────────────────────────────────────────────────
REPO_ROOT = Path(__file__).resolve().parent

REMOTES = {
    "origin":  "https://github.com/hesham7abibtech/Digital-Reporting.git",
    "console": "https://github.com/hesham7abibtech/Digital-Reporting-Console.git",
}
# Both projects deploy their PRODUCTION from `main`, so push HEAD -> main on each.
PUSH_TARGETS = {
    "origin":  "main",   # user-portal (rehdigital)
    "console": "main",   # admin console (digital-reporting-console)
}
# Local build caches wiped before publishing (all gitignored / regenerable).
CACHE_DIRS = [
    "apps/user-portal/.next",    "apps/user-portal/.vercel",
    "apps/console-portal/.next", "apps/console-portal/.vercel",
    ".next", ".vercel",
]


def log(msg: str) -> None:
    """Print immediately so our lines interleave correctly with git output."""
    print(msg, flush=True)


def git(*args, check=True, capture=False):
    """
    Run a git command in THIS terminal. capture=False (default) lets git write
    straight to the current stdout/stderr - no new console, fully live output.
    """
    log(f"  $ git {' '.join(args)}")
    return subprocess.run(
        ["git", *args],
        cwd=REPO_ROOT,
        check=check,
        text=True,
        capture_output=capture,
        # NOTE: no `creationflags`, no `shell=True`, no `start` - so Windows never
        # spawns a separate console window; it all runs inline here.
    )


def current_branch() -> str:
    return git("rev-parse", "--abbrev-ref", "HEAD", capture=True).stdout.strip()


def existing_remotes() -> set:
    return {r.strip() for r in git("remote", capture=True).stdout.splitlines() if r.strip()}


def clean_caches() -> None:
    """Remove local build caches so each publish starts from a clean version."""
    log("[clean] clearing build caches (.next / .vercel) for clean versions")
    for rel in CACHE_DIRS:
        path = REPO_ROOT / rel
        if path.exists():
            log(f"  - removing {rel}")
            shutil.rmtree(path, ignore_errors=True)
        else:
            log(f"  - skip {rel} (already clean)")


def ensure_remotes() -> None:
    have = existing_remotes()
    for name, url in REMOTES.items():
        if name not in have:
            log(f"[remote] adding '{name}' -> {url}")
            git("remote", "add", name, url)
        else:
            git("remote", "set-url", name, url)  # keep URL in sync


def has_staged_changes() -> bool:
    # exit code 1 == there ARE staged changes
    return git("diff", "--cached", "--quiet", check=False).returncode == 1


def main() -> int:
    msg = sys.argv[1] if len(sys.argv) > 1 else (
        f"chore: sync {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    log("=== Zcodes publisher ===")
    log(f"[branch] {current_branch()}")

    clean_caches()
    ensure_remotes()

    log("[stage] git add -A")
    git("add", "-A")

    if has_staged_changes():
        log(f"[commit] {msg}")
        git("commit", "-m", msg)
    else:
        log("[commit] nothing to commit - pushing existing HEAD")

    failures = []
    for name, target in PUSH_TARGETS.items():
        refspec = f"HEAD:{target}" if target else "HEAD"
        log(f"\n[push] {name} ({refspec})")
        if git("push", name, refspec, check=False).returncode != 0:
            failures.append(name)
            log(f"  !! push to '{name}' failed - check credentials / access (try `gh auth login`).")

    log("\n=== done ===")
    if failures:
        log(f"FAILED: {', '.join(failures)}")
        return 1
    log("Pushed clean versions to: " + ", ".join(PUSH_TARGETS))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
