FROM mcr.microsoft.com/playwright:v1.63.0-noble
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ENV CI=true
CMD ["sleep", "infinity"]
