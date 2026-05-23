const fs = require('fs')
const path = require('path')

function createMinimalPNG(r, g, b, size = 81) {
  function adler32(buf) {
    let s1 = 1, s2 = 0
    for (let i = 0; i < buf.length; i++) {
      s1 = (s1 + buf[i]) % 65521
      s2 = (s2 + s1) % 65521
    }
    return (s2 << 16) | s1
  }

  function crc32(buf) {
    let crc = 0xFFFFFFFF
    const table = []
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1)
      table[i] = c
    }
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8)
    return (crc ^ 0xFFFFFFFF) >>> 0
  }

  function chunk(type, data) {
    const typeBytes = Buffer.from(type, 'ascii')
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length)
    const crcData = Buffer.concat([typeBytes, data])
    const crcBuf = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(crcData))
    return Buffer.concat([len, typeBytes, data, crcBuf])
  }

  // IHDR
  const ihdrData = Buffer.alloc(13)
  ihdrData.writeUInt32BE(size, 0)
  ihdrData.writeUInt32BE(size, 4)
  ihdrData[8] = 8   // bit depth
  ihdrData[9] = 2   // color type RGB
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0

  // Raw image data (filter byte 0 + RGB per row)
  const rawRows = []
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3)
    row[0] = 0 // filter None
    for (let x = 0; x < size; x++) {
      row[1 + x * 3] = r
      row[2 + x * 3] = g
      row[3 + x * 3] = b
    }
    rawRows.push(row)
  }
  const rawData = Buffer.concat(rawRows)

  // zlib compress (deflate with no compression for simplicity)
  const zlib = require('zlib')
  const compressed = zlib.deflateSync(rawData, { level: 1 })

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdrData),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0))
  ])
}

const dir = path.join(__dirname)
const icons = [
  { name: 'menu.png',          r: 153, g: 153, b: 153 },
  { name: 'menu-active.png',   r: 107, g: 66,  b: 38  },
  { name: 'cart.png',          r: 153, g: 153, b: 153 },
  { name: 'cart-active.png',   r: 107, g: 66,  b: 38  },
  { name: 'order.png',         r: 153, g: 153, b: 153 },
  { name: 'order-active.png',  r: 107, g: 66,  b: 38  },
]

icons.forEach(({ name, r, g, b }) => {
  const png = createMinimalPNG(r, g, b, 81)
  fs.writeFileSync(path.join(dir, name), png)
  console.log(`✅ 生成: ${name}`)
})

console.log('\n🎉 所有图标生成完成！')
