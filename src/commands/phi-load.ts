/***
 File: phi-load.ts
     written-by:    Victor Puska
     date-written:  23 Nov 2024

 Purpose:
     Load private health insurance (PHI) fund and policy information into the database.

 Further information:
     Private Health Insurance Ombudsman:
     https://www.privatehealth.gov.au/

     PHI Datasets (data.gov.au)
     https://data.gov.au/dataset/ds-dga-8ab10b1f-6eac-423c-abc5-bbffc31b216c/details?q=private%20health%20insurance

 ***/

import {pipeline} from 'node:stream/promises';
import JSZip = require("jszip");
import xtreamer = require("xtreamer");
import xmljs = require("xml-js");
import {NestFactory} from "@nestjs/core";
import {AppModule} from "../app.module";
import {FundsService} from "../funds/funds.service";
import {INestApplicationContext} from "@nestjs/common";
import {XML2JSObject} from "../libs/xml-lib";

// URL of PHI data package
const url = "https://data.gov.au/api/3/action/package_show?id=private-health-insurance";


async function unzip(zip: JSZip, filename: string, tag: string, callback: Function) {
    const xt = xtreamer(tag);
    let count = 0;
    xt.on("data",(data) => {
        count++;
        callback(xmljs.xml2js(data).elements[0]);
    });
    await pipeline(zip.file(filename).nodeStream(), xt);
    console.log(`Read '${filename}' - processed ${count} <${tag}> elements`);
}


async function run(app: INestApplicationContext) {
    // fetch the data package description file (JSON) from data.gov.au;
    let response = await fetch(url);
    if (!response.ok) {
        console.log("Error fetching data package from data.gov.au:", response.statusText);
        return;
    }
    const package_description = await response.json();

    // The resource entry is an array of zip file names - one for each month.
    // Index 0 is the latest version and the one we fetch
    const resource = package_description['result']['resources'][0];
    console.log("Latest data version = ", resource['description']);
    response = await fetch(resource['url']);
    if (!response.ok) {
        console.log("Error fetching data resource from from data.gov.au:", response.statusText);
        return;
    }
    const buffer = await response.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    // extract the name of the files we are interested in into an array.  Reserve the first
    // slot for the fund file as that needs to be loaded first.
    let files = [ "fund file goes here" ];
    zip.forEach((relativePath, zipEntry) => {
        if (zipEntry.name.startsWith("Funds "))
            files[0] = zipEntry.name;
        if (zipEntry.name.startsWith("Combined Open ") ||
            zipEntry.name.startsWith("GeneralHealth Open ") ||
            zipEntry.name.startsWith("Hospital Open")) {
            files.push(zipEntry.name);
        }
    });
    console.log(files);

    // process each file
    await unzip(zip, files[0], "Fund", (xml:XML2JSObject) => { app.get(FundsService).createFromXML(xml) });
    //await unpack(zip, files[1], "Product", product_callback);
    //await unpack(zip, files[2], "Product", product_callback);
    //await unpack(zip, files[3], "Product", product_callback);
}


async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    await run(app);
}


bootstrap().then(()=>{
    console.log("--- Complete!")
});