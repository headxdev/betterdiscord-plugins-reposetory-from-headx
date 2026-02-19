/**
 * @name AutoInstallHeadXPlugins
 * @author HeadX
 * @authorId 808385710700494919
 * @description Installiert automatisch alle HeadX Plugins von headcraft.cloud. Nach der ersten Installation benennt sich dieses Plugin zu AutoUpdateHeadXPlugins um und hält danach alle Plugins automatisch aktuell.
 * @version 1.0.0
 * @invite J6wTJJ5fp
 * @website https://headcraft.cloud/better-discord
 * @source https://headcraft.cloud/better-discord/AutoInstallHeadXPlugins.plugin.js
 * @updateUrl https://headcraft.cloud/better-discord/AutoInstallHeadXPlugins.plugin.js
 */

/*@cc_on @if (@_jscript)
var pluginName = WScript.ScriptName.split(".")[0];
var shell = WScript.CreateObject("WScript.Shell");
shell.Popup(
    "Do NOT run scripts from the internet with the Windows Script Host!\nMove this file to your BetterDiscord plugins folder.",
    0, pluginName + ": Warning!", 0x1030
);
var fso = new ActiveXObject("Scripting.FileSystemObject");
var pluginsPath = shell.expandEnvironmentStrings("%appdata%\\BetterDiscord\\plugins");
if (!fso.FolderExists(pluginsPath)) {
    if (shell.Popup("Unable to find BetterDiscord.\nOpen the download page?", 0, pluginName, 0x34) === 6)
        shell.Exec('explorer "https://betterdiscord.app"');
} else if (WScript.ScriptFullName === pluginsPath + "\\" + WScript.ScriptName) {
    shell.Popup('Already in the correct folder.\nEnable it in Discord Settings > Plugins.', 0, pluginName, 0x40);
} else {
    if (shell.Popup("Open the BetterDiscord plugins folder?", 0, pluginName, 0x34) === 6)
        shell.Exec("explorer " + pluginsPath);
}
WScript.Quit();
@else @*/

