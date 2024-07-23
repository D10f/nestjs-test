FROM node:20-slim AS base
ENV PATH=/home/node/app/node_modules/.bin:$PATH
EXPOSE 5000
WORKDIR /home/node/app
RUN chown node:node /home/node/app
RUN apt-get update
COPY --chown=node:node package*.json ./

FROM base AS development
ENV NODE_ENV=development
RUN apt-get install -y --no-install-recommends procps
USER node
RUN npm install
COPY --chown=node:node . .
CMD ["nest", "start", "--watch"]

FROM development AS test
ENV NODE_ENV=test
CMD ["jest"]

FROM development AS builder
ENV NODE_ENV=production
RUN ["nest", "build"]

FROM base AS preproduction
USER node
RUN npm ci --omit dev && rm -rf /home/node/.npm
COPY --from=builder --chown=node:node /home/node/app/dist .

FROM base AS production
RUN apt-get install -y --no-install-recommends tini && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/* /usr/share/doc /usr/share/man
RUN find /usr/local/bin -type l -delete
RUN rm -rf /usr/local/lib/* /opt/*
COPY --from=preproduction --chown=node:node /home/node/app .
USER node
ENTRYPOINT [ "/usr/bin/tini", "--" ]
CMD ["node", "main.js"]
