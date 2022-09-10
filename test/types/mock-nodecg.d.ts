declare module 'mock-nodecg' {
  type NodeCG<T> = import('nodecg-types/types/lib/nodecg-instance').NodeCG<T>
  class MockNodeCG implements NodeCG<'server'> {
    getSocketIOServer(): SocketIO.Server
    Router(options?: import('express').RouterOptions): import('express').Router
    mount: import('express-serve-static-core').IRouterHandler<import('express').Router, string> & import('express-serve-static-core').IRouterMatcher<import('express').Router, any>
    util: { authCheck: import('express').RequestHandler }
    extensions: { [bundleName: string]: (nodecg: NodeCG<'server'>) => void }
    listenFor(messageName: string, handlerFunc: (message: any, cb?: import('nodecg-types/types/lib/nodecg-instance').ListenForCb) => void): void
    listenFor(messageName: string, bundleName: string, handlerFunc: (message: any, cb?: import('nodecg-types/types/lib/nodecg-instance').ListenForCb) => void): void
    readReplicant<V>(name: string): V
    readReplicant<V>(name: string, namespace: string): V
    bundleName: string
    bundleConfig: any
    bundleVersion: string
    bundleGit: { branch: string; hash: string; shortHash: string; date?: Date; message?: string }
    Logger: NodeCG<'server'>['Logger']
    log: NodeCG<'server'>['log']
    config: import('nodecg-types/types/server').NodeCGConfig
    sendMessage(messageName: string, cb?: (error: any, ...args: any[]) => void): void
    sendMessage(messageName: string, data: any, cb?: (error: any, ...args: any[]) => void): void
    sendMessageToBundle: import('nodecg-types/types/lib/nodecg-static').SendMessageToBundle<'server', void>
    unlisten(messageName: string, handlerFunc: (message: any) => void): void
    unlisten(messageName: string, bundleName: string, handlerFunc: (message: any) => void): void
    Replicant<V>(name: string, opts?: import('nodecg-types/types/lib/replicant').ReplicantOptions<V>): import('nodecg-types/types/lib/replicant').ReplicantServer<V>
    Replicant<V>(name: string, namespace: string, opts?: import('nodecg-types/types/lib/replicant').ReplicantOptions<V>): import('nodecg-types/types/lib/replicant').ReplicantServer<V>
  }

  global {
    interface Window {
      nodecg: NodeCG<'browser'>
    }
  }

  export = MockNodeCG
}
