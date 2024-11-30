FROM node:20

WORKDIR /usr/src/app

COPY package*.json ./

# Install dependencies
RUN npm install -g nodemon typescript tsx
RUN npm install

COPY . .

# Build the application
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
