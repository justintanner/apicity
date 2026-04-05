// Gas Town OpenCode TUI plugin: renders a sidebar_content panel showing
// the current agent's identity + hook, town status, and recent mail.
//
// Loader requirements (both are blocking — fix either alone and it still
// won't load):
//
//   1. The TUI plugin loader (readV1Plugin in strict mode) reads
//      `mod.default`, so this file MUST default-export an object with a
//      `tui` function. A bare `export const tui = ...` never loads.
//
//   2. External TUI plugins are NOT auto-discovered from .opencode/plugins/
//      like server plugins are. They load from a `plugin` array in
//      .opencode/tui.json (NOT opencode.json — they're separate configs).
//      The template deploy writes that file alongside this one.
//
// Rendering: slot renderers MUST return opentui element trees, not plain
// strings. OpenCode's Solid reconciler wraps slot children in a <box>, and a
// bare string child fails with "Orphan text error: ... must have a <text>
// as a parent". We build elements via `createElement`/`createTextNode` from
// "@opentui/solid", which opencode's plugin loader resolves against its own
// bundled copy — so no @opentui/* dep needs to be installed.
//
// Reactivity: to make the slot re-run on session activity, the slot function
// reads `api.state.session.messages(sessionID).length` and
// `api.state.session.status(sessionID)` from inside the render callback.
// Those reads establish tracking dependencies in opencode's bundled Solid
// runtime, so whenever messages change (on every assistant turn) or the
// session flips between idle/busy, the slot re-runs and re-reads the closure
// cache. The cache itself is refreshed out-of-band by `api.event.on`
// handlers — see `refresh()` below.
//
// Logging is opt-in via GT_OPENCODE_DEBUG. stderr writes during TUI streaming
// corrupt the redraw, so never log at info level. The `tui()` function runs
// after opencode has already captured stderr for its TUI buffer, so logs from
// inside `tui()` never reach any `2>file` redirect — they only appear in
// opencode's own log at ~/.local/share/opencode/log/. See
// .opencode/plugins/gastown.js for the same pattern on the server side.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync, writeFileSync } from "node:fs";
import { dirname, join as pathJoin } from "node:path";
import { fileURLToPath } from "node:url";
import {
  createElement,
  createTextNode,
  insertNode,
  setProp,
} from "@opentui/solid";

const execFileP = promisify(execFile);

const log = process.env.GT_OPENCODE_DEBUG
  ? (...args) => console.error("[gastown-tui]", ...args)
  : () => {};

log("module import");

// Self-register in .opencode/tui.json so the TUI plugin loader picks us up.
// Server plugins (including this file via auto-discovery) are loaded during
// opencode startup — the import runs top-level code — which gives us a one-
// shot window to create tui.json before the next opencode launch. Two-launch
// bootstrap: first launch creates the file, second launch activates the
// plugin. That's fine for rigs where the deacon/polecat respawn opencode
// frequently.
(() => {
  try {
    // __dirname equivalent in ESM
    const here = dirname(fileURLToPath(import.meta.url)); // .../.opencode/plugins
    const opencodeDir = dirname(here); // .../.opencode
    const tuiJsonPath = pathJoin(opencodeDir, "tui.json");
    if (existsSync(tuiJsonPath)) {
      log("tui.json already exists at", tuiJsonPath);
      return;
    }
    const content = JSON.stringify(
      {
        $schema: "https://opencode.ai/tui.json",
        plugin: ["./plugins/gastown-tui.js"],
      },
      null,
      2
    );
    writeFileSync(tuiJsonPath, content + "\n", { encoding: "utf8" });
    log("wrote tui.json at", tuiJsonPath);
  } catch (err) {
    log("self-register failed:", err?.message || err);
  }
})();

const IDENTITY = Object.freeze({
  role: (process.env.GT_ROLE || "").toLowerCase(),
  polecat: process.env.GT_POLECAT || "",
  rig: process.env.GT_RIG || "",
  agent: process.env.GT_AGENT || "",
  crew: process.env.GT_CREW || "",
});

