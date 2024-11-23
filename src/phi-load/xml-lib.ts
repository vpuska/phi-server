/**
 *
 */

type XML2JSObject = {
    type: string;
    name: string;
    text?: string;
    attributes?: Object;
    elements?: Array<XML2JSObject>;
}


class XMLElement {

    readonly type: string;
    readonly tag: string;
    readonly text: string = "";
    readonly attributes: Object = {};
    readonly content: Array<XML2JSObject> = [];

    constructor(xml2jsObject: XML2JSObject) {
        this.type = xml2jsObject.type;
        this.tag = xml2jsObject.name;
        if (xml2jsObject.hasOwnProperty("attributes"))
            this.attributes = xml2jsObject.attributes;
        if (xml2jsObject.hasOwnProperty("elements"))
            this.content = xml2jsObject.elements;
        if (this.content.length === 1 && this.content[0].type === "text") {
            this.text = this.content[0].text;
            this.content = [];
        }
    }

    findAll(tag: string) : XMLElement[] {
        let result: XMLElement[] = [];
        for (const item of this.content) {
            let element = new XMLElement(item);
            if (element.tag === tag)
                result.push(element)
        }
        return result;
    }

    find(tag: string) {
        let result = this.findAll(tag);
        if (result.length > 0)
            return result[0]
        else
            return new XMLElement({
                type: "element",
                name: tag,
            });
    }

    *children(tag?: string) : Generator<XMLElement> {
        if (tag === undefined)
            for (const child of this.content)
                yield new XMLElement(child);
        else
            for (const child of this.findAll(tag))
                yield child;
    }
}

function dump(element, level=0) {
    //console.log(element);
    const spaces = "-".repeat(level * 4);
    let text_element = false;
    let text = "";
    let content = element.hasOwnProperty("elements") ? element.elements : [];
    if (content.length === 1 && content[0].type === "text") {
        text_element = true;
        text = content[0].text;
        if (text.length > 40)
            text = text.substring(0, 37) + "...";
    }
    let has_attributes = element.hasOwnProperty("attributes");
    if (text_element)
        console.log(`${spaces}name: ${element.name} [text=${text}]`);
    else
        console.log(`${spaces}name: ${element.name} [${element.type}] [attributes="${has_attributes}"] [elements=${content.length}]`)
    if (!text_element)
        for (const el of content)
            dump(el, level + 1)
}


let doit = true;
export function fund_callback(element) {
    if (!doit)
        return;
    //doit = false;

    //dump(element, 0);
    let fund = new XMLElement(element);
    console.log(fund.find("FundName").text);
    let brands = fund.find("RelatedBrandNames");
    for (let brand of brands.children()) {
        console.log("--- ", brand.find("BrandCode").text, "-", brand.find("BrandName").text);
    }
}

