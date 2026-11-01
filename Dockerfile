FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY server.mjs index.html manus-routes.json ./
COPY src ./src
COPY public ./public
COPY assets ./assets
ARG COSMOS_RELEASE_SHA=unknown
ENV NODE_ENV=production
ENV COSMOS_RELEASE_SHA=$COSMOS_RELEASE_SHA
EXPOSE 3000
CMD ["node", "server.mjs"]
