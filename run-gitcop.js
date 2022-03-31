import gitcop from './git-clone-or-pull.js'
import clopt from 'clopt'

await gitcop(...clopt().words)
