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
     */
    async run() {

        this.logger.log(`Started.`);

        // clear the 'touch' flag
        this.logger.log("Clearing 'isPreset' flag on product records");
        await this.productsService.clearIsPresentFlag();

        // load hospital tiers
        await this.productsService.createHospitalTier("Basic", 100);
        await this.productsService.createHospitalTier("BasicPlus", 150);
        await this.productsService.createHospitalTier("Bronze", 200);
        await this.productsService.createHospitalTier("BronzePlus", 250);
        await this.productsService.createHospitalTier("Silver", 300);
        await this.productsService.createHospitalTier("SilverPlus", 350);
        await this.productsService.createHospitalTier("Gold", 400);
        await this.productsService.createHospitalTier("None", 0);
        // load general services
        await this.productsService.createHealthService('ACU','G', 'None', 'Acupuncture');
        await this.productsService.createHealthService('ANT','G', 'None', 'AntenatalPostnatal', 'Ante-natal/Post-natal classes ');
        await this.productsService.createHealthService('AUD','G', 'None', 'Audiology');
        await this.productsService.createHealthService('CHI','G', 'None', 'ChineseHerbalMedicine');
        await this.productsService.createHealthService('CHR','G', 'None', 'Chiropractic');
        await this.productsService.createHealthService('DEG','G', 'None', 'DentalGeneral', 'Dental - General');
        await this.productsService.createHealthService('DEM','G', 'None', 'DentalMajor', 'Dental - Major');
        await this.productsService.createHealthService('DIE','G', 'None', 'Dietetics');
        await this.productsService.createHealthService('END','G', 'None', 'Endodontic');
        await this.productsService.createHealthService('EXP','G', 'None', 'ExercisePhysiology');
        await this.productsService.createHealthService('GCM','G', 'None', 'GlucoseMonitor');
        await this.productsService.createHealthService('HMA','G', 'None', 'HealthManagement');
        await this.productsService.createHealthService('HEA','G', 'None', 'HearingAids');
        await this.productsService.createHealthService('HNN','G', 'None', 'HomeNursing');
        await this.productsService.createHealthService('NPB','G', 'None', 'NonPBS', 'Non PBS pharmaceuticals');
        await this.productsService.createHealthService('OCT','G', 'None', 'OccupationalTherapy');
        await this.productsService.createHealthService('OPT','G', 'None', 'Optical');
        await this.productsService.createHealthService('ORD','G', 'None', 'Orthodontic');
        await this.productsService.createHealthService('OOP','G', 'None', 'Orthoptics');
        await this.productsService.createHealthService('ORT','G', 'None', 'Orthotics');
        await this.productsService.createHealthService('OST','G', 'None', 'Osteopathy');
        await this.productsService.createHealthService('PHY','G', 'None', 'Physiotherapy');
        await this.productsService.createHealthService('POD','G', 'None', 'Podiatry');
        await this.productsService.createHealthService('PSY','G', 'None', 'Psychology');
        await this.productsService.createHealthService('REM','G', 'None', 'RemedialMassage');
        await this.productsService.createHealthService('SPT','G', 'None', 'SpeechTherapy');
        await this.productsService.createHealthService('VAC','G', 'None', 'Vaccinations');
        // load hospital services
        await this.productsService.createHealthService('ASR','H', 'Gold',   'AssistedReproductive', 'Assisted Reproductive Services');
        await this.productsService.createHealthService('BNS','H', 'Silver', 'BackNeckSpine', 'Back, Neck & Spine');
        await this.productsService.createHealthService('BLO','H', 'Silver', 'Blood');
        await this.productsService.createHealthService('BJM','H', 'Bronze', 'BoneJointMuscle', 'Bone, Joint & Muscle');
        await this.productsService.createHealthService('BNV','H', 'Bronze', 'BrainNervousSystem', 'Brain & Nervous System');
        await this.productsService.createHealthService('BSS','H', 'Bronze', 'BreastSurgery', 'Breast Surgery (medically necessary');
        await this.productsService.createHealthService('CAT','H', 'Gold',   'Cataracts');
        await this.productsService.createHealthService('CHE','H', 'Bronze', 'ChemotherapyRadiotherapyImmunotherapy', 'Chemotherapy, Radiotherapy and Immunotherapy for cancer');
        await this.productsService.createHealthService('DES','H', 'Silver', 'DentalSurgery');
        await this.productsService.createHealthService('DIA','H', 'Bronze', 'Diabetes', 'Diabetes Management (excluding insulin pumps');
        await this.productsService.createHealthService('DIL','H', 'Gold',   'Dialysis');
        await this.productsService.createHealthService('DGS','H', 'Bronze', 'DigestiveSystem');
        await this.productsService.createHealthService('ENT','H', 'Bronze', 'EarNoseThroat', 'Ear, Nose & Throat');
        await this.productsService.createHealthService('EYE','H', 'Bronze', 'Eye', 'Eye (not cataracts)');
        await this.productsService.createHealthService('GAS','H', 'Bronze', 'GastrointestinalEndoscopy');
        await this.productsService.createHealthService('GYN','H', 'Bronze', 'Gynaecology');
        await this.productsService.createHealthService('HVA','H', 'Silver', 'HeartVascular', 'Heart & Vascular System');
        await this.productsService.createHealthService('HIA','H', 'Bronze', 'HerniaAppendix', 'Hernia & Appendix');
        await this.productsService.createHealthService('HPS','H', 'Basic',  'HospitalPsychiatric', 'Hospital Psychiatric Services');
        await this.productsService.createHealthService('IHD','H', 'Silver', 'ImplantationHearingDevices', 'Implantation of Hearing Devices');
        await this.productsService.createHealthService('INS','H', 'Gold',   'InsulinPumps');
        await this.productsService.createHealthService('JRC','H', 'Silver', 'JointReconstructions');
        await this.productsService.createHealthService('JRE','H', 'Gold',   'JointReplacements');
        await this.productsService.createHealthService('KID','H', 'Bronze', 'KidneyBladder', 'Kidney & Bladder');
        await this.productsService.createHealthService('LUN','H', 'Silver', 'LungChest', 'Lung & Chest');
        await this.productsService.createHealthService('MAR','H', 'Bronze', 'MaleReproductive', 'Male Reproductive System');
        await this.productsService.createHealthService('MTP','H', 'Bronze', 'MiscarriageTerminationOfPregnancy', 'Miscarriage & Termination Of Pregnancy');
        await this.productsService.createHealthService('PMM','H', 'Bronze', 'PainManagement');
        await this.productsService.createHealthService('PMD','H', 'Gold',   'PainManagementWithDevice');
        await this.productsService.createHealthService('PAL','H', 'Basic',  'PalliativeCare');
        await this.productsService.createHealthService('PLA','H', 'Silver', 'PlasticReconstructiveSurgery', 'Plastic & Reconstructive Surgery');
        await this.productsService.createHealthService('POS','H', 'Silver', 'PodiatricSurgery', 'Podiatric Surgery (provided by a registered podiatric surgeon – limited benefits)');
        await this.productsService.createHealthService('PRG','H', 'Gold',   'PregnancyBirth', 'Pregnancy & Birth');
        await this.productsService.createHealthService('REH','H', 'Basic',  'Rehabilitation');
        await this.productsService.createHealthService('SKN','H', 'Bronze', 'Skin');
        await this.productsService.createHealthService('SPS','H', 'Gold',   'SleepStudies');
        await this.productsService.createHealthService('TON','H', 'Bronze', 'TonsilsAdenoidsGrommets', 'Tonsils, Adenoids & Grommets');
        await this.productsService.createHealthService('WEI','H', 'Gold',   'WeightLossSurgery');

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
        await this.unzip(zip, files[1], "Product", (xml:any) => { this.productsService.createFromXML(xml) });
        await this.unzip(zip, files[2], "Product", (xml:any) => { this.productsService.createFromXML(xml) });
        await this.unzip(zip, files[3], "Product", (xml:any) => { this.productsService.createFromXML(xml) });

        this.logger.log("Flagging orphaned product records.");
        await this.productsService.decommissionOrphans();
        this.logger.log("Complete");
    }

}
