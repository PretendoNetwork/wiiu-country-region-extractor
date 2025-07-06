# Wii U Country/Region Extractor

## What is this?
This extractor will extract the country/region data from a Wii U System Data Archive title dumps

## Supported data

### `country.bin` files
- [x] ISO-2 Country codes
- [x] Country IDs
- [x] Names and translations
- [ ] `0x30` unknown data at the end of each country block

### `#.bin` region files
- [x] Region IDs (first byte is the country ID)
- [x] Names and translations
- [x] GPS coordinates

## Usage
Extract System Data Archive titles `/storage_mlc/sys/title/0005001b/10052000` and `/storage_mlc/sys/title/0005001b/1005c000` from your Wii U

```bash
$ git clone https://github.com/PretendoNetwork/wiiu-country-region-extractor
$ cd wiiu-country-region-extractor
$ npm i
$ node . --regions-title-dump=path/to/0005001b-10052000 --iso-title-dump=path/to/0005001b-1005c000 --out=path/to/wherever
```

## `regions.json`
`regions.json` is an array of country objects with their regions. All objects are sorted by their `id` property from smallest to largest. The structure is

```json
{
	"id": 123,
	"iso_code": "XX",
	"name": "Country Name",
	"translations": {
		"japanese": "Country Name Translation",
		"english": "Country Name Translation",
		"french": "Country Name Translation",
		"german": "Country Name Translation",
		"italian": "Country Name Translation",
		"spanish": "Country Name Translation",
		"chinese_simple": "Country Name Translation",
		"korean": "Country Name Translation",
		"dutch": "Country Name Translation",
		"portuguese": "Country Name Translation",
		"russian": "Country Name Translation",
		"chinese_traditional": "Country Name Translation",
		"unknown1": "Country Name Translation",
		"unknown2": "Country Name Translation",
		"unknown3": "Country Name Translation",
		"unknown4": "Country Name Translation"
	},
	"regions": []
}
```

`regions` is an array of region objects for each region inside a country. All objects are sorted by their `full_id` property from smallest to largest. The structure is

```json
{
	"id": 123,
	"full_id": 1234567890,
	"name": "Region Name",
	"translations": {
		"japanese": "Region Name Translation",
		"english": "Region Name Translation",
		"french": "Region Name Translation",
		"german": "Region Name Translation",
		"italian": "Region Name Translation",
		"spanish": "Region Name Translation",
		"chinese_simple": "Region Name Translation",
		"korean": "Region Name Translation",
		"dutch": "Region Name Translation",
		"portuguese": "Region Name Translation",
		"russian": "Region Name Translation",
		"chinese_traditional": "Region Name Translation",
		"unknown1": "Region Name Translation",
		"unknown2": "Region Name Translation",
		"unknown3": "Region Name Translation",
		"unknown4": "Region Name Translation"
	},
	"coordinates": {
		"latitude": 0.0,
		"longitude": 0.0
	}
}
```

Every country file also contains an "unspecified" region. The region ID for these regions is only `AABBBBBB` where `AA` is the country ID and `BBBBBB` is all `0`. Each translation for the "unspecified" region is always `—` and the GPS coordinates are set to the countries capital city