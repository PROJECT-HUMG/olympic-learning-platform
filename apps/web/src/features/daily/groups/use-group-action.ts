import { useEffect, useRef, useState } from "react";
import { groupError } from "./group-contract";

export function useGroupAction() {
  const active=useRef<AbortController|null>(null);
  const [busy,setBusy]=useState(false);
  const [notice,setNotice]=useState<string|null>(null);
  useEffect(()=>()=>active.current?.abort(),[]);
  async function run(action:(signal:AbortSignal)=>Promise<string>) {
    if(active.current)return;
    const controller=new AbortController(); active.current=controller;
    setBusy(true);setNotice(null);
    try { const message=await action(controller.signal); if(!controller.signal.aborted)setNotice(message); }
    catch(error){if(!controller.signal.aborted)setNotice(groupError(error));}
    finally{if(!controller.signal.aborted)setBusy(false);if(active.current===controller)active.current=null;}
  }
  return {busy,notice,run};
}
