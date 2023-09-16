FROM node:18
RUN mkdir /opt/app
WORKDIR /opt/app
COPY index.js package.json ./
RUN npm install
EXPOSE 3000
ENTRYPOINT [ "node", "index.js" ]