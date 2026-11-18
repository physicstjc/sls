import {HoldTracker} from './assessment.js?v=feedback-4';

export const MATCH_HOLD_SECONDS=.45;

// Recognise a good pose immediately, tolerate brief jitter, and retain the
// completed result until the student changes the task or starts again.
export class AttemptFeedback{
  constructor(){this.hold=new HoldTracker({duration:MATCH_HOLD_SECONDS,graceMs:250,maxGapMs:500});this.reset();}
  reset(){this.complete=false;this.hold.reset();this.lastMatch=null;}
  update(assessment,now){
    if(this.complete)return {phase:'correct',elapsed:MATCH_HOLD_SECONDS,assessment:this.lastMatch,newAward:false};
    if(['wrong-hand','confirm','gap','off'].includes(assessment.code))this.hold.reset();
    const progress=this.hold.update(assessment.match,now);
    if(assessment.match)this.lastMatch=assessment;
    if(progress.complete)this.complete=true;
    return {phase:this.complete?'correct':assessment.match?'matching':'adjust',elapsed:progress.elapsed,assessment,newAward:progress.newAward};
  }
}
