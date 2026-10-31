Build ticket #{{ISSUE}} ({{ISSUE_TITLE}}) in {{REPO}}.

## This session is AFK

Nobody is watching and there is no human to ask. The fleet engine already claimed the ticket for you, and you are on branch `{{BRANCH}}`. **A human merges, not you.** You stop once your PR is open with green CI; the engine then hands it to review.

**This is a headless session: your turn ending is the session ending.** Nothing will wake you up later. So:

- Run every command in the foreground and wait for it, however long (the full check suite, `gh pr checks --watch`). Never background a command and plan to "come back once it's green".
- Don't stop to report progress or ask a question. Keep going until your PR is green, or you are blocked and have commented on the ticket.

**The branch may already hold work.** An earlier session on this ticket may have stopped midway. Start with `git status` and `git log origin/{{DEFAULT_BRANCH}}..HEAD`, and continue from what is there instead of starting over.

CONTEXT.md, when the repo has one, is the settled design: read it first and don't re-litigate it. Never read or print any `.env` file.

1. **Read the ticket**: `gh issue view {{ISSUE}} --comments`. If it is a child of a wayfinder map (a `wayfinder:map` parent issue), call the Skill tool with `mattpocock-skills:wayfinder` and follow the map's Notes, except for delivery, which follows this prompt: don't edit the map body or close the ticket, since other agents work the same map in parallel.
2. **Build** exactly what the ticket asks, with the skills it or its map names (`tdd`, `domain-modeling`, `codebase-design`, …). Commit on `{{BRANCH}}`. When the pre-commit hook fails, fix what it reports and commit again, never `--no-verify`.
3. **Test your change**: run the tests you added or changed, plus any you think your change could affect. Run single files or filtered tests, never the whole suite: CI runs everything. Fix every failure.
4. **Catch up**: `git fetch origin {{DEFAULT_BRANCH}} && git rebase origin/{{DEFAULT_BRANCH}}`. Resolve conflicts (Skill tool: `mattpocock-skills:resolving-merge-conflicts`), and rerun tests only for files where you resolved a conflict.
5. **Open the PR**: `git push --force-with-lease -u origin {{BRANCH}}`, then `gh pr create --base {{DEFAULT_BRANCH}}` with the ticket title and this body:

   ```markdown
   <summary of what changed>

   Closes #{{ISSUE}}

   <!-- map-pointer -->
   - [{{ISSUE_TITLE}}](https://github.com/{{REPO}}/issues/{{ISSUE}}): merged in #<this PR> — <one-line gist, in the style of the map's Decisions so far>

   🤖 Generated with [Claude Code](https://claude.com/claude-code)
   ```

   Keep the `map-pointer` lines only when the ticket belongs to a wayfinder map: they are the context pointer for the map once a human merges.

6. **Wait for CI**: `gh pr checks --watch --interval 30`. On red, read `gh run view <id> --log-failed`, fix, push, wait again, at most 2 attempts.
7. **Stop.** Don't label the PR (the engine labels it `fleet:review` once it sees green CI), don't comment on the ticket, and never run `gh pr merge` or push to `{{DEFAULT_BRANCH}}`.

## When you can't finish

Never answer a HITL question on the human's behalf. If you are blocked (the ticket contradicts the docs, a decision only Niko can make, CI still red after 2 attempts), comment on #{{ISSUE}} with what blocks you, what a human needs to decide, and a link to any open PR, then stop. A comment from you is how the engine knows you are blocked, so comment only then.

When finished (PR green, or blocked and commented), output:

<promise>COMPLETE</promise>
