import gitcop from './git-clone-or-pull.js'
import clopt from 'clopt'

const result = await gitcop(...clopt().words)
console.log('data changed?', result)
