import express from 'express';

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory store
const store = {
  options: [
    { id: 'a', label: 'Option A', votes: 0 },
    { id: 'b', label: 'Option B', votes: 0 },
    { id: 'c', label: 'Option C', votes: 0 }
  ]
};

async function getReplicatedInfo() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch('http://replicated:3000/api/v1/app/info', {
      signal: controller.signal
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return {
      channelName: data.channelName || data.currentRelease?.channelName || '',
      versionLabel: data.currentRelease?.versionLabel || ''
    };
  } catch (_err) {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

app.get('/api/replicated-info', async (_req, res) => {
  const info = await getReplicatedInfo();
  if (!info || (!info.channelName && !info.versionLabel)) {
    return res.status(204).end();
  }
  res.json(info);
});

app.get('/healthz', (_req, res) => {
  res.status(200).send('ok');
});

app.get('/api/options', (_req, res) => {
  res.json(store.options);
});

app.post('/api/vote/:id', (req, res) => {
  const { id } = req.params;
  const option = store.options.find(o => o.id === id);
  if (!option) {
    return res.status(404).json({ error: 'Option not found' });
  }
  option.votes += 1;
  res.json({ success: true, option });
});

app.get('/', (_req, res) => {
  const html = `<!doctype html>
  <html>
    <head>
      <meta charset="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>Vote App</title>
      <style>
        body { font-family: system-ui, -apple-system, Segoe UI, Roboto, sans-serif; margin: 2rem; }
        .option { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
        button { padding: 0.4rem 0.8rem; }
        .count { font-weight: bold; }
        .status-badge {
          position: fixed; bottom: 12px; right: 12px;
          background: rgba(0,0,0,0.65); color: #fff;
          font-size: 12px; padding: 6px 8px; border-radius: 6px;
        }
      </style>
    </head>
    <body>
      <h1>Vote App</h1>
      <div id="options"></div>
      <div id="status" class="status-badge" style="display:none"></div>
      <script>
        async function load() {
          const res = await fetch('/api/options');
          const options = await res.json();
          const root = document.getElementById('options');
          root.innerHTML = '';
          for (const o of options) {
            const div = document.createElement('div');
            div.className = 'option';
            const label = document.createElement('span');
            label.textContent = o.label + ' — ';
            const count = document.createElement('span');
            count.className = 'count';
            count.textContent = o.votes;
            const btn = document.createElement('button');
            btn.textContent = 'Vote';
            btn.onclick = async () => {
              await fetch('/api/vote/' + o.id, { method: 'POST' });
              await load();
            };
            div.appendChild(label);
            div.appendChild(count);
            div.appendChild(btn);
            root.appendChild(div);
          }
        }
        async function loadStatus() {
          try {
            const r = await fetch('/api/replicated-info');
            if (!r.ok) return;
            if (r.status === 204) return;
            const info = await r.json();
            if (!info) return;
            const s = document.getElementById('status');
            const parts = [];
            if (info.channelName) parts.push(info.channelName);
            if (info.versionLabel) parts.push(info.versionLabel);
            if (parts.length) {
              s.textContent = parts.join(': ');
              s.style.display = 'block';
            }
          } catch (e) {
            // ignore
          }
        }
        load();
        loadStatus();
      </script>
    </body>
  </html>`;
  res.set('Content-Type', 'text/html').send(html);
});

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`vote-app listening on port ${port}`);
});


