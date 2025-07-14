// use surge api to test all proxy in a group can visit youtube
const fs = require('fs/promises'); // for saving response bodies

const API       = 'http://127.0.0.1:6175';
const API_KEY   = 'surgepasswd_s1';
const GROUP     = 'Proxy'; 
const TIMEOUT   = 10_000; 

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function apiFetch(path, opts = {}) {
  const url = API + path;
  const headers = Object.assign({
    // According to Surge HTTP API docs the header key should be `X-Key`
    'X-Key': API_KEY
  }, opts.headers);
  const res = await fetch(url, Object.assign({}, opts, { headers }));
  return res;
}

async function getProxyGroups() {
  // Surge HTTP API: GET /v1/policy_groups
  const res = await apiFetch('/v1/policy_groups');
  const json = await res.json();
  return json.data || json; 
}

async function switchPolicy(groupName, policyName) {
  // Surge HTTP API: POST /v1/policy_groups/select
  const r = await apiFetch('/v1/policy_groups/select', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ group_name: groupName, policy: policyName })
  });
  console.log(r.status, await r.text());
}

// Test YouTube accessibility; save HTML response as <nodeName>.html
async function testYouTube(nodeName) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  try {
    // Force English interface by adding hl=en_US and Accept-Language header
    const youtubeURL = 'https://www.youtube.com/watch?v=9bw5-HNF5qI&hl=en_US&persist_hl=1';
    const res = await fetch(youtubeURL, {
      headers: {
        // Spoof a modern browser user-agent to reduce bot detection
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
        // Explicitly request English content
        'Accept-Language': 'en-US,en;q=0.9'
      },
      signal: controller.signal,
    });

    let body = await res.text();
    // const safeName = nodeName.replace(/[^a-zA-Z0-9.-]/g, '_');
    // try {
    //   await fs.writeFile(`${safeName}.html`, body);
    // } catch (e) {
    //   console.error(`Failed to write file for ${nodeName}:`, e);
    // }

    const ok = res.status === 200 && !body.includes('not a bot');
    return ok;
  } catch (_) {
    return false; // network / timeout error
  } finally {
    clearTimeout(timer);
  }
}

;(async () => {
  // 1. Get policy group information (supports both object and array responses)
  const rawGroups = await getProxyGroups();
  console.log('Policy groups fetched:', Object.keys(rawGroups));

  let nodes = [];

  if (Array.isArray(rawGroups)) {
    // Newer Surge versions return an array
    const groupObj = rawGroups.find(g => g.name === GROUP);
    if (!groupObj) {
      console.error(`Policy group "${GROUP}" not found`);
      process.exit(1);
    }
    nodes = groupObj.proxies || groupObj.list || groupObj.all_policy || [];
  } else if (rawGroups && typeof rawGroups === 'object') {
    // Older Surge versions return an object keyed by group name
    const groupArr = rawGroups[GROUP];
    if (!groupArr) {
      console.error(`Policy group "${GROUP}" not found`);
      process.exit(1);
    }
    // Items may be plain strings or objects; extract the name accordingly
    nodes = groupArr.map(item => typeof item === 'string' ? item : item.name);
  } else {
    console.error('Unrecognized policy group data format');
    process.exit(1);
  }

  console.log(`Found nodes in "${GROUP}":`, nodes, '\n');

  // Collect nodes that can access YouTube successfully
  const okNodes = [];

  nodes = nodes.filter(node => node.includes('xn'));
  // 3. Switch and test each node sequentially
  for (const node of nodes) {
    process.stdout.write(`Switching to ${node} -> `);
    await switchPolicy(GROUP, node);
    await sleep(800);   // wait for the policy to take effect

    const ok = await testYouTube(node);
    if (ok) {
      console.log(`${node} OK`);
      okNodes.push(node);
    } else {
      console.log(`${node} FAIL`);
    }
  }

  // Print summary of all OK nodes
  console.log('Available nodes (OK):', okNodes);
})();
