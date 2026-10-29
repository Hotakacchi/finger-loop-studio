import test from 'node:test';
import assert from 'node:assert/strict';
import {pitchAt,createVoice,setVoice,stopVoice} from '../web/audio-engine.mjs';
const roots={C:60},scales={major:[0,2,4,5,7,9,11,12]},settings={root:'C',scale:'major'};
test('a horizontal line sustains the same pitch throughout its span',()=>{
  const line={points:[{x:.2,y:.9},{x:.8,y:.9}]};
  assert.equal(pitchAt(line,.1,settings,roots,scales),null);
  assert.equal(pitchAt(line,.3,settings,roots,scales),pitchAt(line,.7,settings,roots,scales));
  assert.equal(pitchAt(line,.9,settings,roots,scales),null);
});
test('pitch follows the height and isolated marks remain audible',()=>{
  const line={points:[{x:0,y:.9},{x:1,y:.1}]};
  assert.ok(pitchAt(line,.9,settings,roots,scales)>pitchAt(line,.1,settings,roots,scales));
  assert.ok(pitchAt({points:[{x:.5,y:.5}]},.5,settings,roots,scales)>0);
});
test('one oscillator remains running as the pitch changes and stops cleanly',()=>{
  const calls=[];const param=name=>({setValueAtTime:(...a)=>calls.push([name,'set',...a]),setTargetAtTime:(...a)=>calls.push([name,'target',...a]),cancelScheduledValues:(...a)=>calls.push([name,'cancel',...a])});
  const osc={frequency:param('frequency'),connect:()=>({connect:()=>{}}),start:t=>calls.push(['start',t]),stop:t=>calls.push(['stop',t])};
  const context={createOscillator:()=>osc,createGain:()=>({gain:param('gain')})};
  const voice=createVoice(context,{},'sine',0);setVoice(voice,440,.5,.1);setVoice(voice,523,.5,.2);setVoice(voice,null,.5,.3);stopVoice(voice,.5);
  assert.equal(calls.filter(c=>c[0]==='start').length,1);
  assert.deepEqual(calls.filter(c=>c[0]==='frequency').map(c=>c[2]),[440,523]);
  assert.ok(calls.some(c=>c[0]==='gain'&&c[1]==='target'&&c[2]===0));
  assert.equal(calls.filter(c=>c[0]==='stop').length,1);
});
