import Bridge from './worker.js'
import {readyPAC} from 'datapages-auto'

const bridge = new Bridge()
bridge.pac = await readyPAC() 
while (true) {
  try {
    await bridge.handleJob()
  } catch (e) {
    console.trace(e)
  }
}


