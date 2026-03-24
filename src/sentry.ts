import * as Sentry from '@sentry/angular';
import { environment } from './environments/environment';

export function initSentry(): void {
  if (!environment.sentryDsn) return;

  Sentry.init({
    dsn: environment.sentryDsn,
    environment: environment.production ? 'production' : 'development',
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    // Tune down in production to reduce quota usage
    tracesSampleRate: environment.production ? 0.2 : 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
