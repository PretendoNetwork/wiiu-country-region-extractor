const path = require('node:path');
const fs = require('fs-extra');
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const Stream = require('./stream');

const argv = yargs(hideBin(process.argv)).argv;

if (!argv.regionsTitleDump || !argv.isoTitleDump || !argv.out) {
	console.log('Usage: node . --regions-title-dump path --iso-title-dump path --out path');
	console.log('\n');
	console.log('--regions-title-dump\tPath to title 0005001B-10052000 dump');
	console.log('--iso-title-dump\tPath to title 0005001B-1005C000 dump');
	console.log('--out\t\t\tPath to write regions.json to');
	return;
}

const regionsTitleDumpBase = path.resolve(argv.regionsTitleDump);
const regionsTitleContentBase =  path.join(regionsTitleDumpBase, '/content/00');

const isoTitleDumpBase = path.resolve(argv.isoTitleDump);
const isoCodeListFile = path.join(path.resolve(isoTitleDumpBase), '/content/country.txt');

const outFolder = path.resolve(argv.out);
const outFile = path.join(outFolder, 'regions.json');

const isoCodeNameMap = fs.readFileSync(isoCodeListFile)
	.toString()
	.split(',')
	.map(code => code.replace('\n', '').replace('\r', '').replace(/"/g, ''));


const translationNameMap = [
	'japanese',
	'english',
	'french',
	'german',
	'italian',
	'spanish',
	'chinese_simple',
	'korean',
	'dutch',
	'portuguese',
	'russian',
	'chinese_traditional',
	'unknown1',
	'unknown2',
	'unknown3',
	'unknown4'
];

const extracted = [];

async function main() {
	const contentFolders = (await fs.readdir(regionsTitleContentBase)).filter(folder => folder !== 'OTHER');

	for (const folder of contentFolders) {
		const countryFileData = await fs.readFile(`${regionsTitleContentBase}/${folder}/country.bin`);
		const countries = parseCountryFile(countryFileData);

		for (const country of countries) {
			const regionsFileData = await fs.readFile(`${regionsTitleContentBase}/${folder}/${country.id}.bin`);

			country.regions = parseRegionsFile(regionsFileData);

			extracted.push(country);
		}
	}

	const sorted = extracted.sort((a, b) => a.id - b.id);

	await fs.writeFile(outFile, JSON.stringify(sorted, null, 4));
}

function parseCountryFile(buffer) {
	const stream = new Stream(buffer);

	const numberOfCountries = stream.readUInt32BE();

	if (stream.capacity() !== (numberOfCountries * 0x83C) + 4) {
		const maxCountries = Math.floor((stream.capacity() - 4) / 0x83C);
		throw new Error(`Number of countries in country.bin does not match. File has room for ${maxCountries}, got ${numberOfCountries}`);
	}

	const countries = [];

	for (let i = 0; i < numberOfCountries; i++) {
		const country = {
			id: 0,
			iso_code: '',
			name: '',
			translations: {
				japanese: '',
				english: '',
				french: '',
				german: '',
				italian: '',
				spanish: '',
				chinese_simple: '',
				korean: '',
				dutch: '',
				portuguese: '',
				russian: '',
				chinese_traditional: '',
				unknown1: '',
				unknown2: '',
				unknown3: '',
				unknown4: ''
			}
		};

		country.id = stream.readUInt32LE();
		country.iso_code = isoCodeNameMap[country.id];
		stream.skip(0x4); // * Number of non-"unspecified" regions in the country
		stream.skip(0x4); // * Padding

		for (let j = 0; j < 16; j++) {
			const name = stream.readBytes(0x80).swap16().toString('utf16le').replace(/\0.*$/, '');
			country.translations[translationNameMap[j]] = name;
		}

		stream.skip(0x30);

		country.name = country.translations.english;

		countries.push(country);
	}

	return countries;
}

function parseRegionsFile(buffer) {
	const stream = new Stream(buffer);

	const numberOfRegions = stream.readUInt32BE();

	if (stream.capacity() !== ((numberOfRegions + 1) * 0x818) + 4) {
		const maxRegions = Math.floor((stream.capacity() - 4) / 0x818);
		throw new Error(`Number of regions in bin does not match. File has room for ${maxRegions}, got ${numberOfRegions}`);
	}

	const regions = [];

	// * The "unspecified" region is not counted in the total count
	// * Start the loop at -1 to account for it
	for (let i = -1; i < numberOfRegions; i++) {
		const region = {
			id: 0,
			individual_id: 0,
			name: '',
			translations: {
				japanese: '',
				english: '',
				french: '',
				german: '',
				italian: '',
				spanish: '',
				chinese_simple: '',
				korean: '',
				dutch: '',
				portuguese: '',
				russian: '',
				chinese_traditional: '',
				unknown1: '',
				unknown2: '',
				unknown3: '',
				unknown4: ''
			},
			coordinates: {
				latitude: 0,
				longitude: 0
			}
		};

		region.id = stream.readUInt32BE();
		region.individual_id = (region.id >> 16) & 0xFF;

		for (let j = 0; j < 16; j++) {
			const name = stream.readBytes(0x80).swap16().toString('utf16le').replace(/\0.*$/, '');
			region.translations[translationNameMap[j]] = name;
		}

		stream.skip(0x10); // * Unused

		const latitude = stream.readUInt16BE();
		const longitude = stream.readUInt16BE();

		region.coordinates = unpackCoordinates(latitude, longitude);

		if ((region.id & 0x00FFFFFF) === 0) {
			region.name = 'Unspecified';
		} else {
			region.name = region.translations.english;
		}

		regions.push(region);
	}

	const sorted = regions.sort((a, b) => a.id - b.id);

	return sorted;
}

function unpackCoordinates(latitude, longitude) {
	const coordinates = {
		latitude: 0,
		longitude: 0
	}

	if (latitude <= 0x4000) {
		coordinates.latitude = latitude * 0.005493164;
	} else if (latitude - 0xC000 < 0x4000) {
		coordinates.latitude = ((latitude - 0xc000) & 0xFFFF) * 0.005493164 - 90.0;
	}

	if (0x7FFF < longitude) {
		if (longitude - 0x8000 < 0x8000) {
			coordinates.longitude = ((longitude - 0x8000) & 0xFFFF) * 0.005493179 - 180.0;
		}
	} else {
		coordinates.longitude = longitude * 0.005493179;
	}

	return coordinates;
}

main();