FROM keymetrics/pm2:latest-alpine
RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app
COPY package.json /usr/src/app/
ENV NPM_CONFIG_LOGLEVEL warn
RUN npm install --production
COPY . /usr/src/app
EXPOSE 3000 3001 8080
ENTRYPOINT [ "pm2-runtime", "start", "pm2.config.js" ]
