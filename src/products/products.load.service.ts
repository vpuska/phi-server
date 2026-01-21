import { Injectable, Logger } from '@nestjs/common';
import { Product } from './entities/product.entity';
import { DOMParser, Element as XMLElement } from '@xmldom/xmldom';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductsService } from './products.service';
import { ProductsCacheService } from './products.cache.service';

@Injectable()
export class ProductsLoadService {

    logger = new Logger(this.constructor.name);

    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>,
        private readonly productsService: ProductsService,
        private readonly productsCacheService: ProductsCacheService,
    ){}

    /**
     * Create a {@Link Product} from XML data and save to the database.
     * Used by {@link ImportService.run}.
     * @param xml Product XML
     * @param timeStamp
     */
    async createFromXML(xml: any, timeStamp: Date): Promise<Product> {
        let newXml = xml.toString();
        const unicodeErr = newXml.indexOf('\uFFFD');
        if (unicodeErr >= 0) newXml = newXml.replaceAll('\uFFFD', '?');

        const doc = new DOMParser().parseFromString(newXml, 'text/xml');
        const prodNode = doc.getElementsByTagName('Product')[0];
        const prodCode = prodNode.getAttribute('ProductCode');
        const fundCode = prodNode.getElementsByTagName('FundCode')[0].textContent;

        if (unicodeErr >= 0)
            this.logger.warn(`Unicode character detected in ${fundCode}/${prodCode}`);

        this.productsCacheService.writeProductXmlCache(fundCode, prodCode, newXml)

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
        product.timeStamp = timeStamp;

        for (const brand of prodNode.getElementsByTagName('Brands')[0].childNodes) {
            if (product.brands === null)
                product.brands = brand.textContent
            else
                product.brands += `;${brand.textContent}`
        }
        product.fundBrandCode = product.brands ? product.brands : product.fundCode;

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
                const key = await this.productsService.mapHealthService('H', title);
                product.services = product.services + key + modifier + ';';
            }
        }

        for (const serviceNode of prodNode.getElementsByTagName('GeneralHealthService')) {
            const covered = serviceNode.getAttribute('Covered');
            const title = serviceNode.getAttribute('Title');
            if (covered === 'true') {
                const key = await this.productsService.mapHealthService('G', title);
                product.services = product.services + key + ';';
            }
        }

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

