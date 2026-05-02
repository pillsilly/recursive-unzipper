import fs from 'fs';

export type CompressionType = 'zip' | 'xz' | 'tar' | 'rar' | 'unknown';

/**
 * Read the first N bytes of a file and try to detect compression type by magic bytes.
 * Supports: ZIP (PK\x03\x04), XZ (FD7zXZ\x00), RAR (Rar!\x1a\x07), TAR (ustar at offset 257) and plain tar (no header) best-effort.
 */
export function detectCompression(filePath: string): CompressionType {
  const fd = fs.openSync(filePath, 'r');
  try {
    const headerBuf = new Uint8Array(512);
    const bytesRead = fs.readSync(fd, headerBuf, 0, headerBuf.length, 0);

    if (bytesRead >= 4) {
      // ZIP: PK\x03\x04 or PK\x05\x06 (empty archive) or PK\x07\x08 (spanned)
      if (headerBuf[0] === 0x50 && headerBuf[1] === 0x4b) {
        return 'zip';
      }
    }

    if (bytesRead >= 6) {
      // XZ: FD 37 7A 58 5A 00
      if (
        headerBuf[0] === 0xFD &&
        headerBuf[1] === 0x37 &&
        headerBuf[2] === 0x7A &&
        headerBuf[3] === 0x58 &&
        headerBuf[4] === 0x5A &&
        headerBuf[5] === 0x00
      ) {
        return 'xz';
      }
    }

    if (bytesRead >= 7) {
      // RAR: 52 61 72 21 1A 07 (covers both RAR4 and RAR5)
      if (
        headerBuf[0] === 0x52 &&
        headerBuf[1] === 0x61 &&
        headerBuf[2] === 0x72 &&
        headerBuf[3] === 0x21 &&
        headerBuf[4] === 0x1A &&
        headerBuf[5] === 0x07
      ) {
        return 'rar';
      }
    }

    // TAR: at offset 257 there should be "ustar" or "ustar\0"
    if (bytesRead >= 262) {
      const ustar = Buffer.from(headerBuf.slice(257, 257 + 5)).toString('utf8');
      if (ustar === 'ustar') return 'tar';
    }

    // Heuristic fallback for old-format (V7) tar without ustar magic:
    // validate the tar header checksum. The checksum field (offset 148-155) is
    // the octal sum of all 512 header bytes, treating the checksum field as spaces.
    if (bytesRead >= 512 && isLikelyTarHeader(headerBuf)) {
      return 'tar';
    }

    return 'unknown';
  } finally {
    fs.closeSync(fd);
  }
}

export default detectCompression;

/**
 * Heuristic: validate a V7-format tar header by checking the checksum.
 * The checksum field (offset 148-155) stores the octal sum of all 512 header
 * bytes, with the checksum field itself treated as spaces during computation.
 */
function isLikelyTarHeader(buf: Uint8Array): boolean {
  // Parse stored checksum from offset 148-155 (octal ASCII digits)
  let storedChecksum = 0;
  let foundDigit = false;
  for (let i = 148; i < 156; i++) {
    const c = buf[i]!;
    if (c >= 0x30 && c <= 0x37) { // octal digit
      storedChecksum = storedChecksum * 8 + (c - 0x30);
      foundDigit = true;
    } else if (c === 0x20 || c === 0x00) {
      continue; // space or null padding
    } else {
      return false; // invalid character in checksum field
    }
  }
  if (!foundDigit) return false;

  // Compute checksum: sum all 512 bytes, treating 148-155 as spaces (0x20)
  let computedChecksum = 0;
  for (let i = 0; i < 512; i++) {
    if (i >= 148 && i < 156) {
      computedChecksum += 0x20;
    } else {
      computedChecksum += buf[i]!;
    }
  }

  return computedChecksum === storedChecksum;
}
