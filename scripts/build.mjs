import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const outFile = path.join(distDir, 'ims.js')

await mkdir(distDir, { recursive: true })

await esbuild.build({
  entryPoints: [path.join(rootDir, 'src', 'index.js')],
  outfile: outFile,
  bundle: true,
  format: 'iife',
  target: ['es2020'],
  platform: 'browser',
  legalComments: 'none',
  charset: 'utf8',
  sourcemap: true,
  banner: {
    js: '/* IMS v0.1.0 build */'
  }
})

console.log(`Built ${path.relative(rootDir, outFile)}`)
