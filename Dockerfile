FROM node:lts
WORKDIR /app
COPY . ./
RUN npm ci
CMD ["npm", "run", "server:start"]