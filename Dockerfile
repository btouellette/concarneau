# Dockerfile

FROM node:16.15-alpine3.14
WORKDIR /opt/concarneau
RUN adduser -S concarneau-user
COPY . ./
RUN npm install
RUN npm install --save pm2
RUN chown -R concarneau-user /opt/concarneau
USER concarneau-user
EXPOSE 3000
CMD [ "npm", "run", "pm2" ]
