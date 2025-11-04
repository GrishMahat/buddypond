import adapter from '@sveltejs/adapter-static';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		adapter: adapter({
			// default options are shown. On some platforms
			// these options are set automatically — see below
			pages: 'build',
			assets: 'build',
      fallback: 'index.html',  // SPA fallback
			precompress: false,
			strict: false,
		}),
    paths: {
			base: process.env.BASE_PATH || '/v5/apps/based/inventory/app/build', // e.g. '/myapp' if hosted at example.com/myapp/
    }
	}
};

export default config;