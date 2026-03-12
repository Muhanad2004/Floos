import sharp from 'sharp'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dir = dirname(fileURLToPath(import.meta.url))
const svg = readFileSync(join(__dir, '../public/icon.svg'))

await sharp(svg).resize(512, 512).png().toFile(join(__dir, '../public/icon.png'))
console.log('icon.png generated (512x512)')
