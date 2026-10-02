/** A short, soft three-note chime generated locally, with no media download. */
export function ringRoomBell(context: AudioContext) {
  if (context.state !== "running") return false;
  const start = context.currentTime;
  [880, 1174.66, 1318.51].forEach((frequency, index) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    const at = start + index * 0.16;
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(frequency, at);
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.09, at + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, at + 1.1);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    oscillator.start(at);
    oscillator.stop(at + 1.15);
  });
  return true;
}
