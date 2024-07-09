FROM node:14

WORKDIR /usr/src/app

COPY package*.json ./

RUN apt-get update && apt-get install -y postgresql-client

RUN npm install

COPY . .

RUN npm run build

RUN npm install -g ts-node

EXPOSE 3000

# Ensure migrations are copied to the dist folder
RUN cp -R src/migrations dist/

# Create a shell script to run migration and start the application
RUN echo '#!/bin/sh\n\
node dist/run-migrations.js\n\
npm start\n\
' > /usr/src/app/start.sh

RUN chmod +x /usr/src/app/start.sh

CMD ["/usr/src/app/start.sh"]