FROM node:12.6.0-alpine as build

ARG BUILDVERSION=0.0.0

WORKDIR /app

# Copy dependency files
COPY ./package.json ./package-lock.json ./

# Clean install depdenencies
RUN npm ci --silent

# Copy the rest of the files
COPY ./ .

# Update the build version and build the application
# RUN npm version $BUILDVERSION --allow-same-version
RUN npm run build

# Put together the release image with the just build artifacts
FROM node:12.6.0-alpine

WORKDIR /app

# Copy dependency files
COPY ./package.json ./package-lock.json ./

# Clean install production-only dependencies
RUN npm ci --silent --only=production

# Copy built project
COPY --from=build /app/dist ./dist

EXPOSE 80

CMD [ "node", "dist/index.js" ]