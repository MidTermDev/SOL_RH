export function log(msg: string): void {
  console.log(`[${new Date().toISOString()}] ${msg}`)
}

export function logErr(msg: string, err?: unknown): void {
  console.error(`[${new Date().toISOString()}] ERROR: ${msg}`, err ?? '')
}
