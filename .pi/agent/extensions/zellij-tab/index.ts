/**
 * Zellij Tab Extension
 *
 * Updates the zellij tab name in real-time to show what pi is doing:
 * - ⏳ goal — thinking / processing (animated spinner)
 * - 🔧 goal — tool1,tool2 (tool names shown)
 * - ✅ goal · done summary — completed
 * - ❌ goal — errored / cancelled
 *
 * After completion, keeps showing last state (no idle reset).
 * Pins to the tab where pi was launched, so switching tabs won't
 * rename the wrong one.
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

function setTab(name: string, tabId: number | null) {
	if (!ZELLIJ) return;
	try {
		const args = tabId !== null
			? ["rename-tab", "-t", String(tabId), name]
			: ["rename-tab", name];
		execSync(`zellij action ${args.map(a => JSON.stringify(a)).join(" ")}`, { stdio: "pipe" });
	} catch {
		// zellij might not be available, silently ignore
	}
}

function undoRenameTab(tabId: number | null) {
	if (!ZELLIJ) return;
	try {
		const args = tabId !== null
			? ["undo-rename-tab", "-t", String(tabId)]
			: ["undo-rename-tab"];
		execSync(`zellij action ${args.map(a => JSON.stringify(a)).join(" ")}`, { stdio: "pipe" });
	} catch {
		// ignore
	}
}

function fmtElapsed(ms: number): string {
	const totalSec = Math.floor(ms / 1000);
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

/**
 * Take a user prompt and distill it to ~3 content words.
 * Strips common prefixes, keeps the core intent.
 */
function summarizeGoal(prompt: string): string {
	// Take first line, strip leading/trailing whitespace
	const firstLine = prompt.split("\n")[0].trim();
	// Remove common prompting prefixes
	const cleaned = firstLine
		.replace(/^(please|can you|could you|i want( you)? to|i need( you)? to|help me|let's|let us)\s+/i, "")
		.replace(/^(in|on|for|with|at)\s+the\s+/i, "")
		.trim();
	// Split into words, filter out stop words
	const stopWords = new Set(["a","an","the","and","or","but","in","on","at","to","for","of","with","by","from","is","are","was","were","be","been","it","that","this","these","those","my","your","our","their","its","i","me","we","you","they","he","she"]);
	const words = cleaned.split(/\s+/).filter(w => !stopWords.has(w.toLowerCase()));
	// Take first 3 content words
	const goal = words.slice(0, 3).join(" ");
	if (goal.length === 0 && firstLine.length > 0) {
		// Fallback: just take first 3 raw words
		return firstLine.split(/\s+/).slice(0, 3).join(" ");
	}
	return goal || "working";
}

/**
 * Extract a tiny done-summary from the last assistant message.
 * Takes the first sentence-ish fragment, capped at ~4 words.
 */
function extractDoneSummary(messages: any[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		const msg = messages[i];
		if (msg?.role === "assistant" && msg?.content) {
			const text = typeof msg.content === "string"
				? msg.content
				: Array.isArray(msg.content)
					? msg.content
						.filter((c: any) => c?.type === "text")
						.map((c: any) => c?.text ?? "")
						.join(" ")
					: "";
			// Take the first short phrase
			const firstSentence = text.split(/[.!?\n]/)[0].trim();
			const words = firstSentence.split(/\s+/).filter(Boolean);
			// Skip common filler starts
			const meaningful = words.filter(w =>
				!["i","I've","I","the","a","an"].includes(w)
			);
			const summary = meaningful.slice(0, 4).join(" ");
			if (summary.length > 0) return summary;
		}
	}
	return "";
}

export default function (pi: ExtensionAPI) {
	let startTime = 0;
	let timer: ReturnType<typeof setInterval> | null = null;
	let frameIndex = 0;
	let goal = "";
	let toolsUsed = new Set<string>();
	const tabId = ZELLIJ ? getCurrentTabId() : null;

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	function startTimer(label: string) {
		stopTimer();
		startTime = Date.now();
		frameIndex = 0;

		setTab(`⏳ ${goal}${label ? ` — ${label}` : ""}`, tabId);

		timer = setInterval(() => {
			const elapsed = Date.now() - startTime;
			const frame = SPINNER_FRAMES[frameIndex % SPINNER_FRAMES.length];
			const time = fmtElapsed(elapsed);
			setTab(`${frame} ${time} ${goal}`, tabId);
			frameIndex++;
		}, 500);
	}

	function finish(icon: string, extra?: string) {
		stopTimer();
		const elapsed = Date.now() - startTime;
		const time = fmtElapsed(elapsed);
		const parts = [icon, time, goal];
		if (extra) parts.push(`· ${extra}`);
		setTab(parts.join(" "), tabId);
	}

	// No idle display — keep showing whatever the last state was

	pi.on("before_agent_start", async (event, _ctx) => {
		goal = summarizeGoal(event.prompt);
		toolsUsed = new Set();
		currentTool = null;
		startTimer("thinking");
	});

	let currentTool: string | null = null;

	pi.on("agent_start", async (_event, _ctx) => {
		// In case before_agent_start didn't fire (e.g. multi-turn)
		if (!goal) goal = "working";
		toolsUsed = new Set();
		currentTool = null;
		startTimer("thinking");
	});

	pi.on("agent_end", async (event, _ctx) => {
		const doneSummary = extractDoneSummary(event.messages);
		if (doneSummary) {
			finish("✅", doneSummary);
		} else {
			finish("✅");
		}
		// Keep showing the final state, no idle reset
	});

	pi.on("tool_execution_start", async (event, _ctx) => {
		currentTool = event.toolName;
		toolsUsed.add(event.toolName);
		const elapsed = Date.now() - startTime;
		const time = fmtElapsed(elapsed);
		// Show current tool prominently, plus other recent tools
		const toolList = [...toolsUsed].join(",");
		setTab(`🔧 ${time} ${goal} — ${toolList}`, tabId);
	});

	pi.on("tool_execution_end", async (event, _ctx) => {
		if (event.isError) {
			setTab(`❌ ${event.toolName} failed — ${goal}`, tabId);
		} else {
			currentTool = null;
			// Show current tool list if others still running
			const elapsed = Date.now() - startTime;
			const time = fmtElapsed(elapsed);
			const toolList = [...toolsUsed].join(",");
			if (timer) {
				// Still running, keep showing tools
				setTab(`🔧 ${time} ${goal} — ${toolList}`, tabId);
			}
		}
	});

	pi.on("session_shutdown", async () => {
		stopTimer();
		undoRenameTab(tabId);
	});
}