import { mkdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { readFileSync } from 'node:fs'
import esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(__dirname, '..')
const distDir = path.join(rootDir, 'dist')
const outFile = path.join(distDir, 'bundle.js')

const pkg = JSON.parse(readFileSync(path.join(rootDir, 'package.json'), 'utf-8'))
const version = pkg.version

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
    js: `/* IMS v${version} build */`
  }
})

console.log(`Built bundle.js v${version}`)

console.log(`Built bundle.js v${version}`)
