const fs = require("node:fs")
const path = require("node:path")

const APPLE_DOUBLE_MAGIC = Buffer.from([0x00, 0x05, 0x16, 0x07])
const MAX_SIDECAR_BYTES = 131_072

const DEFAULT_SCAN_ROOTS = [
  "apps/backend/src",
  "apps/backend/integration-tests",
  "apps/storefront/src",
  "apps/storefront/e2e",
]

const DEFAULT_ROOT_GLOBS = ["apps/backend", "apps/storefront"]

const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  ".next",
  ".next-production",
  ".medusa",
  ".turbo",
  "artifacts",
  "private",
  "uploads",
])

const CODE_CONFIG_EXT_RE = /\.(c|m)?[jt]sx?$|\.json$|\.css$|\.mdx?$/i

function isVerifiedAppleDoubleFile(filePath) {
  const base = path.basename(filePath)
  if (!base.startsWith("._") || base.length <= 2) {
    return false
  }

  let stat
  try {
    stat = fs.lstatSync(filePath)
  } catch {
    return false
  }

  if (!stat.isFile() || stat.isSymbolicLink()) {
    return false
  }
  if (stat.size < 4 || stat.size > MAX_SIDECAR_BYTES) {
    return false
  }

  let fd
  try {
    fd = fs.openSync(filePath, "r")
    const header = Buffer.alloc(4)
    const bytesRead = fs.readSync(fd, header, 0, 4, 0)
    return bytesRead === 4 && header.equals(APPLE_DOUBLE_MAGIC)
  } catch {
    return false
  } finally {
    if (fd !== undefined) {
      try {
        fs.closeSync(fd)
      } catch {
        // ignore close error
      }
    }
  }
}

function uniqueQuarantineDestination(quarantineRoot, relPath) {
  const candidate = path.join(quarantineRoot, relPath)
  if (!fs.existsSync(candidate)) {
    return candidate
  }
  const parsed = path.parse(candidate)
  return path.join(parsed.dir, `${parsed.name}.${Date.now()}${parsed.ext}`)
}

function quarantineAppleDoubleFiles({
  repoRoot,
  quarantineRoot = path.join(
    repoRoot,
    "artifacts",
    "dtf-stabilization",
    "appledouble-quarantine"
  ),
  scanRoots = DEFAULT_SCAN_ROOTS,
  topLevelDirs = DEFAULT_ROOT_GLOBS,
} = {}) {
  if (!repoRoot) {
    throw new Error("repoRoot is required")
  }

  const moved = []

  const moveCandidate = (absPath) => {
    const base = path.basename(absPath)
    if (!base.startsWith("._")) {
      return
    }
    const counterpartName = base.slice(2)
    if (!CODE_CONFIG_EXT_RE.test(counterpartName)) {
      return
    }
    if (!isVerifiedAppleDoubleFile(absPath)) {
      return
    }
    const rel = path.relative(repoRoot, absPath)
    if (rel.startsWith("..") || path.isAbsolute(rel)) {
      return
    }
    const dest = uniqueQuarantineDestination(quarantineRoot, rel)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    fs.renameSync(absPath, dest)
    moved.push({ from: rel, to: path.relative(repoRoot, dest) })
  }

  const walk = (dir) => {
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (SKIP_DIRS.has(entry.name) || entry.name.startsWith("._")) {
          continue
        }
        walk(fullPath)
      } else if (entry.isFile() && entry.name.startsWith("._")) {
        moveCandidate(fullPath)
      }
    }
  }

  for (const relRoot of scanRoots) {
    walk(path.join(repoRoot, relRoot))
  }

  for (const relTop of topLevelDirs) {
    const dir = path.join(repoRoot, relTop)
    let entries
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (entry.isFile() && entry.name.startsWith("._")) {
        moveCandidate(path.join(dir, entry.name))
      }
    }
  }

  return moved
}

if (require.main === module) {
  const repoRoot = path.resolve(__dirname, "..")
  const moved = quarantineAppleDoubleFiles({ repoRoot })
  if (moved.length > 0 && process.env.QUIET_APPLEDOUBLE !== "1") {
    console.log(
      `[appledouble-quarantine] Moved ${moved.length} verified AppleDouble sidecar file(s) to quarantine.`
    )
  }
}

module.exports = {
  isVerifiedAppleDoubleFile,
  quarantineAppleDoubleFiles,
}
