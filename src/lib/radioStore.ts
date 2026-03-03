let liveState = false;

export function getLive() {
  return liveState;
}

export function setLive(v: boolean) {
  liveState = v;
}
