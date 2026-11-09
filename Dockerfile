# aao-web — build Vite + nginx estático
FROM node:22-slim AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
# URL da API embutida no build (variável de build, não de runtime)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}
# manifest dos executáveis desktop (MinIO); sem ela o botão de download some
ARG VITE_RELEASES_MANIFEST_URL
ENV VITE_RELEASES_MANIFEST_URL=${VITE_RELEASES_MANIFEST_URL}
RUN npm run build

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