module.exports = class AutoInstallHeadXPlugins {
    constructor() {
        this.name = "AutoInstallHeadXPlugins";
        this.isRunning = false;
        this.hasCompletedFirstRun = false;

        this.BASE_URLS = [
            "https://headcraft.cloud/better-discord/",
            "https://bd.headcraft.cloud/better-discord/"
        ];

        // Alle HeadX Plugins
        this.plugins = [
            // Libraries (zuerst!)
            "0BDFDB.plugin.js",
            "0PluginLibrary.plugin.js",
            "1XenoLib.plugin.js",
            // Updater Plugin
            "HeadXPluginUpdater.plugin.js",
            // Plugins A-Z
            "AllCallTimeCounter.plugin.js",
            "APlatformIndicators.plugin.js",
            "AutoIdleOnAFK.plugin.js",
            "autoreconnect.plugin.js",
            "BetterChatNames.plugin.js",
            "BetterDiscordAnimations.plugin.js",
            "BetterFolders.plugin.js",
            "BetterVolume.plugin.js",
            "CallTimeCounter.plugin.js",
            "CharCounter.plugin.js",
            "CustomStatusPresets.plugin.js",
            "DisableDMCallIdle.plugin.js",
            "DoubleClickToEdit.plugin.js",
            "FriendNotifications.plugin.js",
            "galaxyplugin.plugin.js",
            "GameActivityToggle.plugin.js",
            "InMyVoice.plugin.js",
            "localmessageeditor.plugin.js",
            "MentionFix.plugin.js",
            "MessageLoggerV2.plugin.js",
            "MoreRoleColors.plugin.js",
            "NotifyWhenMuted.plugin.js",
            "OpenSteamLinksInApp.plugin.js",
            "PasscodeLock.plugin.js",
            "PingNotification.plugin.js",
            "PluginCheckerSuite.plugin.js",
            "RemovedConnectionAlerts.plugin.js",
            "SendStickersAsLinks.plugin.js",
            "ServerDetails.plugin.js",
            "ServerFolders.plugin.js",
            "ShowConnections.plugin.js",
            "ShowHiddenChannels.plugin.js",
            "ShowHiddenChannelsFixed.plugin.js",
            "ShowSpectators.plugin.js",
            "SplitLargeMessages.plugin.js",
            "SpotifyControls.plugin.js",
            "StickerSnatcher.plugin.js",
            "Timezones.plugin.js",
            "Translator.plugin.js",
            "VoiceActivity.plugin.js",
            "VoiceMessages.plugin.js",
            "YABDP4Nitro.plugin.js",
        ];

        this.UPDATE_INTERVAL = 60 * 60 * 1000; // 1 Stunde
        this.updateTimer = null;
    }

    // ===== Start: Plugin wird aktiviert =====
    start() {
        const mode = this._getMode();
        if (mode === "install") {
            BdApi.showToast("📦 HeadX Auto-Installer gestartet! Lade alle Plugins...", { type: "info", timeout: 5000 });
            setTimeout(() => this._installAll(), 3000);
        } else {
            BdApi.showToast("🔄 HeadX Auto-Updater aktiv!", { type: "success" });
            setTimeout(() => this._updateAll(false), 5000);
            this._startUpdateLoop();
        }
    }

    stop() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    // ===== Modus erkennen: install oder update =====
    _getMode() {
        const fs = require("fs");
        const path = require("path");
        // Wenn die Datei als AutoUpdateHeadXPlugins existiert → Update-Modus
        const updatePath = path.join(BdApi.Plugins.folder, "AutoUpdateHeadXPlugins.plugin.js");
        if (fs.existsSync(updatePath)) return "update";
        // Oder wenn wir schon mal installiert haben
        const installed = BdApi.Data.load(this.name, "installed");
        if (installed) return "update";
        return "install";
    }

    // ===== Erster Lauf: Alles installieren =====
    async _installAll() {
        if (this.isRunning) return;
        this.isRunning = true;

        const fs = require("fs");
        const path = require("path");
        const folder = BdApi.Plugins.folder;
        let success = 0, failed = 0;

        for (const filename of this.plugins) {
            try {
                BdApi.showToast(`⬇️ Lade ${filename}...`, { type: "info", timeout: 2000 });
                const code = await this._fetchFile(filename);
                if (!code) {
                    failed++;
                    BdApi.showToast(`❌ ${filename} fehlgeschlagen`, { type: "error", timeout: 2000 });
                    continue;
                }
                const filePath = path.join(folder, filename);
                fs.writeFileSync(filePath, code, "utf8");
                success++;
            } catch (err) {
                failed++;
                console.error(`[AutoInstallHeadX] Fehler bei ${filename}:`, err);
            }
        }

        this.isRunning = false;

        BdApi.showToast(`✅ Installation fertig! ${success} installiert, ${failed} fehlgeschlagen`, {
            type: success > 0 ? "success" : "error",
            timeout: 8000
        });

        // Merken dass wir installiert haben
        BdApi.Data.save(this.name, "installed", true);
        BdApi.Data.save(this.name, "installedAt", new Date().toISOString());

        // Umbenennen: AutoInstallHeadXPlugins → AutoUpdateHeadXPlugins
        this._renameToUpdater();
    }

    // ===== Umbenennen =====
    _renameToUpdater() {
        try {
            const fs = require("fs");
            const path = require("path");
            const folder = BdApi.Plugins.folder;

            const oldPath = path.join(folder, "AutoInstallHeadXPlugins.plugin.js");
            const newPath = path.join(folder, "AutoUpdateHeadXPlugins.plugin.js");

            if (!fs.existsSync(oldPath)) return;

            // Neuen Dateiinhalt mit geändertem @name erstellen
            let content = fs.readFileSync(oldPath, "utf8");
            content = content.replace(
                /@name AutoInstallHeadXPlugins/,
                "@name AutoUpdateHeadXPlugins"
            );
            content = content.replace(
                /@description Installiert automatisch alle HeadX Plugins[^\n]*/,
                "@description Hält alle HeadX Plugins automatisch aktuell. Prüft stündlich auf Updates von headcraft.cloud."
            );

            // Neue Datei schreiben
            fs.writeFileSync(newPath, content, "utf8");

            // Alte Datei löschen
            try { fs.unlinkSync(oldPath); } catch (e) { /* */ }

            BdApi.showToast("🔄 Plugin umbenannt zu AutoUpdateHeadXPlugins! Bitte in den Einstellungen aktivieren.", {
                type: "info", timeout: 10000
            });

            console.log("[AutoInstallHeadX] Umbenannt zu AutoUpdateHeadXPlugins.plugin.js");
        } catch (err) {
            console.error("[AutoInstallHeadX] Umbenennung fehlgeschlagen:", err);
        }
    }

    // ===== Update-Modus: Nur installierte Plugins aktualisieren =====
    async _updateAll(silent = true) {
        if (this.isRunning) return;
        this.isRunning = true;

        const fs = require("fs");
        const path = require("path");
        const folder = BdApi.Plugins.folder;
        let updated = 0, upToDate = 0, failed = 0;

        for (const filename of this.plugins) {
            const localPath = path.join(folder, filename);
            if (!fs.existsSync(localPath)) continue; // Nur installierte prüfen

            try {
                // Lokale Version lesen
                const localCode = fs.readFileSync(localPath, "utf8");
                const localVersion = this._extractVersion(localCode);

                // Remote Version holen
                const remoteCode = await this._fetchFile(filename);
                if (!remoteCode) { failed++; continue; }

                const remoteVersion = this._extractVersion(remoteCode);
                if (!remoteVersion) { failed++; continue; }

                // Vergleichen
                if (localVersion && this._compareVersions(remoteVersion, localVersion) <= 0) {
                    upToDate++;
                    continue;
                }

                // Update schreiben
                fs.writeFileSync(localPath, remoteCode, "utf8");
                updated++;

                const name = this._extractName(remoteCode) || filename;
                if (!silent) {
                    BdApi.showToast(`⬆️ ${name}: ${localVersion || "?"} → ${remoteVersion}`, { type: "success", timeout: 3000 });
                }
            } catch (err) {
                failed++;
                console.error(`[AutoUpdateHeadX] Fehler bei ${filename}:`, err);
            }
        }

        this.isRunning = false;

        if (updated > 0 || !silent) {
            BdApi.showToast(`🔄 ${updated} aktualisiert, ${upToDate} aktuell, ${failed} Fehler`, {
                type: updated > 0 ? "success" : "info",
                timeout: 5000
            });
        }

        console.log(`[AutoUpdateHeadX] Check fertig: ${updated} updated, ${upToDate} current, ${failed} failed`);
    }

    _startUpdateLoop() {
        if (this.updateTimer) clearInterval(this.updateTimer);
        this.updateTimer = setInterval(() => {
            console.log("[AutoUpdateHeadX] Periodischer Update-Check...");
            this._updateAll(true);
        }, this.UPDATE_INTERVAL);
    }

    // ===== Fetch mit Dual-Domain-Fallback =====
    async _fetchFile(filename) {
        for (const baseUrl of this.BASE_URLS) {
            const url = baseUrl + filename;
            try {
                // fetch (Electron/Browser)
                let res;
                try { res = await fetch(url); } catch (e) { /* */ }
                if (res && res.ok) return await res.text();

                // BdApi.Net.fetch
                try { res = await BdApi.Net.fetch(url); } catch (e) { /* */ }
                if (res && res.ok) return await res.text();

                // Node.js https
                try { return await this._httpsGet(url); } catch (e) { /* */ }
            } catch (e) {
                console.warn(`[AutoInstallHeadX] ${url} fehlgeschlagen:`, e.message);
            }
        }
        return null;
    }

    _httpsGet(url) {
        return new Promise((resolve, reject) => {
            try {
                const https = require("https");
                const request = (currentUrl, redirects = 0) => {
                    if (redirects > 5) return reject(new Error("Too many redirects"));
                    https.get(currentUrl, { headers: { "User-Agent": "HeadXAutoInstall/1.0" } }, (res) => {
                        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location)
                            return request(res.headers.location, redirects + 1);
                        if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
                        let data = "";
                        res.on("data", chunk => data += chunk);
                        res.on("end", () => resolve(data));
                        res.on("error", reject);
                    }).on("error", reject);
                };
                request(url);
            } catch (e) { reject(e); }
        });
    }

    // ===== Hilfsfunktionen =====
    _extractVersion(code) {
        return code.match(/@version\s+([^\n\r]+)/)?.[1]?.trim() || null;
    }

    _extractName(code) {
        return code.match(/@name\s+([^\n\r]+)/)?.[1]?.trim() || null;
    }

    _compareVersions(a, b) {
        if (!a || !b) return 0;
        const pa = a.split(".").map(Number);
        const pb = b.split(".").map(Number);
        for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
            if ((pa[i] || 0) > (pb[i] || 0)) return 1;
            if ((pa[i] || 0) < (pb[i] || 0)) return -1;
        }
        return 0;
    }

    // ===== Settings Panel =====
    getSettingsPanel() {
        const mode = this._getMode();
        const panel = document.createElement("div");
        panel.style.cssText = "padding:16px;color:var(--text-normal);font-family:var(--font-primary);";

        panel.innerHTML = `
            <div style="margin-bottom:16px;">
                <h2 style="color:var(--header-primary);margin:0 0 4px;">
                    ${mode === "install" ? "📦 HeadX Auto-Installer" : "🔄 HeadX Auto-Updater"}
                </h2>
                <p style="color:var(--text-muted);font-size:13px;margin:0;">
                    ${mode === "install"
                        ? "Aktiviere dieses Plugin um alle " + this.plugins.length + " HeadX Plugins automatisch zu installieren."
                        : "Prüft stündlich auf Updates für " + this.plugins.length + " Plugins von headcraft.cloud"
                    }
                </p>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:16px;">
                <button id="hx-action-btn" style="padding:10px 20px;border:none;border-radius:6px;font-size:14px;font-weight:600;cursor:pointer;background:var(--brand-experiment);color:white;">
                    ${mode === "install" ? "📦 Alle Plugins jetzt installieren" : "🔄 Jetzt auf Updates prüfen"}
                </button>
            </div>
            <div style="background:var(--background-secondary);border-radius:8px;padding:12px;">
                <h3 style="color:var(--header-primary);font-size:14px;margin:0 0 8px;">Plugins (${this.plugins.length})</h3>
                <div style="max-height:300px;overflow-y:auto;font-size:12px;color:var(--text-muted);line-height:1.8;">
                    ${this.plugins.map(f => {
                        const fs = require("fs"), path = require("path");
                        const exists = fs.existsSync(path.join(BdApi.Plugins.folder, f));
                        return `<div style="display:flex;align-items:center;gap:6px;">
                            <span style="color:${exists ? "var(--status-positive)" : "var(--text-muted)"};">${exists ? "✅" : "⬜"}</span>
                            <span>${f.replace(".plugin.js", "")}</span>
                        </div>`;
                    }).join("")}
                </div>
            </div>
        `;

        panel.querySelector("#hx-action-btn").onclick = async (e) => {
            const btn = e.target;
            btn.disabled = true;
            btn.textContent = "⏳ Bitte warten...";
            if (mode === "install") {
                await this._installAll();
            } else {
                await this._updateAll(false);
            }
            btn.disabled = false;
            btn.textContent = mode === "install" ? "📦 Alle Plugins jetzt installieren" : "🔄 Jetzt auf Updates prüfen";
        };

        return panel;
    }
};

/*@end @*/
