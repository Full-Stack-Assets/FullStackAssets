# Catalog baseline chunks

Only files matching `^[0-9]{3}\.b64$` are part of the catalog baseline payload. The files are concatenated in lexical order, decoded as base64, decompressed as gzip, and verified against `../catalog-baseline.json` before the public Library is generated.

Stale or differently named chunk files are not valid baseline input.
