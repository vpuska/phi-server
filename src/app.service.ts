/**
 * app.service.ts
 * @author: V.Puska
 * @Date: 01-Nov-2024
 */

import { Injectable } from '@nestjs/common';
//import {DataSource} from "typeorm";
//import {InjectDataSource} from "@nestjs/typeorm";

@Injectable()
export class AppService {

    public productXmlCompression = process.env.PRODUCT_XML_COMPRESSION || "off";
    public productXmlDirectory = process.env.PRODUCT_XML_DIRECTORY || "xml/products2";

    //constructor(@InjectDataSource() private datasource: DataSource) {
    constructor() {
    }

    root(): string {
        return 'Hello from phi-demo-server!';
    }

    get writeUncompressedProductXml() {
        return (this.productXmlCompression === "off" || this.productXmlCompression === "both");
    }

    get writeCompressedProductXml() {
        return (this.productXmlCompression === "on" || this.productXmlCompression === "both");
    }
}
