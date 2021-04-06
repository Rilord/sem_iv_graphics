import {
    fusebox,
    sparky
} from 'fuse-box';


class Context {
  isProduction:boolean;

  getConfig() {
    return fusebox({
      entry: './index.ts',
      target: 'browser',
      sourceMap: !this.isProduction,
      devServer: !this.isProduction,
      webIndex: {template: './index.html'},
      resources:{resourceFolder: './', resourcePublicRoot: '/'},
      //link: {resourcePublicRoot: '/'},
    })
  }
}

const { task, src, exec, rm } = sparky<Context>(Context);

task('clean', async (context) => {
    rm('./dist');
})

task("default", async (context) => {
    await exec('clean');
    const fuse = context.getConfig()
    await fuse.runDev();
})

task("dist", async (context) => {
    await exec('clean');
    context.isProduction = true;
    const fuse = context.getConfig();
    await fuse.runProd({
        bundles: {app: 'index.js'}
        })
})
