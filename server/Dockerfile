FROM node:20

WORKDIR /usr/src/app

RUN rm -rf node_modules

COPY . .

RUN npm install

RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
