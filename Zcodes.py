#!/usr/bin/env python3
"""
Zcodes — one-shot publisher.

Stages everything, commits (if there are changes), and pushes the current branch
to BOTH GitHub repos:

  • origin  → https://github.com/hesham7abibtech/Digital-Reporting.git          (current branch)
  • console → https://github.com/hesham7abibtech/Digital-Reporting-Console.git   (current branch → main)

Usage (PowerShell, from the repo root):
    python Zcodes.py                      # default timestamped commit message
    python Zcodes.py "feat: my message"   # custom commit message

Remotes are created automatically if missing. Requires git credentials with push
access to both repos (run `gh auth login` first if you get a 403).
"""

import subprocess
import sys
from datetime import datetime

# ── Config ───────────────────────────────────────────────────────────
REMOTES = {
    "origin":  "https://github.com/hesham7abibtech/Digital-Reporting.git",
    "console": "https://github.com/hesham7abibtech/Digital-Reporting-Console.git",
}
# Branch each remote receives: HEAD (current branch) → <target>.
# console's production branch is `main`.
PUSH_TARGETS = {
    "origin":  None,    # None → push current branch as-is
    "console": "main",  # push current branch into the remote's `main`
}


def git(*args, check=True, capture=False):
    """Run a git command, echoing it. Returns CompletedProcess."""
    print(f"  $ git {' '.join(args)}")
    return subprocess.run(
        ["git", *args],
        check=check,
        text=True,
        capture_output=capture,
    )


def current_branch() -> str:
    return git("rev-parse", "--abbrev-ref", "HEAD", capture=True).stdout.strip()


def existing_remotes() -> set:
    out = git("remote", capture=True).stdout
    return {r.strip() for r in out.splitlines() if r.strip()}


def ensure_remotes():
    have = existing_remotes()
    for name, url in REMOTES.items():
        if name not in have:
            print(f"[remote] adding '{name}' -> {url}")
            git("remote", "add", name, url)
        else:
            # keep the URL in sync in case it changed
            git("remote", "set-url", name, REMOTES[name])


def has_staged_changes() -> bool:
    # exit code 1 == there ARE staged changes
    return git("diff", "--cached", "--quiet", check=False).returncode == 1


def main() -> int:
    msg = sys.argv[1] if len(sys.argv) > 1 else (
        f"chore: sync {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
    )

    print("=== Zcodes publisher ===")
    branch = current_branch()
    print(f"[branch] {branch}")

    ensure_remotes()

    print("[stage] git add -A")
    git("add", "-A")

    if has_staged_changes():
        print(f"[commit] {msg}")
        git("commit", "-m", msg)
    else:
        print("[commit] nothing to commit — pushing existing HEAD")

    failures = []
    for name, target in PUSH_TARGETS.items():
        refspec = f"HEAD:{target}" if target else "HEAD"
        print(f"\n[push] {name} ({refspec})")
        result = git("push", name, refspec, check=False)
        if result.returncode != 0:
            failures.append(name)
            print(f"  !! push to '{name}' failed (exit {result.returncode})")

    print("\n=== done ===")
    if failures:
        print(f"FAILED: {', '.join(failures)} — check credentials / access (try `gh auth login`).")
        return 1
    print("Pushed to: " + ", ".join(PUSH_TARGETS))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
