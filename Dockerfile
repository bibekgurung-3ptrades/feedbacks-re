# syntax=docker/dockerfile:1
# The module: Next.js's standalone server on Node, installed from package-lock.json. The estate
# builds it with `image --module .`, from a build context holding this directory as feedbacks/, so
# keep the directory named feedbacks. The context holds the SDK packed into feedbacks/.packs until the
# @captify-io packages are published. Once they are, drop the line that copies .packs.
FROM docker.io/library/node:26.10.0-bookworm-slim@sha256:0a992e1420e2d70611578f1844a6f10a9d11fe6bb535aabf72efe3007f13d79b AS build
USER node
WORKDIR /home/node/feedbacks
COPY --chown=node feedbacks/package.json feedbacks/package-lock.json ./
COPY --chown=node feedbacks/.packs/ .packs/
RUN npm ci --ignore-scripts
COPY --chown=node feedbacks/ ./
ENV NEXT_TELEMETRY_DISABLED=1
RUN node node_modules/next/dist/bin/next build

FROM docker.io/library/node:26.10.0-bookworm-slim@sha256:0a992e1420e2d70611578f1844a6f10a9d11fe6bb535aabf72efe3007f13d79b
# Only node runs here, so npm and the packages it bundles are removed.
RUN rm -r /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1 PORT=3000 HOSTNAME=0.0.0.0
# Owned by root, so the process cannot change its own code. Next's cache needs a tmpfs.
COPY --from=build --chown=root:root /home/node/feedbacks/.next/standalone/ /app/
COPY --from=build --chown=root:root /home/node/feedbacks/.next/static/ /app/.next/static/
# The manifest, which the gate describes the module with to an operator installing it.
COPY --from=build --chown=root:root /home/node/feedbacks/captify.module.json /app/captify.module.json
# The app's migrations, and the SDK's command the manifest's migrate runs on install and upgrade,
# which the standalone server leaves out.
COPY --from=build --chown=root:root /home/node/feedbacks/migrations/ /app/migrations/
COPY --from=build --chown=root:root /home/node/feedbacks/node_modules/@captify-io/sdk/dist/migrate-main.js /app/node_modules/@captify-io/sdk/dist/
USER node
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=3s --start-period=10s CMD ["node", "-e", "\
  require('node:http').get({ host: '127.0.0.1', port: process.env.PORT, path: '/feedbacks/api/health' }, \
    (r) => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"]
ENTRYPOINT ["node", "--no-webstorage", "/app/server.js"]
