function crc32Table(){const t=new Uint32Array(256);for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=(c&1)?0xedb88320^(c>>>1):c>>>1;t[n]=c>>>0;}return t;}
const CRC_TABLE=crc32Table();
function crc32(bytes){let c=0xffffffff;for(const b of bytes)c=CRC_TABLE[(c^b)&0xff]^(c>>>8);return (c^0xffffffff)>>>0;}
function u16(value){const b=Buffer.alloc(2);b.writeUInt16LE(value>>>0);return b;}
function u32(value){const b=Buffer.alloc(4);b.writeUInt32LE(value>>>0);return b;}
function normalizeEntries(entries){return [...entries.entries()].map(([name,value])=>[String(name).replace(/^\/+/,''),Buffer.isBuffer(value)?value:Buffer.from(String(value),'utf8')]).sort(([a],[b])=>a.localeCompare(b));}

export function createStoreZip(entries){
  const files=normalizeEntries(entries);const local=[];const central=[];let offset=0;
  for(const [name,data] of files){
    if(!name||name.endsWith('/'))throw new TypeError('ZIP_FILE_NAME_REQUIRED');
    const filename=Buffer.from(name,'utf8');const crc=crc32(data);
    const header=Buffer.concat([u32(0x04034b50),u16(20),u16(0x0800),u16(0),u16(0),u16(33),u32(crc),u32(data.length),u32(data.length),u16(filename.length),u16(0),filename]);
    local.push(header,data);
    const cd=Buffer.concat([u32(0x02014b50),u16(20),u16(20),u16(0x0800),u16(0),u16(0),u16(33),u32(crc),u32(data.length),u32(data.length),u16(filename.length),u16(0),u16(0),u16(0),u16(0),u32(0),u32(offset),filename]);
    central.push(cd);offset+=header.length+data.length;
  }
  const centralBytes=Buffer.concat(central);const localBytes=Buffer.concat(local);
  const end=Buffer.concat([u32(0x06054b50),u16(0),u16(0),u16(files.length),u16(files.length),u32(centralBytes.length),u32(localBytes.length),u16(0)]);
  return Buffer.concat([localBytes,centralBytes,end]);
}

export function readStoreZip(bytes){
  const buffer=Buffer.from(bytes);const entries=new Map();let offset=0;
  while(offset+4<=buffer.length&&buffer.readUInt32LE(offset)===0x04034b50){
    const compression=buffer.readUInt16LE(offset+8);if(compression!==0)throw new Error('ZIP_COMPRESSION_UNSUPPORTED');
    const compressed=buffer.readUInt32LE(offset+18);const uncompressed=buffer.readUInt32LE(offset+22);if(compressed!==uncompressed)throw new Error('ZIP_SIZE_MISMATCH');
    const nameLength=buffer.readUInt16LE(offset+26);const extraLength=buffer.readUInt16LE(offset+28);const name=buffer.subarray(offset+30,offset+30+nameLength).toString('utf8');const start=offset+30+nameLength+extraLength;const end=start+compressed;
    if(end>buffer.length)throw new Error('ZIP_TRUNCATED');entries.set(name,buffer.subarray(start,end));offset=end;
  }
  if(!entries.size)throw new Error('ZIP_NO_ENTRIES');return entries;
}
