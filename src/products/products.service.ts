/**
 * products/products.service.ts
 * ----
 * @author: V. Puska
 * @date: 03-Jan-2025
 */
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOperator, FindOptionsSelect, In, Like, Repository } from 'typeorm';
import { DOMParser, Element as XMLElement } from '@xmldom/xmldom';
import * as fs from 'node:fs';
import * as zlib from 'node:zlib';

import { Product } from 'src/products/entities/product.entity';
import { HealthService } from './entities/health-service.entity';
import { HospitalTier } from './entities/hospital-tier.entity';
import { AppService } from '../app.service';
import { gunzip } from 'node:zlib';
import { promisify } from 'node:util';

const LIST_FIELDS = [
    'code',
    'name',
    'fundCode',
    'type',
    'isCorporate',
    'brands',
    'state',
    'onlyAvailableWith',
    'onlyAvailableWithProducts',
    'adultsCovered',
    'dependantCover',
    'childCover',
    'studentCover',
    'youngAdultCover',
    'nonStudentCover',
    'nonClassifiedCover',
    'conditionalNonStudentCover',
    'disabilityCover',
    'excess',
    'excessPerAdmission',
    'excessPerPerson',
    'excessPerPolicy',
    'premium',
    'hospitalComponent',
    'hospitalTier',
    'accommodationType',
    'services',
];

/**
 * **ProductService**
 */
