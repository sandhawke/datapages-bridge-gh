import {readyPAC} from 'datapages-auto'
import {gitImport} from './import.js'
import Debug from 'debug'
const debug = Debug('datapages-bridge-github')

export default class Bridge {
  async handleJob () {
    debug('job handler starting')
    const fromGH = this.pac.streamingView({path: {parent: '/system/webhooks/github'}})

    const onGHEvent = ({pageId, data}) => {
      // debug('ev %O', data)
      const p = data.insecurePayload
      debug('\n' + pageId)
      if (!p) {
        debug('no payload?', data)
        return
      }
      if (!p.after) {
        debug('not a push I recognize')
        return
      }
      /*
      debug('payload p.action %O', p.action)
      debug('payload workflow_run', p.workflow_run?.name)
      debug('payload workflow', p.workflow_run?.name)
      debug('payload visibility', p.repository?.visibility)
      debug('payload repo.full_name', p.repository?.full_name)
      debug('payload clone_url', p.repository?.clone_url)
      */
      // debug('payload %O', p)
      const repo = p.repository
      const name = repo.full_name
      const url = repo.clone_url
      const after = p.after
      debug({name, url})
      gitImport({pac: this.pac, name, url, after})
    }

    fromGH.on('here', onGHEvent)

    await new Promise(() => {}) // wait forever
  }
}
