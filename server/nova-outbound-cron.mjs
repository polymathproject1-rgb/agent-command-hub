import {
  AUTO_SEND,
  DEFAULT_BATCH_SIZE,
  SEND_BATCH_SIZE,
  STALLED_MINUTES,
  callAiLog,
  fetchCompletedProspectCampaigns,
  fetchExistingOutboundJobs,
  fetchLeadsForJob,
  jobLooksStalled,
  processJob,
  summarizeLeads,
} from './nova-outbound-lib.mjs';

const mode = process.argv[2] || 'reconcile';

async function reconcile() {
  const campaigns = await fetchCompletedProspectCampaigns();
  const jobs = await fetchExistingOutboundJobs();
  const activeCampaignIds = new Set(campaigns.map((c) => c.id));
  const filteredJobs = jobs.filter((job) => activeCampaignIds.has(job.prospect_campaign_id));
  const results = [];

  for (const job of filteredJobs) {
    if (jobLooksStalled(job)) continue;
    const result = await processJob(job, {
      batchSize: DEFAULT_BATCH_SIZE,
      sendBatchSize: SEND_BATCH_SIZE,
      allowSend: false,
    });
    results.push(result);
  }

  console.log(JSON.stringify({ ts: new Date().toISOString(), mode: 'reconcile', jobs: filteredJobs.length, results }, null, 2));
}

async function sendWindow() {
  const jobs = await fetchExistingOutboundJobs();
  const results = [];
  for (const job of jobs) {
    const { leads } = await fetchLeadsForJob(job.id);
    const summary = summarizeLeads(leads);
    if (summary.approved <= 0) continue;
    const result = await processJob(job, {
      batchSize: DEFAULT_BATCH_SIZE,
      sendBatchSize: SEND_BATCH_SIZE,
      allowSend: true,
    });
    results.push(result);
  }
  console.log(JSON.stringify({ ts: new Date().toISOString(), mode: 'send-window', autoSend: AUTO_SEND, results }, null, 2));
}

async function dailySummary() {
  const jobs = await fetchExistingOutboundJobs();
  const summary = [];
  let totalApproved = 0;
  let totalSent = 0;
  let totalReview = 0;
  let totalPending = 0;

  for (const job of jobs) {
    const { leads } = await fetchLeadsForJob(job.id);
    const counts = summarizeLeads(leads);
    totalApproved += counts.approved;
    totalSent += counts.sent;
    totalReview += counts.review;
    totalPending += counts.pending;
    summary.push({ jobId: job.id, status: job.status, counts });
  }

  await callAiLog(`Nova outbound daily summary: ${jobs.length} jobs | approved ${totalApproved} | sent ${totalSent} | review ${totalReview} | pending ${totalPending}`, 'fyi', {
    jobs: summary,
  });

  console.log(JSON.stringify({ ts: new Date().toISOString(), mode: 'daily-summary', jobs: summary }, null, 2));
}

async function stuckCheck() {
  const jobs = await fetchExistingOutboundJobs();
  const stuck = jobs.filter(jobLooksStalled).map((job) => ({
    jobId: job.id,
    status: job.status,
    updated_at: job.updated_at,
  }));

  if (stuck.length) {
    await callAiLog(`Nova outbound stuck-job alert: ${stuck.length} job(s) stalled > ${STALLED_MINUTES}m`, 'observation', { stuck });
  }

  console.log(JSON.stringify({ ts: new Date().toISOString(), mode: 'stuck-check', stuck }, null, 2));
}

if (mode === 'reconcile') await reconcile();
else if (mode === 'send-window') await sendWindow();
else if (mode === 'daily-summary') await dailySummary();
else if (mode === 'stuck-check') await stuckCheck();
else {
  console.error(`Unknown mode: ${mode}`);
  process.exit(1);
}