function roleKind(role) {
  if (!role) return "overseer";
  if (role === "mayor") return "mayor";
  if (role === "deacon" || role === "deacon/boot") return "deacon";
  if (role.endsWith("/witness")) return "witness";
  if (role.endsWith("/refinery")) return "refinery";
  if (role.includes("/polecats/")) return "polecat";
  if (role.includes("/crew/")) return "crew";
  if (role === "dog") return "dog";
  return role;
}

function identityHeader() {
  const kind = roleKind(IDENTITY.role);
  if (IDENTITY.rig && IDENTITY.polecat) {
    return `${IDENTITY.rig}/${IDENTITY.polecat}  (${kind})`;
  }
  if (IDENTITY.rig && IDENTITY.crew) {
    return `${IDENTITY.rig}/crew/${IDENTITY.crew}  (${kind})`;
  }
  if (IDENTITY.role) return `${IDENTITY.role}  (${kind})`;
  return "overseer";
}

async function runGt(args, cwd) {
  try {
    const { stdout } = await execFileP("gt", args, {
      cwd,
      timeout: 4000,
      encoding: "utf8",
      env: process.env,
      maxBuffer: 1024 * 1024,
    });
    return stdout;
  } catch (err) {
    log("gt", args.join(" "), "failed:", err?.message || err);
    return null;
  }
}

async function loadStatus(cwd) {
  const out = await runGt(["status", "--fast", "--json"], cwd);
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch (e) {
    log("status parse failed:", e.message);
    return null;
  }
}

async function loadHook(cwd) {
  const out = await runGt(["hook", "--json"], cwd);
  if (!out) return null;
  try {
    return JSON.parse(out);
  } catch (e) {
    log("hook parse failed:", e.message);
    return null;
  }
}

async function loadMail(cwd) {
  const out = await runGt(["mail", "inbox", "--all", "--json"], cwd);
  if (!out) return null;
  try {
    const arr = JSON.parse(out);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    log("mail parse failed:", e.message);
    return null;
  }
}

function truncate(s, n) {
  if (!s) return "";
  return s.length <= n ? s : s.slice(0, n - 1) + "…";
}

// Build a single <text> line. `props` is an object of setProp key/value pairs.
function textLine(str, props) {
  const t = createElement("text");
  if (props) {
    for (const k of Object.keys(props)) setProp(t, k, props[k]);
  }
  insertNode(t, createTextNode(String(str)));
  return t;
}

// Build a <box> containing the given child elements (nulls skipped).
function vbox(children, props) {
  const b = createElement("box");
  setProp(b, "flexDirection", "column");
  if (props) {
    for (const k of Object.keys(props)) setProp(b, k, props[k]);
  }
  for (const child of children) {
    if (child != null) insertNode(b, child);
  }
  return b;
}

const SEP = "──────────────────────────";

function identityLines(hook, status) {
  const lines = [identityHeader(), SEP];

  if (hook && hook.has_work) {
    const beadID = hook.pinned_bead?.id || hook.agent_bead_id || "";
    const beadTitle = hook.pinned_bead?.title || "";
    lines.push(`on hook: ${beadID || "(attached)"}`);
    if (hook.attached_molecule) {
      const wisp = hook.is_wisp ? " · wisp" : "";
      lines.push(`  molecule: ${hook.attached_molecule}${wisp}`);
    }
    if (hook.progress) {
      const p = hook.progress;
      lines.push(
        `  progress: ${p.done_steps ?? 0}/${p.total_steps ?? 0}  ${p.percent_complete ?? 0}%`
      );
    }
    if (beadTitle) {
      lines.push(`  "${truncate(beadTitle, 38)}"`);
    }
    if (hook.next_action) {
      lines.push(`  next: ${truncate(hook.next_action, 38)}`);
    }
  } else if (hook) {
    lines.push("on hook: (empty)");
  } else {
    lines.push("on hook: (unavailable)");
  }

  if (status?.dnd) {
    const dnd = status.dnd.enabled
      ? `${status.dnd.level || "on"}${status.dnd.agent ? ` (${status.dnd.agent})` : ""}`
      : "off";
    lines.push(`dnd: ${dnd}`);
  }

  return lines;
}

