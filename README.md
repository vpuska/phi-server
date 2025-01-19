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
 
## Loading PHI Data

To load PHI Data: `bash nest start -- phi-load` or for production: `bash node dist/main phi-load`.

This will download the latest dataset from data.gov.au.

> Note: the data file is several hundred megabytes in size.  Load times can take 10-15 minutes depending
> on you system.

The final database will be ~1.5GB in size.

## Using the API

Swagger docs can be accessed from the site root.  Eg `localhost:3000`.

## Other Notes:
### Docker build script
`docker buildx build --platform linux/amd64 --output "type=image, push=true" --tag <repo>/phi-demo-server:1.0 --builder mybuilder .`