import { defineRailway, github, postgres, preserve, project, service, volume } from 'railway/iac';

/**
 * Railway infrastructure for learning-korean, as code.
 * See https://docs.railway.com/infrastructure-as-code
 *
 * This replaces railway.toml, which Railway stops reading on 2026-12-01.
 *
 * `railway config apply` manages the whole project, so a resource that is
 * missing from this file is planned for deletion. Add new services and
 * databases here instead of in the dashboard. Variable values stay in Railway:
 * `preserve()` keeps whatever is set there.
 *
 * The SvelteKit app lives in `app/`. The root Dockerfile copies that tree, so
 * the service needs no Root Directory. Process startup comes from the image
 * CMD, so no start command is set here (it would override the Dockerfile
 * entrypoint).
 *
 * Not expressible in this file: the generated `*.up.railway.app` domain. It was
 * created once under Settings -> Networking -> Generate Domain.
 */
export default defineRailway(() => {
	const Postgres = postgres('Postgres', { region: 'us-west2' });
	Postgres.networking = { privateNetworkEndpoint: 'postgres' };

	const postgresVolume = volume('postgres-volume', {
		alerts: { usage: { '100': {}, '80': {}, '95': {} } },
		allowOnlineResize: true,
		region: 'us-west2',
		sizeMB: 5000
	});

	const learningKorean = service('learning-korean', {
		source: github('knakamura13/learning-korean', { checkSuites: false }),
		build: {
			builder: 'DOCKERFILE',
			watchPatterns: ['/app/**', '/Dockerfile', '/.dockerignore']
		},
		deploy: {
			healthcheckPath: '/healthz',
			healthcheckTimeout: 30,
			restartPolicyType: 'ON_FAILURE',
			restartPolicyMaxRetries: 3
		},
		replicas: { 'us-west2': 1 },
		env: {
			DATABASE_URL: preserve(),
			GOOGLE_CLIENT_ID: preserve(),
			GOOGLE_CLIENT_SECRET: preserve(),
			ORIGIN: preserve(),
			PUBLIC_SITE_URL: preserve()
		}
	});

	return project('learning-korean', {
		resources: [Postgres, learningKorean, postgresVolume]
	});
});
