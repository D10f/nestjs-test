FROM node:20-slim AS base

ARG PORT=5000
ENV PORT=$PORT
EXPOSE $PORT

ARG WORK_DIR=/home/node/app
ENV WORK_DIR=$WORK_DIR
WORKDIR $WORK_DIR

ARG NODE_ENV=production
ENV NODE_ENV=$NODE_ENV

RUN chown node:node $WORK_DIR
RUN apt-get update
COPY --chown=node:node package*.json ./

FROM base AS development
ENV PATH=/home/node/app/node_modules/.bin:$PATH
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
