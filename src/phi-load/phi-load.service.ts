/**
 * phi-load/phi-load.service.ts
 * ----------------
 * Here we load the dataset provided by the Australian Private Health Insurance Ombudsman (PHIO).  Data is provided
 * in a ```zip``` file streamed through {@link JSZip} and {@link xtreamer}.
 *
 * Further information:
 *
 * - Private Health Insurance Ombudsman:
 *
 *   https://www.privatehealth.gov.au/
 *
 * - PHI Datasets (data.gov.au)
 *
 *   https://data.gov.au/dataset/ds-dga-8ab10b1f-6eac-423c-abc5-bbffc31b216c/details?q=private%20health%20insurance
 */
import JSZip = require('jszip');
import xtreamer = require("xtreamer");
import {FundsService} from "../funds/funds.service";
import {ProductsService} from "../products/products.service";

import {pipeline} from 'node:stream/promises';
import {Injectable} from '@nestjs/common';
import {Logger} from "@nestjs/common"

// Link to PHIO datasets hosted on data.gov.au
const URL = "https://data.gov.au/api/3/action/package_show?id=private-health-insurance";

/**
 * <b>PhiLoadService</b> class.  Handles the load of PHIO data.  See {@link PhiLoadService.run}
 */
@Injectable()
export class PhiLoadService {

    logger = new Logger("PHI Load");
    force_mode = false;

