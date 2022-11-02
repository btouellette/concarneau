# Dockerfile

FROM node:16
WORKDIR /opt/concarneau
COPY package*.json ./
RUN npm install
RUN useradd -m -s /bin/bash concarneau-user
COPY . ./
RUN npm install --save pm2
RUN chown -R concarneau-user /opt/concarneau
USER concarneau-user
EXPOSE 8082
CMD [ "npm", "run", "pm2" ]
