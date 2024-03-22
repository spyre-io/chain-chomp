FROM node:20

WORKDIR /app

COPY package.json package-lock.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install

COPY . .

EXPOSE 80
ENTRYPOINT [ "node", "app.js" ]
