# PHI-DEMO-SERVER

## The Application
This is a demonstration/sample API server built with [NestJs](https://www.nestjs.com).

The API serves information about **Australian private health insurance** funds and products. 
Its sole purpose is as a platform to **_provide a non-trivial dataset for personal research, 
investigation and education into web application development technologies_**.

## Australian Private Health Insurance
To allow for easier comparison of health insurance products, all Australian health insurers are required by law to create
a **Private Health Information Statement** for each of their products. These statements are collated by the Australian Private Health 
Insurance Ombudsman (PHIO) and published on [data.gov.au](https://data.gov.au). Further information about PHIO can be found 
at [https://www.privatehealth.gov.au/](https://www.privatehealth.gov.au).

This information provides a convenient dataset to investigate, test and tinker with web application development technologies.

> This site and application has no connection to the Australian Private Health Insurance Ombudsman, and is purely a personal, 
> non-commercial, non-official project. Data provided by this API is not to be relied upon for any comparison of, 
> or research into, private health insurance products. Please use https://www.privatehealth.gov.au or one of the 
> commercial product comparison services.

## Project Setup

The project is organised in accordance with NestJS guidelines.  Simply download the project and work according to NestJS documentation.

> Note: the project uses sqlite3 by default.  You may also use MariaDB, but it has not been adequately tested.  I recommend using
> sqlite3 given the nature of the data and project.

## Environment File

```
DATABASE=SQLITE
DATABASE_NAME=phidb.sqlite3
CACHE_DIR=cache
PRODUCT_XML_CACHE=compressed
PRODUCT_FUND_CACHE=compressed
PRODUCT_SEARCH_CACHE=compressed
```

## Loading PHI Data

To load PHI Data: `bash nest start -- phi-load` or for production: `bash node dist/main phi-load`.

This will download the latest dataset from data.gov.au.

> Note: the data file is several hundred megabytes in size.  Load times can take 10-15 minutes depending
> on you system.

## Using the API

Swagger docs can be accessed from the site root.  Eg `localhost:3000`.

## Using Docker:
### Sample Docker build script
`docker buildx build --platform linux/amd64 --output "type=image, push=true" --tag <repo>/phi-demo-server:1.0 --builder mybuilder .`

### Sample Dockerfile
```
##############################
# BUILD FOR LOCAL DEVELOPMENT
##############################
FROM node:20-alpine AS development

# Create app directory
WORKDIR /usr/src/app

# Copy application dependency manifests to the container image.
# A wildcard is used to ensure copying both package.json AND package-lock.json (when available).
# Copying this first prevents re-running npm install on every code change.
COPY --chown=node:node package*.json ./

# Install app dependencies using the `npm ci` command instead of `npm install`
RUN npm ci

# Bundle app source
COPY --chown=node:node . .

########################
# BUILD FOR PRODUCTION
########################
USER node
FROM node:20-alpine AS build

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./

# In order to run `npm run build` we need access to the Nest CLI which is a dev dependency.
# In the previous development stage we ran `npm ci` which installed all dependencies,
# so we can copy over the node_modules directory from the development image
COPY --chown=node:node --from=development /usr/src/app/node_modules ./node_modules

COPY --chown=node:node . .

# Run the build command which creates the production bundle
RUN npm run build

# Set NODE_ENV environment variable
ENV NODE_ENV=production

# Running `npm ci` removes the existing node_modules directory and passing in --only=production
# ensures that only the production dependencies are installed. This ensures that the
# node_modules directory is as optimized as possible
RUN npm ci --only=production && npm cache clean --force

###################
# PRODUCTION
###################
USER node
FROM node:20-alpine AS production

RUN apk add --no-cache tzdata
ENV TZ=Australia/Melbourne

# Copy the bundled code from the build stage to the production image
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

RUN mkdir "phidata"
# Start the server using the production build
CMD [ "node", "dist/main.js" ]
```