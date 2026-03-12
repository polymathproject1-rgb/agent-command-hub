import {
  AUTO_CREATE,
  AUTO_SEND,
  DEFAULT_BATCH_SIZE,
  SEND_BATCH_SIZE,
  callAiLog,
  createJobForCampaign,
  fetchCompletedProspectCampaigns,
  fetchExistingOutboundJobs,
  jobLooksStalled,
  processJob,
} from './nova-outbound-lib.mjs';

const INTERVAL_MS = Number(process.env.NOVA_OUTBOUND_DAEMON_INTERVAL_MS || 300000);

function activeJobByCampaign(jobs) {
  const map = new Map();
  for (const job of jobs) {
    const existing = map.get(job.prospect_campaign_id);
    if (!existing) {
      map.set(job.prospect_campaign_id, job);
      continue;
    }
    const existingTs = new Date(existing.updated_at || existing.created_at).getTime();
    const nextTs = new Date(job.updated_at || job.created_at).getTime();
    if (nextTs > existingTs) map.set(job.prospect_campaign_id, job);
  }
  return map;
}

async function tick() {
  const campaigns = await fetchCompletedProspectCampaigns();
  const jobs = await fetchExistingOutboundJobs();
  const jobsByCampaign = activeJobByCampaign(jobs);
  const created = [];
  const processed = [];
  const stalled = [];

  for (const campaign of campaigns) {
    let job = jobsByCampaign.get(campaign.id);

    if (!job && AUTO_CREATE) {
      const createdResult = await createJobForCampaign(campaign);
      job = createdResult.job;
      created.push({ campaign: campaign.name, jobId: job.id });
      await callAiLog(`Outbound job created for completed prospect campaign: ${campaign.name}`, 'task_start', {
        prospect_campaign_id: campaign.id,
        job_id: job.id,
      });
    }

    if (!job) continue;

    if (jobLooksStalled(job)) {
      stalled.push({ campaign: campaign.name, jobId: job.id, status: job.status });
      continue;
    }

    const processedResult = await processJob(job, {
      batchSize: DEFAULT_BATCH_SIZE,
      sendBatchSize: SEND_BATCH_SIZE,
      allowSend: AUTO_SEND,
    });
    processed.push({ campaign: campaign.name, ...processedResult });
  }

  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    mode: 'daemon',
    campaignsSeen: campaigns.length,
    jobsSeen: jobs.length,
    created,
    processed,
    stalled,
  }, null, 2));
}

console.log(`[nova-outbound-daemon] started | interval=${INTERVAL_MS}ms | auto_send=${AUTO_SEND}`);
await tick().catch((err) => console.error('[nova-outbound-daemon] initial tick failed:', err));
setInterval(() => {
  tick().catch((err) => console.error('[nova-outbound-daemon] tick failed:', err));
}, INTERVAL_MS);
