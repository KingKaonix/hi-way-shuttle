FROM node:20-alpine
WORKDIR /app

# Copy all package.json files for workspace dependency resolution
COPY package*.json ./
COPY packages/shared/package.json packages/shared/
COPY packages/api/package.json packages/api/
COPY packages/web/package.json packages/web/

# Install ALL dependencies (including dev) so workspace deps get hoisted to root
RUN npm ci

# Copy the rest of the app
COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
