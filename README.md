# PHI-SERVER
> Note: PHI = (Australian) Private Health Insurance

This is a hobby project to experiment with building applications in typescript/javascript.  It will ultimately form the server/back-end component of 
a larger client and server application.  A client (possibly SPA/PWA) project will follow.

## The Application

The application serves information about Australian private health insurance (PHI) products with the intention of being able to compare 
products to select the one most appropriate to you.  Several companies provide this service - E.g. iSelect, Compare the Market - but you can
use the non-commercial Commonwealth Ombudsman's site at [www.privatehealth.gov.au](https://www.privatehealth.gov.au/) to investigate the private health insurance data
domain.  Ultimately, this application will be able to perform similar comparisons to the government site:

### Why Private Health Insurance?

1) I have some domain knowledge.
2) The information is publicly available.
3) The data is complex enough to be challenging, but not so complex that it is unwieldy.
4) We have a site - www.privatehealth.gov.au - to compare with.
5) It should make for a interesting front-end project.

### Release 1.0.0 Capability

For this release, the application can:

* Download PHI data from the government website and load into the application's database. 
* Provide a list of Australian health funds - ```funds```
* Search for policies:
  * ```products/search/single/:state```
  * ```products/search/couple/:state```
  * ```products/search/family/:state```
  * ```products/search/singleparent/:state```
* Retrieve detailed information for an individual policy - ```products/:product```

See code comments for further details.

## Project Setup

The project is organised in accordance with NestJS guidelines.  Simply download the project and work according to NestJS documentation.

> Note: the project uses sqlite3 by default.  You may also use MariaDB, but it has not been adequately tested.  I recommend using
> sqlite3 given the nature of the data and project.
 
## Loading PHI Data

To load PHI Data, run the ```load``` script.  This will download the latest dataset from data.gov.au.

> Note: the data file is several hundred megabytes in size.  Load times can take 10-15 minutes depending
> on you system.

The final database will be ~700MB in size.
