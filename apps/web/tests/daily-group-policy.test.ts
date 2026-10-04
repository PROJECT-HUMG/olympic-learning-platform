import assert from "node:assert/strict";
import { it } from "node:test";
import { readGroupDetail, readSharing, readDashboard, readInvitation, readFeedback, groupAccessLost } from "../src/features/daily/groups/group-contract.ts";
const group="00000000-0000-0000-0000-000000000101";
const owner="00000000-0000-0000-0000-000000000102";
const viewer="00000000-0000-0000-0000-000000000103";
const date="2026-09-07";
it("validates default-OFF own sharing and exact group identity",()=>{
  assert.deepEqual(readSharing({shareDaily:false,sharingMode:"GROUP",selectedViewerIds:[]}),{shareDaily:false,sharingMode:"GROUP",selectedViewerIds:[]});
  assert.throws(()=>readSharing({shareDaily:false,sharingMode:"GROUP",selectedViewerIds:[viewer,viewer]}));
  assert.throws(()=>readGroupDetail({id:group,name:"Group",ownerId:owner,members:[],mySharing:{shareDaily:false,sharingMode:"GROUP",selectedViewerIds:[]}},viewer));
});
it("requires target-aligned complete invitation metadata",()=>{
  const inv={id:group,groupId:group,groupName:"Group",inviterId:owner,inviterDisplayName:"Owner",targetUserId:viewer,status:"PENDING",createdAt:"2026-10-04T12:00:00Z"};
  assert.equal(readInvitation(inv,viewer).status,"PENDING");
  assert.throws(()=>readInvitation(inv,owner));
  assert.throws(()=>readInvitation({...inv,status:"JOINED"},viewer));
});
it("NOT_SHARED admits no plan-existence or count data",()=>{
  const v={groupId:group,date,members:[{userId:owner,displayName:"Owner",access:"NOT_SHARED",summary:null}]};
  assert.equal(readDashboard(v,group,date).members[0].summary,null);
  assert.throws(()=>readDashboard({...v,members:[{...v.members[0],summary:{planId:group}}]},group,date));
  assert.throws(()=>readDashboard(v,group,"2026-09-08"));
});
it("checks authorized counts and rejects duplicate member identities",()=>{
  const row={userId:owner,displayName:"Owner",access:"SHARED",summary:{planId:group,firstSubmittedAt:null,onTime:false,completedCount:1,totalCount:2,mustCompleted:1,mustTotal:1}};
  assert.equal(readDashboard({groupId:group,date,members:[row]},group,date).members[0].summary?.totalCount,2);
  assert.throws(()=>readDashboard({groupId:group,date,members:[row,row]},group,date));
  assert.throws(()=>readDashboard({groupId:group,date,members:[{...row,summary:{...row.summary,mustTotal:3}}]},group,date));
});
it("feedback count is distinct currently supplied identified contributors",()=>{
  const c={id:group,authorId:viewer,authorDisplayName:"Viewer",text:"Advice\nMore",createdAt:"2026-10-04T12:00:00Z",updatedAt:"2026-10-04T12:00:00Z",version:0};
  assert.equal(readFeedback({contributions:[c],contributorCount:1}).contributions[0].text,c.text);
  assert.throws(()=>readFeedback({contributions:[c,c],contributorCount:2}));
  assert.throws(()=>readFeedback({contributions:[c],contributorCount:0}));
  assert.throws(()=>readFeedback({contributions:[{...c,authorId:null}],contributorCount:1}));
});
it("permission loss is separate from transient failure",()=>{
  assert.equal(groupAccessLost({response:{status:403,data:{}}}),true);
  assert.equal(groupAccessLost({response:{status:503,data:{}}}),false);
});