    constructor(
        private readonly fundsService: FundsService,
        private readonly productsService: ProductsService,
    ){}
    /**
     * Streams data from a ```zip``` file to {@link xtreamer} extracting the requested tag (```<Fund>```
     * or ```<Product>```) from the file and passed to the load function
     *
     * Called by {@link PhiLoadService.run}.
     *
     * @param zip {@link JSZip} instance
     * @param filename File name in the zip to process
     * @param tag Tag to process
     * @param callback Callback function to load the data
     * @private
     */
    private async unzip(zip: JSZip, filename: string, tag: string, callback: Function) {
        const xt = xtreamer(tag);
        let count = 0;
        let startTime = new Date().getTime();
        xt.on("data",(data) => {
            callback(data);
            count++;
            if (new Date().getTime() - startTime > 30000) {
                this.logger.log(`Processing '${filename}', loaded ${count} <${tag}> elements so far.`);
                startTime = new Date().getTime();
            }
        });
        // stream zip file to xtreamer..
        await pipeline(zip.file(filename).nodeStream(), xt);
        this.logger.log(`Processed '${filename}' - read ${count} <${tag}> elements`);
    }
    /**
     * Run the load process.
     * @param mode Blank or ```force```.    If ```force``` mode, update logic if run even though the
     * XML for the record is unchanged.  Useful when logic has been changed and needs to be re-run.
     */
    async run(mode = "") {

        this.force_mode = mode === "force";
        this.logger.log(`Started. Running in '${this.force_mode? "force" : "normal"}' mode`);

        // load services
        await this.productsService.createHealthService('ACU','G','Acupuncture');
        await this.productsService.createHealthService('ANT','G','AntenatalPostnatal');
        await this.productsService.createHealthService('AUD','G','Audiology');
        await this.productsService.createHealthService('CHI','G','ChineseHerbalMedicine');
        await this.productsService.createHealthService('CHR','G','Chiropractic');
        await this.productsService.createHealthService('DEG','G','DentalGeneral');
        await this.productsService.createHealthService('DEM','G','DentalMajor');
        await this.productsService.createHealthService('DIE','G','Dietetics');
        await this.productsService.createHealthService('END','G','Endodontic');
        await this.productsService.createHealthService('EXP','G','ExercisePhysiology');
        await this.productsService.createHealthService('GCM','G','GlucoseMonitor');
        await this.productsService.createHealthService('HMA','G','HealthManagement');
        await this.productsService.createHealthService('HEA','G','HearingAids');
        await this.productsService.createHealthService('HNN','G','HomeNursing');
        await this.productsService.createHealthService('NPB','G','NonPBS');
        await this.productsService.createHealthService('OCT','G','OccupationalTherapy');
        await this.productsService.createHealthService('OPT','G','Optical');
        await this.productsService.createHealthService('ORD','G','Orthodontic');
        await this.productsService.createHealthService('OOP','G','Orthoptics');
        await this.productsService.createHealthService('ORT','G','Orthotics');
        await this.productsService.createHealthService('OST','G','Osteopathy');
        await this.productsService.createHealthService('PHY','G','Physiotherapy');
        await this.productsService.createHealthService('POD','G','Podiatry');
        await this.productsService.createHealthService('PSY','G','Psychology');
        await this.productsService.createHealthService('REM','G','RemedialMassage');
        await this.productsService.createHealthService('SPT','G','SpeechTherapy');
        await this.productsService.createHealthService('VAC','G','Vaccinations');
        await this.productsService.createHealthService('ASR','H','AssistedReproductive');
        await this.productsService.createHealthService('BNS','H','BackNeckSpine');
        await this.productsService.createHealthService('BLO','H','Blood');
        await this.productsService.createHealthService('BJM','H','BoneJointMuscle');
        await this.productsService.createHealthService('BNV','H','BrainNervousSystem');
        await this.productsService.createHealthService('BSS','H','BreastSurgery');
        await this.productsService.createHealthService('CAT','H','Cataracts');
        await this.productsService.createHealthService('CHE','H','ChemotherapyRadiotherapyImmunotherapy');
        await this.productsService.createHealthService('DES','H','DentalSurgery');
        await this.productsService.createHealthService('DIA','H','Diabetes');
        await this.productsService.createHealthService('DIL','H','Dialysis');
        await this.productsService.createHealthService('DGS','H','DigestiveSystem');
        await this.productsService.createHealthService('ENT','H','EarNoseThroat');
        await this.productsService.createHealthService('EYE','H','Eye');
        await this.productsService.createHealthService('GAS','H','GastrointestinalEndoscopy');
        await this.productsService.createHealthService('GYN','H','Gynaecology');
        await this.productsService.createHealthService('HVA','H','HeartVascular');
        await this.productsService.createHealthService('HIA','H','HerniaAppendix');
        await this.productsService.createHealthService('HPS','H','HospitalPsychiatric');
        await this.productsService.createHealthService('IHD','H','ImplantationHearingDevices');
        await this.productsService.createHealthService('INS','H','InsulinPumps');
        await this.productsService.createHealthService('JRC','H','JointReconstructions');
        await this.productsService.createHealthService('JRE','H','JointReplacements');
        await this.productsService.createHealthService('KID','H','KidneyBladder');
        await this.productsService.createHealthService('LUN','H','LungChest');
        await this.productsService.createHealthService('MAR','H','MaleReproductive');
        await this.productsService.createHealthService('MTP','H','MiscarriageTerminationOfPregnancy');
        await this.productsService.createHealthService('PMM','H','PainManagement');
        await this.productsService.createHealthService('PMD','H','PainManagementWithDevice');
        await this.productsService.createHealthService('PAL','H','PalliativeCare');
        await this.productsService.createHealthService('PLA','H','PlasticReconstructiveSurgery');
        await this.productsService.createHealthService('POS','H','PodiatricSurgery');
        await this.productsService.createHealthService('PRG','H','PregnancyBirth');
        await this.productsService.createHealthService('REH','H','Rehabilitation');
        await this.productsService.createHealthService('SKN','H','Skin');
        await this.productsService.createHealthService('SPS','H','SleepStudies');
        await this.productsService.createHealthService('TON','H','TonsilsAdenoidsGrommets');
        await this.productsService.createHealthService('WEI','H','WeightLossSurgery');

        // fetch the data package description file (JSON) from data.gov.au;
        let response = await fetch(URL);
        if (!response.ok) {
            this.logger.error("Error fetching data package from data.gov.au:" + response.statusText);
            return;
        }
        const package_description = await response.json();

        // The resource entry is an array of zip file names - one for each month.
        // Index 0 is the latest version and the one we fetch
        const resource = package_description['result']['resources'][0];
        this.logger.log("Latest data version = " + resource['description']);
        response = await fetch(resource['url']);
        if (!response.ok) {
            this.logger.error("Error fetching data resource from from data.gov.au:" + response.statusText);
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

        // Process each of the files we are interested in.
        await this.unzip(zip, files[0], "Fund", (xml:any) => { this.fundsService.createFromXML(xml) });
        await this.unzip(zip, files[1], "Product", (xml:any) => { this.productsService.createFromXML(xml, this.force_mode) });
        await this.unzip(zip, files[2], "Product", (xml:any) => { this.productsService.createFromXML(xml, this.force_mode) });
        await this.unzip(zip, files[3], "Product", (xml:any) => { this.productsService.createFromXML(xml, this.force_mode) });
        this.logger.log("Complete");
    }

}
