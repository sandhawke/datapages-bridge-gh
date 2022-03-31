// the git-pull-or-clone package wasn't working for me
// and it's easier to write than debug sometimes.

import { promisify } from 'util'
import { exec } from 'child_process'
import fsprom from 'fs/promises'
import dbg from 'debug'

const execProm = promisify(exec)
const debug = dbg('git-clone-or-pull')

export default async function  (gitid, dir) {
  let dirExists
  try {
    await fsprom.access(dir)
    dirExists = true
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }

  if (dirExists) {
    const cmd = `git pull --depth=1 --ff-only`
    debug('running %o {cwd: %o}', cmd, dir)
    const {stdout, stderr} = await execProm(cmd, {cwd: dir})
    debug(`cd ${dir}; ${cmd}\nstdout=%o\nstderr=%o`, stdout, stderr)
  } else {
    const cmd = `git clone --depth=1 ${gitid} ${dir}`
    debug('running %o', cmd)
    const {stdout, stderr} = await execProm(cmd)
    debug(`${cmd}\nstdout=%o\nstderr=%o`, stdout, stderr)
  }
}

