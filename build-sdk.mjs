import {build} from 'esbuild';
await build({entryPoints:['cloud-source.mjs'],outfile:'vendor/supabase.mjs',bundle:true,format:'esm',platform:'browser',minify:true});
