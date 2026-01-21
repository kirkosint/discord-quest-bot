/**
 * Discord Quest Auto-Completer
 * @author @kirkosint
 * @description Automatically completes eligible Discord quests
 * @usage Open Discord > F12 > Console > Paste & Enter
 */

(async () => {
    const styles = {
        title: 'font-size: 24px; font-weight: bold; background: linear-gradient(90deg, #5865F2, #EB459E); -webkit-background-clip: text; -webkit-text-fill-color: transparent; padding: 10px 0;',
        subtitle: 'color: #99AAB5; font-size: 12px;',
        success: 'color: #3BA55D; font-weight: bold;',
        error: 'color: #ED4245; font-weight: bold;',
        warning: 'color: #FEE75C; font-weight: bold;',
        info: 'color: #5865F2; font-weight: bold;',
        quest: 'background: #5865F2; color: white; padding: 8px 16px; border-radius: 8px; font-size: 14px; font-weight: bold;',
        bar: 'background: #2C2F33; color: #3BA55D; padding: 6px 12px; border-radius: 6px; font-family: "Courier New", monospace; font-size: 13px;',
        dim: 'color: #72767D; font-size: 11px;'
    };

    console.clear();
    console.log('%c✨ Discord Quest Auto-Completer', styles.title);
    console.log('%c@kirkosint', styles.subtitle);
    console.log('\n');

    delete window.$;
    let wpRequire = webpackChunkdiscord_app.push([[Symbol()], {}, r => r]);
    webpackChunkdiscord_app.pop();

    const StreamStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getStreamerActiveStreamMetadata)?.exports?.Z;
    const GameStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getRunningGames)?.exports?.ZP;
    const QuestStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getQuest)?.exports?.Z;
    const ChannelStore = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.getAllThreadsForParent)?.exports?.Z;
    const GuildStore = Object.values(wpRequire.c).find(x => x?.exports?.ZP?.getSFWDefaultChannel)?.exports?.ZP;
    const Dispatcher = Object.values(wpRequire.c).find(x => x?.exports?.Z?.__proto__?.flushWaitQueue)?.exports?.Z;
    const api = Object.values(wpRequire.c).find(x => x?.exports?.tn?.get)?.exports?.tn;

    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
    const MIN_DELAY = 1500;
    let lastCall = 0;
    const post = api.post.bind(api);

    api.post = async (opts) => {
        let retries = 0;
        while (true) {
            const elapsed = Date.now() - lastCall;
            if (elapsed < MIN_DELAY) await delay(MIN_DELAY - elapsed);
            
            try {
                const res = await post(opts);
                lastCall = Date.now();
                const retry = res?.body?.retry_after || res?.retry_after;
                
                if ((res?.status === 429 || retry) && retries < 5) {
                    const wait = Math.max((retry || 1) * 1000, 1000);
                    console.log(`%c⏱️ Rate limited: ${(wait/1000).toFixed(1)}s`, styles.warning);
                    await delay(wait);
                    retries++;
                    continue;
                }
                return res;
            } catch (err) {
                const retry = err?.body?.retry_after || err?.retry_after;
                if (retry && retries < 5) {
                    const wait = Math.max(retry * 1000, 1000);
                    console.log(`%c⏱️ Rate limited: ${(wait/1000).toFixed(1)}s`, styles.warning);
                    await delay(wait);
                    retries++;
                    continue;
                }
                throw err;
            }
        }
    };

    const tasks = ["WATCH_VIDEO", "PLAY_ON_DESKTOP", "STREAM_ON_DESKTOP", "PLAY_ACTIVITY", "WATCH_VIDEO_ON_MOBILE"];
    let quests = [...QuestStore.quests.values()].filter(q => 
        q.userStatus?.enrolledAt && 
        !q.userStatus?.completedAt && 
        new Date(q.config.expiresAt).getTime() > Date.now() && 
        tasks.find(t => Object.keys((q.config.taskConfig ?? q.config.taskConfigV2).tasks).includes(t))
    );

    const isApp = typeof DiscordNative !== "undefined";

    if (quests.length === 0) {
        console.log('%c❌ No active quests', styles.error);
        console.log('%cEnroll in quests first', styles.dim);
        return;
    }

    console.log(`%c✅ ${quests.length} quest${quests.length > 1 ? 's' : ''} found`, styles.success);
    console.log('\n');

    let done = 0;
    const total = quests.length;

    const bar = (curr, max) => {
        const pct = Math.floor((curr / max) * 100);
        const fill = Math.floor(pct / 5);
        return `${'█'.repeat(fill)}${'░'.repeat(20 - fill)} ${pct}%`;
    };

    let process = function() {
        const q = quests.pop();
        if (!q) {
            console.log('\n');
            console.log(`%c🎉 Done! ${done}/${total} completed`, styles.success);
            return;
        }

        const pid = Math.floor(Math.random() * 30000) + 1000;
        const appId = q.config.application.id;
        const appName = q.config.application.name;
        const name = q.config.messages.questName;
        const cfg = q.config.taskConfig ?? q.config.taskConfigV2;
        const task = tasks.find(t => cfg.tasks[t] != null);
        const need = cfg.tasks[task].target;
        let curr = q.userStatus?.progress?.[task]?.value ?? 0;

        console.log(`%c🎯 ${name}`, styles.quest);
        console.log(`%c${appName}`, styles.dim);
        console.log('\n');

        if (task === "WATCH_VIDEO" || task === "WATCH_VIDEO_ON_MOBILE") {
            const maxAhead = 10, speed = 7, interval = 1;
            const start = new Date(q.userStatus.enrolledAt).getTime();
            let finished = false;
            let lastPct = -1;
            
            (async () => {
                while (true) {
                    const allowed = Math.floor((Date.now() - start) / 1000) + maxAhead;
                    const diff = allowed - curr;
                    const next = curr + speed;
                    
                    if (diff >= speed) {
                        const res = await api.post({
                            url: `/quests/${q.id}/video-progress`,
                            body: { timestamp: Math.min(need, next + Math.random()) }
                        });
                        finished = res.body.completed_at != null;
                        curr = Math.min(need, next);
                        
                        const pct = Math.floor((curr / need) * 100);
                        if (pct !== lastPct && (pct % 20 === 0 || pct === 100)) {
                            console.log(`%c📺 ${bar(curr, need)}`, styles.bar);
                            lastPct = pct;
                        }
                    }
                    
                    if (next >= need) break;
                    await delay(interval * 1000);
                }
                
                if (!finished) {
                    await api.post({
                        url: `/quests/${q.id}/video-progress`,
                        body: { timestamp: need }
                    });
                }
                
                done++;
                console.log(`%c✔ Complete (${done}/${total})`, styles.success);
                console.log('\n');
                process();
            })();
            
        } else if (task === "PLAY_ON_DESKTOP") {
            if (!isApp) {
                console.log('%c⚠️ Desktop app required', styles.warning);
                console.log('\n');
                process();
            } else {
                api.get({ url: `/applications/public?application_ids=${appId}` }).then(res => {
                    const app = res.body[0];
                    const exe = app.executables.find(x => x.os === "win32")?.name.replace(">", "") || "game.exe";
                    
                    const game = {
                        cmdLine: `C:\\Program Files\\${app.name}\\${exe}`,
                        exeName: exe,
                        exePath: `c:/program files/${app.name.toLowerCase()}/${exe}`,
                        hidden: false,
                        isLauncher: false,
                        id: appId,
                        name: app.name,
                        pid: pid,
                        pidPath: [pid],
                        processName: app.name,
                        start: Date.now(),
                    };
                    
                    const old = GameStore.getRunningGames();
                    const orig1 = GameStore.getRunningGames;
                    const orig2 = GameStore.getGameForPID;
                    
                    GameStore.getRunningGames = () => [game];
                    GameStore.getGameForPID = (p) => p === pid ? game : null;
                    Dispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: old, added: [game], games: [game] });
                    
                    console.log(`%c🎮 ${appName}`, styles.info);
                    console.log(`%c~${Math.ceil((need - curr) / 60)} min`, styles.dim);
                    console.log('\n');
                    
                    let lastPct = -1;
                    let handler = data => {
                        let prog = q.config.configVersion === 1 
                            ? data.userStatus.streamProgressSeconds 
                            : Math.floor(data.userStatus.progress.PLAY_ON_DESKTOP.value);
                        
                        const pct = Math.floor((prog / need) * 100);
                        if (pct !== lastPct && (pct % 20 === 0 || pct >= 100)) {
                            console.log(`%c🎮 ${bar(prog, need)}`, styles.bar);
                            lastPct = pct;
                        }
                        
                        if (prog >= need) {
                            GameStore.getRunningGames = orig1;
                            GameStore.getGameForPID = orig2;
                            Dispatcher.dispatch({ type: "RUNNING_GAMES_CHANGE", removed: [game], added: [], games: [] });
                            Dispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                            
                            done++;
                            console.log(`%c✔ Complete (${done}/${total})`, styles.success);
                            console.log('\n');
                            process();
                        }
                    };
                    Dispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                });
            }
            
        } else if (task === "STREAM_ON_DESKTOP") {
            if (!isApp) {
                console.log('%c⚠️ Desktop app required', styles.warning);
                console.log('\n');
                process();
            } else {
                const orig = StreamStore.getStreamerActiveStreamMetadata;
                StreamStore.getStreamerActiveStreamMetadata = () => ({ id: appId, pid, sourceName: null });
                
                console.log(`%c📡 Streaming`, styles.info);
                console.log(`%c~${Math.ceil((need - curr) / 60)} min · Need viewer`, styles.dim);
                console.log('\n');
                
                let lastPct = -1;
                let handler = data => {
                    let prog = q.config.configVersion === 1 
                        ? data.userStatus.streamProgressSeconds 
                        : Math.floor(data.userStatus.progress.STREAM_ON_DESKTOP.value);
                    
                    const pct = Math.floor((prog / need) * 100);
                    if (pct !== lastPct && (pct % 20 === 0 || pct >= 100)) {
                        console.log(`%c📡 ${bar(prog, need)}`, styles.bar);
                        lastPct = pct;
                    }
                    
                    if (prog >= need) {
                        StreamStore.getStreamerActiveStreamMetadata = orig;
                        Dispatcher.unsubscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
                        
                        done++;
                        console.log(`%c✔ Complete (${done}/${total})`, styles.success);
                        console.log('\n');
                        process();
                    }
                };
                Dispatcher.subscribe("QUESTS_SEND_HEARTBEAT_SUCCESS", handler);
            }
            
        } else if (task === "PLAY_ACTIVITY") {
            const ch = ChannelStore.getSortedPrivateChannels()[0]?.id ?? 
                Object.values(GuildStore.getAllGuilds()).find(g => g?.VOCAL?.length > 0)?.VOCAL[0]?.channel?.id;
            
            if (!ch) {
                console.log('%c⚠️ No voice channels', styles.warning);
                console.log('\n');
                process();
                return;
            }
            
            const key = `call:${ch}:1`;
            
            (async () => {
                console.log(`%c🎲 Activity`, styles.info);
                console.log('\n');
                
                let lastPct = -1;
                while (true) {
                    const res = await api.post({
                        url: `/quests/${q.id}/heartbeat`,
                        body: { stream_key: key, terminal: false }
                    });
                    const prog = res.body.progress.PLAY_ACTIVITY.value;
                    
                    const pct = Math.floor((prog / need) * 100);
                    if (pct !== lastPct && (pct % 20 === 0 || pct >= 100)) {
                        console.log(`%c🎲 ${bar(prog, need)}`, styles.bar);
                        lastPct = pct;
                    }
                    
                    await delay(20000);
                    
                    if (prog >= need) {
                        await api.post({
                            url: `/quests/${q.id}/heartbeat`,
                            body: { stream_key: key, terminal: true }
                        });
                        break;
                    }
                }
                
                done++;
                console.log(`%c✔ Complete (${done}/${total})`, styles.success);
                console.log('\n');
                process();
            })();
        }
    };
    
    process();
})();
