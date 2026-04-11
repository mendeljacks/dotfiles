/**
 * Zellij Tab Extension
 *
 * Shows timers, icons, and tool names in the tab title.
 * Updates once per second — no flicker.
 *
 * States:
 * - ⏳ 5s              — thinking
 * - ⏳🔧 12s — bash,edit — tool(s) running, spinner keeps going
 * - ✅ 1m 3s            — done
 * - ❌ edit failed      — error
 *
 * Pins to the tab where pi was launched.
 */

import { execSync } from "node:child_process";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const ZELLIJ = !!process.env.ZELLIJ;
const SPINNER_FRAMES = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

function getCurrentTabId(): number | null {
	try {
		const info = execSync("zellij action current-tab-info", { encoding: "utf-8" });
		const match = info.match(/id:\s*(\d+)/);
		return match ? parseInt(match[1], 10) : null;
	} catch {
		return null;
	}
}

function fmtElapsed(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function (pi: ExtensionAPI) {
	let startTime = 0;
	let timer: ReturnType<typeof setInterval> | null = null;
	let lastSecond = -1;
	let activeTools = 0;
	let toolsUsed = new Set<string>();
	let lastTitle = "";
	let tabName = "";
	const tabId = ZELLIJ ? getCurrentTabId() : null;

	function setTitle(title: string) {
		if (!ZELLIJ || title === lastTitle) return;
		lastTitle = title;
		try {
			const args = tabId !== null
				? ["rename-tab", "-t", String(tabId), title]
				: ["rename-tab", title];
			execSync(`zellij action ${args.map(a => JSON.stringify(a)).join(" ")}`, { stdio: "pipe" });
		} catch {
			// not in zellij
		}
	}

	function getCurrentTabName(): string {
		if (!ZELLIJ) return "";
		try {
			const info = execSync("zellij action current-tab-info", { encoding: "utf-8" });
			const match = info.match(/name:\s*(.+)/);
			return match ? match[1].trim() : "";
		} catch {
			return "";
		}
	}

	function undoRenameTab() {
		if (!ZELLIJ) return;
		lastTitle = "";
		try {
			if (tabName) {
				setTitle(tabName);
			} else {
				const args = tabId !== null
					? ["undo-rename-tab", "-t", String(tabId)]
					: ["undo-rename-tab"];
				execSync(`zellij action ${args.map(a => JSON.stringify(a)).join(" ")}`, { stdio: "pipe" });
			}
		} catch {
			// ignore
		}
	}

	function stopSpinner() {
		if (timer) { clearInterval(timer); timer = null; }
	}

	function tickSpinner() {
		const elapsed = Date.now() - startTime;
		const sec = Math.floor(elapsed / 1000);
		if (sec === lastSecond) return;
		lastSecond = sec;
		const frame = SPINNER_FRAMES[sec % SPINNER_FRAMES.length];
		const suffix = tabName ? ` ${tabName}` : "";
		if (activeTools > 0) {
			const toolList = [...toolsUsed].join(",");
			setTitle(`${frame} 🔧 ${fmtElapsed(elapsed)}${suffix} — ${toolList}`);
		} else {
			setTitle(`${frame} ${fmtElapsed(elapsed)}${suffix}`);
		}
	}

	function startSpinner() {
		stopSpinner();
		lastSecond = -1;
		tickSpinner();
		timer = setInterval(tickSpinner, 200);
	}

	// Capture the tab name the user set, so we always include it
	tabName = getCurrentTabName();

	pi.on("before_agent_start", async () => {
		startTime = Date.now();
		toolsUsed = new Set();
		activeTools = 0;
		lastSecond = -1;
		startSpinner();
	});

	pi.on("agent_start", async () => {
		toolsUsed = new Set();
		activeTools = 0;
		startTime = startTime || Date.now();
		lastSecond = -1;
		startSpinner();
	});

	pi.on("agent_end", async () => {
		stopSpinner();
		const elapsed = Date.now() - startTime;
		setTitle(`✅ ${fmtElapsed(elapsed)}${tabName ? ` ${tabName}` : ""}`);
	});

	pi.on("tool_execution_start", async (event) => {
		activeTools++;
		toolsUsed.add(event.toolName);
	});

	pi.on("tool_execution_end", async (event) => {
		if (event.isError) {
			stopSpinner();
			setTitle(`❌ ${event.toolName} failed${tabName ? ` ${tabName}` : ""}`);
		} else {
			activeTools = Math.max(0, activeTools - 1);
		}
	});

	pi.on("session_shutdown", async () => {
		stopSpinner();
		undoRenameTab();
	});
}