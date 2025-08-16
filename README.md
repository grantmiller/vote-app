# vote-app

Minimal Node.js + Express voting app with Docker, Helm, and GitHub Actions.

## Local development

```bash
npm install
npm run dev
# open http://localhost:3000
```

## Build and run Docker

```bash
docker build -t vote-app:local .
docker run --rm -p 3000:3000 --name vote-app-local vote-app:local
# open http://localhost:3000
```

## Helm chart

Install (ClusterIP):

```bash
helm upgrade --install vote-app ./helm \
  --set image.repository=ghcr.io/<org>/<repo> \
  --set image.tag=<tag>
```

With Ingress:

```bash
helm upgrade --install vote-app ./helm \
  -f helm/values-ingress.yaml \
  --set image.repository=ghcr.io/<org>/<repo> \
  --set image.tag=<tag>
```
