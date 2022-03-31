// I was using the git-pull-or-clone package but hit the unrelated
// histories problem. While trying to figure it out, I wrote this,
// which handles the error with a new clone.

import { promisify } from 'util'
import { exec } from 'child_process'
import fsprom from 'fs/promises'
import dbg from 'debug'

const execProm = promisify(exec)
const debug = dbg('git-clone-or-pull')

// returns true if things were changed, false if already up to date
export default async function  (gitid, dir, options) {
  // depth is tricky.  if it's too big, we download more history than
  // we need. If it's too small, the pull will fail with "fatal:
  // refusing to merge unrelated histories" and
  // ‘–allow-unrelated-histories’ wont even solve it, so we fall back
  // to a new clone.
  //
  // So, set this to the number of changes you think might happen
  // between us trying to pull.  If you get it too low, it's fine,
  // we'll just do another clone. But right now, we'll leave some
  // files and log that console.error, so maybe best avoid that.
  const depth = options?.depth || 50
  
  let dirExists
  try {
    await fsprom.access(dir)
    dirExists = true
  } catch (e) {
    if (e.code !== 'ENOENT') throw e
  }

  if (dirExists) {
    try {
      const cmd = `git pull --depth=${depth} --ff-only`
      debug('running %o {cwd: %o}', cmd, dir)
      const {stdout, stderr} = await execProm(cmd, {cwd: dir})
      debug(`cd ${dir}; ${cmd}\nstdout=%o\nstderr=%o`, stdout, stderr)
      if (stdout.startsWith('Already up to date')) return false
      return true
    } catch (e) {
      console.error('git pull error, will try clone.  %O', e)
    }
    const save = dir + '-save-' + Date.now()
    await fsprom.rename(dir, save)
    console.error('saved a copy of the failed dir to', save)
  }

  if (!gitid.match(/^[a-z0-9:/.]*$/)) {
    throw Error('bad git repo name: '+JSON.stringify(gitid))
  }
  const cmd = `git clone --depth=1 ${gitid} ${dir}`
  debug('running %o', cmd)
  const {stdout, stderr} = await execProm(cmd)
  debug(`${cmd}\nstdout=%o\nstderr=%o`, stdout, stderr)
  return true
}

