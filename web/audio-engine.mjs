// Resolve the first intersection in drawing order, so a folded stroke has one voice.
export function pitchAt(line, x, settings, roots, scales) {
  const points=line.points;
  if(!points.length)return null;
  let y=null;
  if(points.length===1 && Math.abs(points[0].x-x)<=1/256)y=points[0].y;
  for(let i=0;y===null && i<points.length-1;i++){
    const a=points[i],b=points[i+1],dx=b.x-a.x;
    if(Math.abs(dx)<1/10000){if(Math.abs(x-a.x)<=1/256)y=(a.y+b.y)/2}
    else if(x>=Math.min(a.x,b.x) && x<=Math.max(a.x,b.x))y=a.y+(b.y-a.y)*(x-a.x)/dx;
  }
  if(y===null)return null;
  const row=Math.max(0,Math.min(7,Math.floor(y*8)));
  const midi=roots[settings.root]+scales[settings.scale][7-row];
  return 440*Math.pow(2,(midi-69)/12);
}

export function createVoice(context,destination,sound,time) {
  const oscillator=context.createOscillator(), gain=context.createGain();
  oscillator.type=sound;gain.gain.setValueAtTime(0,time);
  oscillator.connect(gain).connect(destination);oscillator.start(time);
  return {oscillator,gain};
}

export function setVoice(voice,frequency,volume,time) {
  const gain=frequency===null?0:Math.max(0,volume)*0.12;
  voice.gain.gain.setTargetAtTime(gain,time,frequency===null?.012:.008);
  if(frequency!==null)voice.oscillator.frequency.setTargetAtTime(frequency,time,.015);
}

export function stopVoice(voice,time) {
  voice.gain.gain.cancelScheduledValues(time);
  voice.gain.gain.setTargetAtTime(0,time,.012);
  voice.oscillator.stop(time+.1);
}
