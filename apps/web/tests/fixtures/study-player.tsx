import { StrictMode, useState } from "react";
import { createRoot } from "react-dom/client";
import { StudyMusicPlayer } from "../../src/features/study-room/components/study-music-player.tsx";
import "../../src/index.css";

type Options = { videoId: string; playerVars: Record<string, string | number>; events: Record<string, (event: {target: FakePlayer; data: number}) => void> };
const log: { event: string; value?: unknown }[] = [];
const players: FakePlayer[] = [];
let clock = 0;
const anchor = Date.now();
Date.now = () => anchor + clock;
Object.defineProperty(performance, "now", { value: () => clock });
const realInterval = window.setInterval.bind(window);
const realClear = window.clearInterval.bind(window);
const ticks = new Map<number, () => void>();
let timerId = 100000;
window.setInterval = ((fn: TimerHandler, delay?: number, ...args: unknown[]) => {
  if (delay === 3000 && typeof fn === "function") { const id = ++timerId; ticks.set(id, () => fn(...args)); return id; }
  return realInterval(fn, delay, ...args);
}) as typeof window.setInterval;
window.clearInterval = (id?: number) => { if (id !== undefined && ticks.delete(id)) return; realClear(id); };

class FakePlayer {
  frame: HTMLIFrameElement; options: Options; state = -1; volume = 40; muted = false; time = 0; destroyed = false;
  constructor(slot: HTMLElement, options: Options) {
    this.options = options; players.push(this); log.push({event:'create',value:options});
    this.frame = document.createElement('iframe'); this.frame.srcdoc = '<body style="background:#071d2d;color:white">Local player fixture; no audio or YouTube network</body>'; slot.replaceWith(this.frame);
    if (!location.search.includes('ready=held')) setTimeout(() => this.options.events.onReady({ target: this, data: 0 }), 10);
  }
  getIframe() { return this.frame; }
  getDuration() { return 600; }
  getCurrentTime() { return this.time; }
  getPlayerState() { return this.state; }
  setVolume(value: number) { this.volume = value; }
  getVolume() { return this.volume; }
  mute() { this.muted = true; }
  unMute() { this.muted = false; }
  isMuted() { return this.muted; }
  emit(data: number) { this.state = data; this.options.events.onStateChange({target:this,data}); }
  playVideo() { log.push({event:'play'}); this.emit(1); }
  pauseVideo() { log.push({event:'pause'}); this.emit(2); }
  seekTo(value: number) {
    log.push({event:'seek',value}); this.time=value;
  }
  destroy() { this.destroyed=true; this.frame.remove(); log.push({event:'destroy'}); }
}
if (!location.search.includes('api=fail')) Object.assign(window, { YT: {Player:FakePlayer} });
export default function Fixture() {
  const [playback,setPlayback] = useState({videoId:'jfKfPfyJRdk',title:'Default live fixture',startedAt:new Date(anchor-120000).toISOString(),version:1,isDefault:true});
  const [mounted,setMounted] = useState(true);
  const [,rerender] = useState(0);
  const active = () => players.filter(player => !player.destroyed);
  const local = (index=0) => active()[index]!;
  Object.assign(window, { fixture: {
    snapshot: () => ({ log:log.map(x=>x.event==='create'?{event:x.event}:x),players:players.length,alive:active().length,timers:ticks.size,lastVideo:players.at(-1)?.options.videoId,lastState:players.at(-1)?.state,devices:active().map(player=>({video:player.options.videoId,position:player.time,state:player.state,volume:player.volume,muted:player.muted,start:player.options.playerVars.start??null})) }),
    tick: (ms=3000) => {clock+=ms;for(const player of active()) if(player.state===1) player.time+=ms/1000;for(const fn of ticks.values()) fn();},
    native: (state:number,index=0) => local(index).emit(state),
    localSeek: (position:number,index=0) => {local(index).time=position;},
    audio: (volume:number,muted:boolean,index=0) => {local(index).volume=volume;local(index).muted=muted;},
    error: (code:number) => players.at(-1)!.options.events.onError({target:players.at(-1)!,data:code}),
    blocked: () => players.at(-1)!.options.events.onAutoplayBlocked({target:players.at(-1)!,data:0}),
    staleEvent: () => players[0].emit(0),
    lateReady: () => players.at(-1)!.options.events.onReady({target:players.at(-1)!,data:0}),
    installApi: () => { Object.assign(window,{YT:{Player:FakePlayer}}); },
    rerender: () => {rerender(x=>x+1);setPlayback(p=>({...p}));},
    defaultVersion: () => setPlayback(p=>({...p,version:p.version+1})),
    finite: () => setPlayback(p=>({...p,videoId:'abcdefghijk',title:'Finite fixture',version:p.version+1,isDefault:false})),
    nextVideo: () => setPlayback(p=>({...p,videoId:'lmnopqrstuv',title:'Next fixture',version:p.version+1})),
    timestamp: () => setPlayback(p=>({...p,startedAt:new Date(anchor+86400000).toISOString()})),
    mount: (next:boolean) => setMounted(next),
    clear: () => {log.length=0;},
  }});
  return <main style={{maxWidth:600,margin:'2rem auto',padding:'1rem'}}>
    {mounted && <StudyMusicPlayer playback={playback} />}
    {mounted && location.search.includes('pair=1') && <StudyMusicPlayer playback={playback} />}
  </main>;
}
createRoot(document.getElementById('root')!).render(<StrictMode><Fixture /></StrictMode>);
