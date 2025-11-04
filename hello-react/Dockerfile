# Step 1: Build the React app
FROM node:18-alpine AS build

WORKDIR /app

# copy package files first for layer caching
COPY package*.json ./
RUN npm install

# copy rest of the source
COPY . .

# 👉 pass backend URL into build
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL

RUN npm run build

# Step 2: Serve the app with nginx
FROM nginx:alpine
COPY --from=build /app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
