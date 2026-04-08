import {
  Inject,
  Injectable,
  Logger as NestLogger,
  Scope,
} from "@nestjs/common";
import * as crypto from "crypto";
import { REQUEST } from "@nestjs/core";
import { ClientOptions } from "syslog-client";
import parseCookies from "./utilities/cookieparser";
import { IErrorLogParams, ILogParams } from "./logfmt.utilities";
import { Logger } from "./logger";

interface IHeaders {
  cookie?: string;
  [key: string]: any;
}

interface IRequest {
  headers: IHeaders;
  cookies?: {
    sessionid?: string;
    [key: string]: any;
  };
}

const IP_HEADERS = {
  REAL_IP: "x-real-ip",
  CF_IP: "x-forwarded-for",
};

@Injectable({ scope: Scope.REQUEST })
export class LogfmtService {
  constructor(@Inject(REQUEST) private readonly request: IRequest) {}

  private ipExtractor(headers: IHeaders): string | null {
    return (
      headers[IP_HEADERS.REAL_IP] || headers[IP_HEADERS.CF_IP] || "UNKNOWN_IP"
    );
  }

  private userAgentExtractor(headers: IHeaders): string | null {
    return headers["x-real-user-agent"] || "UNKNOWN_USER_AGENT";
  }

  private getSessionId(): string | undefined {
    if (this?.request?.cookies?.sessionid) {
      return this?.request?.cookies?.sessionid;
    }

    const cookieHeader = this?.request?.headers?.cookie;
    if (cookieHeader) {
      const sessionCookie = parseCookies(cookieHeader).find(
        (cookie) => cookie.cookieName === "sessionid"
      );
      return sessionCookie?.cookieValue;
    }

    return undefined;
  }

  private getLogContext(): string {
    const context = Logger.getContext();
    return context?.className && context?.methodName
      ? `${context.className}.${context.methodName}`
      : "UnknownContext";
  }

  log(message: any, params?: undefined | ILogParams): void {
    const mergedParams = this.mergeParams(params || {});
    NestLogger.log(message, {
      ...mergedParams,
      context: this.getLogContext(),
    });
  }

  syslog(
    message: any,
    params?: undefined | ILogParams,
    client?: ClientOptions & { target: string }
  ): void {
    const resolvedParams: ILogParams =
      params !== undefined
        ? {
            ...params,
            send_to_syslog: true,
            syslog_host: client.target,
            syslog_port: client.port,
            syslog_appName: client.appName,
            syslog_syslogHostname: client.syslogHostname,
            syslog_tcpTimeout: client.tcpTimeout,
            syslog_transport: client.transport,
            syslog_facility: client.facility,
            syslog_severity: client.severity,
            syslog_rfc3164: client.rfc3164,
          }
        : {
            send_to_syslog: true,
            syslog_host: client.target,
            syslog_port: client.port,
            syslog_appName: client.appName,
            syslog_syslogHostname: client.syslogHostname,
            syslog_tcpTimeout: client.tcpTimeout,
            syslog_transport: client.transport,
            syslog_facility: client.facility,
            syslog_severity: client.severity,
            syslog_rfc3164: client.rfc3164,
          };

    const mergedParams = this.mergeParams(resolvedParams);
    NestLogger.log(message, {
      ...mergedParams,
      context: this.getLogContext(),
    });
  }

  warn(message: any, params?: undefined | ILogParams): void {
    const mergedParams = this.mergeParams(params || {});
    NestLogger.warn(message, {
      ...mergedParams,
      context: this.getLogContext(),
    });
  }

  error(message: any, params?: undefined | IErrorLogParams): string {
    const traceId = crypto.randomUUID();
    const mergedParams = this.mergeParams({
      ...(params || {}),
      traceId,
    });

    NestLogger.error(message, {
      ...mergedParams,
      context: this.getLogContext(),
    });
    return traceId;
  }

  debug(message: any, params?: undefined | ILogParams): void {
    const mergedParams = this.mergeParams(params || {});
    NestLogger.debug(message, {
      ...mergedParams,
      context: this.getLogContext(),
    });
  }

  verbose(message: any, params?: undefined | ILogParams): void {
    const mergedParams = this.mergeParams(params || {});
    NestLogger.verbose(message, {
      ...mergedParams,
      context: this.getLogContext(),
    });
  }

  fatal(message: any, params?: undefined | IErrorLogParams): void {
    const mergedParams = this.mergeParams(params || {});
    NestLogger.fatal(message, {
      ...mergedParams,
      context: this.getLogContext(),
    });
  }

  private mergeParams(
    params?: undefined | ILogParams | IErrorLogParams
  ): ILogParams | IErrorLogParams {
    const headers = this.getHeaders();
    const ip = this.ipExtractor(headers);
    const userAgent = this.userAgentExtractor(headers);
    const sessionId = this.getSessionId();

    if (!params) {
      return {
        ip,
        userAgent,
        sessionId,
        context: this.getLogContext(),
      };
    }

    return {
      ...params,
      ip: params.ip ?? ip,
      userAgent: params.userAgent ?? userAgent,
      sessionId: params.sessionId ?? sessionId,
      context: params.context || this.getLogContext(),
    };
  }

  private getHeaders(): IHeaders {
    return (
      this?.request?.headers || (this?.request as any)?.request?.headers || {}
    );
  }

  flush(): void {
    NestLogger.flush();
  }

  attachBuffer(): void {
    NestLogger.attachBuffer();
  }
}
