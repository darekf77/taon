FROM node:20-slim

WORKDIR /app

COPY package.json yarn.lock ./
RUN yarn install --production

COPY . .

COPY .env.medusa .env

EXPOSE 9000

CMD ["node", "dist/index.js"]
