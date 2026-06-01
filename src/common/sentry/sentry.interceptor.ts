import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
  Scope,
} from '@nestjs/common';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { SentryService } from './sentry.service';
import * as Sentry from '@sentry/node';

@Injectable({ scope: Scope.REQUEST })
export class SentryInterceptor implements NestInterceptor {
  constructor(private sentryService: SentryService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    
    const span = this.sentryService.startChild({ op: `route handler` });

    return next.handle().pipe(
      catchError((error: any) => {
        if (!(error instanceof HttpException)) {
          
          Sentry.captureException(
            error,
            this.sentryService.span.getTraceContext(),
          );
        }

        
        return throwError(() => error);
      }),
      finalize(() => {
        span.finish();
        this.sentryService.span.finish();
      }),
    );
  }
}
