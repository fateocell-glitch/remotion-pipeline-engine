"use strict";
const assert=require("node:assert/strict");
const {test}=require("node:test");
const {buildProjectFromWhisper}=require("./project-onboarding.cjs");
const {englishBeatContent}=require("./services/language-support.cjs");

test("builds native English beats with word-safe copy and English component tags",()=>{
  const project=buildProjectFromWhisper({projectId:"english-sample",name:"English Sample",videoSrc:"test.mp4",audioSrc:"test.wav",duration:72,transcript:{language:"en",transcription:[
    {offsets:{from:0,to:9000},text:"Revenue growth is accelerating as enterprise demand expands."},
    {offsets:{from:9000,to:21000},text:"However, margin compression remains a critical operational risk."},
    {offsets:{from:21000,to:31000},text:"First, the roadmap prioritizes silicon architecture and bandwidth."},
    {offsets:{from:31000,to:43000},text:"Second, latency improvements unlock real-time AI workloads."},
    {offsets:{from:43000,to:54000},text:"The next phase scales these metrics across the product line."},
    {offsets:{from:54000,to:72000},text:"The final verdict is a disciplined path to durable growth."},
  ]}});
  assert.equal(project.language,"en");
  assert.equal(project.beats.length,2);
  for(const beat of project.beats){
    assert.equal(/[\u3400-\u9fff]/.test(beat.subtitle+beat.effectText),false);
    assert.ok(beat.subtitle.split(/\s+/).length>=3&&beat.subtitle.split(/\s+/).length<=6);
    assert.ok(beat.effectText.replace(/[.!?]+$/,"").split(/\s+/).length>=7&&beat.effectText.replace(/[.!?]+$/,"").split(/\s+/).length<=14);
  }
  assert.ok(typeof project.beats[1].layout === "string" && project.beats[1].layout.length > 0);
  assert.ok(project.beats.every((beat) => beat.layers.every((layer) => /^(?:KEY METRIC|CORE DRIVER|RISK SIGNAL|CORE TAKEAWAY)$/.test(layer.category))));
});
test("turns the higher-education transcript into an executive English card",()=>{
  const result=englishBeatContent([{en:"There are multiple higher education opportunities in Virginia Beach, including Regent University and Virginia Wesleyan."}]);
  assert.equal(result.chapter,"EDUCATION");
  assert.equal(result.headline,"Higher Education Hub");
  assert.equal(result.effectText,"Universities expand the region's skilled talent pipeline.");
  assert.equal(/^there\s+(?:is|are)\b/i.test(result.headline),false);
  assert.ok(result.headline.split(/\s+/).length>=3&&result.headline.split(/\s+/).length<=6);
  assert.deepEqual(result.steps,["Regent University","Virginia Wesleyan"]);
});
test("turns the FBI crime-data transcript into an executive signal",()=>{
  const result=englishBeatContent([{en:"According to FBI data, violent crime has decreased by about 42% over the past half-dozen years."}]);
  assert.equal(result.chapter,"RISK SIGNAL");
  assert.equal(result.headline,"Crime Decline Signal");
  assert.equal(/^according\b/i.test(result.headline),false);
  assert.ok(result.headline.split(/\s+/).length>=3&&result.headline.split(/\s+/).length<=6);
});