function townLines(status) {
  if (!status) return [`town · (unavailable)`, SEP];
  const lines = [`town · ${status.name || "?"}`, SEP];

  const svc = (label, s) => (s?.running ? `${label} ✓` : `${label} ✗`);
  lines.push(
    [
      svc("daemon", status.daemon),
      svc("dolt", status.dolt),
      svc("tmux", status.tmux),
    ].join("  ")
  );

  if (status.summary) {
    const s = status.summary;
    const parts = [];
    if (typeof s.rig_count === "number") parts.push(`rigs: ${s.rig_count}`);
    if (typeof s.active_hooks === "number")
      parts.push(`hooks: ${s.active_hooks}`);
    if (typeof s.polecat_count === "number")
      parts.push(`polecats: ${s.polecat_count}`);
    if (parts.length) lines.push(parts.join("  "));
  }

  if (status.overseer && typeof status.overseer.unread_mail === "number") {
    lines.push(`overseer unread: ${status.overseer.unread_mail}`);
  }

  return lines;
}

function mailLines(mail) {
  const lines = ["recent mail", SEP];
  if (!mail) {
    lines.push("  (unavailable)");
    return lines;
  }
  if (mail.length === 0) {
    lines.push("  (no messages)");
    return lines;
  }

  const sorted = mail.slice().sort((a, b) => {
    const ta = Date.parse(a?.timestamp || "") || 0;
    const tb = Date.parse(b?.timestamp || "") || 0;
    return tb - ta;
  });

  for (const msg of sorted.slice(0, 5)) {
    const t = msg?.timestamp ? new Date(msg.timestamp) : null;
    const time =
      t && !Number.isNaN(t.getTime())
        ? `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}`
        : "--:--";
    const marker = msg?.read ? "○" : "●";
    const from = truncate(msg?.from || "?", 18);
    const subj = truncate(msg?.subject || "", 28);
    lines.push(`${time} ${marker} ${from}  ${subj}`);
  }

  return lines;
}

export default {
  id: "gastown-tui",
  tui: async (api) => {
    log("loading, role:", IDENTITY.role || "(none)");

    const cwd = process.cwd();
    const cache = { status: null, hook: null, mail: null, updatedAt: 0 };
    let refreshing = false;

    const refresh = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const [status, hook, mail] = await Promise.all([
          loadStatus(cwd),
          loadHook(cwd),
          loadMail(cwd),
        ]);
        if (status !== null) cache.status = status;
        if (hook !== null) cache.hook = hook;
        if (mail !== null) cache.mail = mail;
        cache.updatedAt = Date.now();
        log("refresh complete", {
          status: !!cache.status,
          hook: !!cache.hook,
          mailCount: cache.mail?.length ?? 0,
        });
      } finally {
        refreshing = false;
      }
    };

    refresh();

    const unsubs = [];
    unsubs.push(api.event.on("session.created", () => refresh()));
    unsubs.push(api.event.on("session.compacted", () => refresh()));
    unsubs.push(
      api.event.on("session.status", (e) => {
        if (e?.properties?.status?.type === "idle") refresh();
      })
    );
    unsubs.push(api.event.on("permission.replied", () => refresh()));

    api.lifecycle.onDispose(() => {
      for (const u of unsubs) {
        try {
          u();
        } catch {
          /* ignore */
        }
      }
      cache.status = null;
      cache.hook = null;
      cache.mail = null;
      log("disposed");
    });

    api.slots.register({
      order: 50,
      slots: {
        sidebar_content(_ctx, data) {
          // Establish reactive tracking — these reads attach the slot to
          // opencode's bundled Solid so the render callback re-runs when
          // messages or session status change. The return values are
          // intentionally discarded.
          try {
            if (data?.session_id) {
              const msgs = api.state.session.messages(data.session_id);
              void (msgs?.length ?? 0);
              void api.state.session.status?.(data.session_id);
            }
          } catch (e) {
            log("tracking read failed:", e?.message || e);
          }

          const children = [];
          for (const line of identityLines(cache.hook, cache.status)) {
            children.push(textLine(line));
          }
          children.push(textLine(""));
          for (const line of townLines(cache.status)) {
            children.push(textLine(line));
          }
          children.push(textLine(""));
          for (const line of mailLines(cache.mail)) {
            children.push(textLine(line));
          }
          return vbox(children, { paddingLeft: 1, paddingRight: 1 });
        },
      },
    });

    log("sidebar_content slot registered");
  },
};
