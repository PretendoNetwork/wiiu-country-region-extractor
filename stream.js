class Stream {
	constructor(buffer) {
		this.pos = 0;
		this.buffer = buffer;
	}

	capacity() {
		return this.buffer.length;
	}

	skip(length) {
		this.pos += length;
	}

	readBytes(length) {
		const bytes = this.buffer.subarray(this.pos, this.pos + length);

		this.skip(length);

		return bytes;
	}

	readUInt32BE() {
		return this.readBytes(0x4).readUInt32BE();
	}

	readUInt32LE() {
		return this.readBytes(0x4).readUInt32LE();
	}

	readUInt16BE() {
		return this.readBytes(0x2).readUInt16BE();
	}
}

module.exports = Stream;