@Injectable()
export class ProductsService {
    logger = new Logger('ProductsService');

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        @InjectRepository(HealthService)
        private readonly healthServiceRepository: Repository<HealthService>,
        @InjectRepository(HospitalTier)
        private readonly hospitalTierRepository: Repository<HospitalTier>,
        private readonly appService: AppService,
    ) {}

    /**
     * List OPEN, non-Corporate products table extracting matching policies for state/type/adults/dependants.
     * @param state `NSW | VIC | QLD | TAS | SA | WA | NT`
     * @param type `Hospital | GeneralHealth | Combined | All`
     * @param adultsCovered `0 | 1 | 2`
     * @param dependantCover  Whether dependant cover required
     */
    async list(
        state: string,
        type: string,
        adultsCovered: 0 | 1 | 2,
        dependantCover: boolean,
    ) {
        const filter = {
            state: In(['ALL', state]),
            adultsCovered: adultsCovered,
            dependantCover: dependantCover,
            isCorporate: false,
            status: 'Open',
        };

        if (type !== 'Combined') {
            filter['type'] = type;
            filter['onlyAvailableWith'] = 'NotApplicable';
        }

        return await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: filter,
        });
    }

    /**
     * List all OPEN products table extracting policies for a single fund or brand.  Includes corporate products.  If
     * querying for a fund, all brand products are included.
     * The fundOrBrandCode can be a:
     * - a fund: Eg. `ACA`
     * - a brand: Eg. `NIB01`
     *
     * @param fundCode
     */
    async findByFund(fundCode: string) {
        return await this.productRepository.find({
            select: LIST_FIELDS as FindOptionsSelect<Product>,
            where: {
                fundCode: fundCode,
                status: 'Open',
            }
        })
    }

    /**
     * Find single product.
     * @param fundCode Fund code.
     * @param productCode Product code.
     */
    async findByOne(fundCode, productCode: string) {
        return await this.productRepository.findOneBy({ fundCode: fundCode, code: productCode });
    }

    /**
     * Get the XML data for a single product.
     * @param fundCode Fund code.
     * @param productCode Product code.
     */
    async getXml(fundCode: string, productCode: string) {
        const filename = `${this.appService.productXmlDirectory}/${fundCode}/${productCode}`

        if (this.appService.writeUncompressedProductXml)
            return fs.readFileSync(filename).toString();

        const unzip = promisify(gunzip)
        const data = await unzip(fs.readFileSync(`${filename}.gz`))
        return data.toString();
    }

    /**
     * Add a health service.  Used by {@link PhiLoadService.run}
     * @param key 3 character abbreviated mnemonic for the service
     * @param type `H` | `G`
     * @param tier `None` | `Basic` | `Bronze` | `Silver` | `Gold`
     * @param code PHIO service code
     * @param description Description/label for the service
     */
    async createHealthService(
        key: string,
        type: 'H' | 'G',
        tier: 'None' | 'Basic' | 'Bronze' | 'Silver' | 'Gold',
        code: string,
        description?: string,
    ) {
        const service = this.healthServiceRepository.create();
        service.key = key;
        service.serviceType = type;
        service.serviceCode = code;
        service.hospitalTier = tier;
        service.description = description
            ? description
            : code.replace(/(?!^)([A-Z])/g, ' $1'); // insert space before capital letters
        await this.healthServiceRepository.save(service);
    }

    /**
     * Convert PHIO service code to the server's abbreviated mnemonic.
     * @param type `H` | `G`
     * @param serviceCode PHIO service code
     * @return  The abbreviated mnemonic
     */
    async mapHealthService(type: string, serviceCode: string): Promise<string> {
        return (
            await this.healthServiceRepository.findOne({
                where: {
                    serviceType: type,
                    serviceCode: serviceCode,
                },
            })
        ).key;
    }

    /**
     * Add a hospital tier ranking.  Used by {@link PhiLoadService.run}.
     * @param tier The PHIO HospitalTier. Eg "SilverPlus"
     * @param ranking Assigned tier ranking.
     */
    async createHospitalTier(tier: string, ranking: number) {
        const hospitalTier = this.hospitalTierRepository.create();
        hospitalTier.tier = tier;
        hospitalTier.ranking = ranking;
        await this.hospitalTierRepository.save(hospitalTier);
    }

    /**
     * Return full service mapping table.
     */
    async serviceList() {
        return await this.healthServiceRepository.find();
    }

    /**
     * Sets the `isPresent` flag to `false` on all product records.  Used by {@link PhiLoadService.run}.
     */
    async clearIsPresentFlag() {
        await this.productRepository.update(
            { isPresent: true },
            {
                isPresent: false,
            },
        );
    }

    /**
     * Decommission records that have been orphaned.  Used by {@link PhiLoadService.run}.
     */
    async decommissionOrphans() {
        await this.productRepository.update(
            { isPresent: false },
            {
                status: 'Orphaned',
            },
        );
    }

    /**
     * Create a {@Link Product} from XML data and save to the database.  Used by {@link PhiLoadService.run}.
     * @param xml Product XML
     */
    async createFromXML(xml: any): Promise<Product> {
        let newXml = xml.toString();
        const unicodeErr = newXml.indexOf('\uFFFD');
        if (unicodeErr >= 0) newXml = newXml.replaceAll('\uFFFD', '?');

        const doc = new DOMParser().parseFromString(newXml, 'text/xml');
        const prodNode = doc.getElementsByTagName('Product')[0];
        const prodCode = prodNode.getAttribute('ProductCode');
        const fundCode = prodNode.getElementsByTagName('FundCode')[0].textContent;

        if (unicodeErr >= 0)
            this.logger.warn('Unicode character detected in product ' + prodCode);

        fs.mkdirSync(`${this.appService.productXmlDirectory}/${fundCode}/${prodCode.split("/")[0]}`, {recursive: true});

        // Create an uncompressed product xml file
        if (this.appService.writeUncompressedProductXml)
            fs.writeFileSync( `${this.appService.productXmlDirectory}/${fundCode}/${prodCode}`, newXml);

        // Create a compressed product xml file
        if (this.appService.writeCompressedProductXml) {
            const output = fs.createWriteStream(`${this.appService.productXmlDirectory}/${fundCode}/${prodCode}.gz`);
            const gzip = zlib.createGzip();
            const buffer = Buffer.from(newXml, 'utf-8');
            require("stream").Readable.from(buffer)
                .pipe(gzip)
                .pipe(output)
        }

        const product = this.productRepository.create();

        product.code = prodCode;
        product.fundCode = fundCode;
        product.name = prodNode.getElementsByTagName('Name')[0].textContent;
        product.type = prodNode.getElementsByTagName('ProductType')[0].textContent;
        product.status = prodNode.getElementsByTagName('ProductStatus')[0].textContent;
        product.state = prodNode.getElementsByTagName('State')[0].textContent;
        product.premium = +getContent(prodNode, 'PremiumNoRebate', '0');
        product.hospitalComponent = +getContent(prodNode, 'PremiumHospitalComponent', '0');
        product.excessPerPerson = +getContent(prodNode, 'ExcessPerPerson', '0');
        product.excessPerAdmission = +getContent(prodNode, 'ExcessPerAdmission', '0' );
        product.excessPerPolicy = +getContent(prodNode, 'ExcessPerPolicy', '0');
        product.excess = Math.max(
            product.excessPerPerson,
            product.excessPerAdmission,
            product.excessPerPolicy,
        );
        product.hospitalTier = 'None';
        product.services = '';
        product.isCorporate = prodNode.getElementsByTagName('Corporate')[0].getAttribute('IsCorporate') === "true";
        product.brands = null;

        for (const brand of prodNode.getElementsByTagName('Brands')[0].childNodes) {
            if (product.brands === null)
                product.brands = brand.textContent
            else
                product.brands += `;${brand.textContent}`
        }

        const elem = prodNode.getElementsByTagName("OnlyAvailableWith")[0].firstChild as XMLElement;
        product.onlyAvailableWith = elem.tagName;
        if (elem.tagName === "Products")
            product.onlyAvailableWithProducts = elem.textContent;

        if (product.excess === product.excessPerPolicy && product.adultsCovered === 2)
            product.excess = product.excess / 2;

        if (product.type !== 'GeneralHealth') {
            product.hospitalTier = prodNode.getElementsByTagName('HospitalTier')[0].textContent;
            product.accommodationType = prodNode.getElementsByTagName('Accommodation')[0].textContent;
        }

        const whoIsCoveredNode = prodNode.getElementsByTagName('WhoIsCovered')[0];
        if (whoIsCoveredNode.getAttribute('OnlyOnePerson') === 'true') {
            product.adultsCovered = 1;
        } else {
            const coverageNode = whoIsCoveredNode.getElementsByTagName('Coverage')[0];
            product.adultsCovered = +coverageNode.getAttribute('NumberOfAdults');
            for (const dependant of coverageNode.getElementsByTagName('DependantCover')) {
                const title = dependant.getAttribute('Title');
                const covered = dependant.getAttribute('Covered') === 'true';
                if (title === 'Child') product.childCover = covered;
                else if (title === 'ConditionalNonStudent')
                    product.conditionalNonStudentCover = covered;
                else if (title === 'Disability')
                    product.disabilityCover = covered;
                else if (title === 'NonClassified')
                    product.nonClassifiedCover = covered;
                else if (title === 'NonStudent')
                    product.nonStudentCover = covered;
                else if (title === 'Student') product.studentCover = covered;
                else this.logger.error('Invalid adult coverage:' + title);
            }
        }

        product.youngAdultCover =
            product.nonClassifiedCover ||
            product.nonStudentCover ||
            product.conditionalNonStudentCover;

        product.dependantCover =
            product.childCover ||
            product.studentCover ||
            product.youngAdultCover ||
            product.disabilityCover;

        for (const serviceNode of prodNode.getElementsByTagName('MedicalService')) {
            const covered = serviceNode.getAttribute('Cover');
            const title = serviceNode.getAttribute('Title');
            const modifier = covered === 'Restricted' ? '-' : '';
            if (covered !== 'NotCovered') {
                const key = await this.mapHealthService('H', title);
                product.services = product.services + key + modifier + ';';
            }
        }

        for (const serviceNode of prodNode.getElementsByTagName('GeneralHealthService')) {
            const covered = serviceNode.getAttribute('Covered');
            const title = serviceNode.getAttribute('Title');
            if (covered === 'true') {
                const key = await this.mapHealthService('G', title);
                product.services = product.services + key + ';';
            }
        }

        product.isPresent = true;
        return await this.productRepository.save(product);
    }
}

/**
 * Returns the content of an XML node.
 * @param node The node to search
 * @param tag The tag to search for
 * @param defaultValue The default value to return if not found or empty
 */
function getContent(node: XMLElement, tag: string, defaultValue: string = "") : string | null {
    const nodes = node.getElementsByTagName(tag);
    if (!nodes)
        return defaultValue;
    if (nodes.length === 0)
        return defaultValue;
    return nodes[0].textContent;
}

