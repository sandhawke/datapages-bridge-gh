import gitCOP from './git-clone-or-pull.js'
import Debug from 'debug'
import delay from 'delay'

const debug = Debug('datapages-bridge-github/import')

const status = new Map() // name => { running, dirty }
const seen = new Set() 

export async function gitImport({pac, name, url, after}) {
  debug('gitImport %o', {name, after})
  if (seen.has(after)) {
    debug('rev already done', after)
    return // you're too late!
  }
  seen.add(after)
  
  let r = status.get(name)
  if (!r) {
    debug('first time with name', name)
    r = {pleaseCheck: new Set()}
    status.set(name, r)
  }
  if (r.running) {
    debug('already running this name, flagging potential change and returning', after)
    r.dirty = true
    return
  }
  r.running = true

  // do the fetching & importing in a loop in case more changes come
  // in while we're fetching & importing. Most of the smarter approaches
  // looking at the commit history are probably slower and more fragile.
  while (true) {
    r.dirty = false
    try {
      debug('running inner()')
      await inner()
      debug('inner() resolved')
    } catch (e) {
      console.trace(e)
    }

    if (!r.dirty) break

    debug('looks like things have changed since we started; sleep 1s and try again')
    await delay (1000)
  }
  
  r.running = false
  return

  async function inner () {
    const dir = '/var/lib/bridge-github/' + name
    const gitid = url
    debug('running git pull-or-clone', {gitid, dir})
    const changed = await gitCOP(gitid, dir)
    debug('returned from gitCOP', {gitid, dir, changed})

    if (!changed) {
      console.log('git data unchanged')
      return
    }
    
    // Placeholder until we have admin-config in database
    let mountPoint = '/from-github'
    if (gitid === 'https://github.com/w3c/credweb.git') {
      mountPoint = '//credweb.org'
    }

    debug('importing files from %o to %o', dir, mountPoint)
    console.log('importing files from %o to %o', dir, mountPoint)
    await pac.importFiles(mountPoint, dir)
    debug('import done')
  }
}
