/**
 * This logger is still required to log directly from `Logger.log()`,
 * if this not exists then 3rd party services, NestResolver, NodeJS
 * and v8 engine errors will not be formatted.
 */

import { Logger as NestLogger } from "@nestjs/common";
import * as crypto from "crypto";
import { AsyncLocalStorage } from "async_hooks";
import { IErrorLogParams, ILogParams } from "./logfmt.utilities";
import { ClientOptions } from "syslog-client";

type LogContextType = {
  className: string;
  methodName: string;
  [key: string]: any;
};

export function CaptureLogContext() {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const className = target.constructor.name;

    descriptor.value = function (...args: any[]) {
      const existingContext = Logger.getContext() || {};

      return Logger.runWithContext(
        {
          ...existingContext,
          className,
          methodName: propertyKey,
        },
        () => {
          const returnValue = originalMethod.apply(this, args);
          return returnValue;
        }
      );
    };

    return descriptor;
  };
}

export class Logger {
  private static asyncLocalStorage = new AsyncLocalStorage<LogContextType>();

  static runWithContext(context: LogContextType, callback: () => void) {
    return this.asyncLocalStorage.run(context, callback);
  }

  static getContext(): LogContextType | undefined {
    return this.asyncLocalStorage.getStore();
  }

  /**
   * Prints at log level
   *
   * @param message Log message
   * @param params Log context or Parameters
   */
  static log(message: any, params?: undefined | ILogParams) {
    const context = this.getContext();
    const fullContext =
      context?.className && context?.methodName
        ? `${context.className}.${context.methodName}`
        : "UnknownContext";
    NestLogger.log(message, { ...(params || {}), context: fullContext });
  }

  /**
   * Prints at log level and sends to syslog
   *
   * @param message Log message
   * @param params Log context or Parameters
   */
  static syslog(
    message: any,
    params?: undefined | ILogParams,
    client?: ClientOptions & { target: string }
  ) {
    const context = this.getContext();

    if (params === undefined) {
      params = {
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

      if (client === undefined) {
        params = {
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
      }
    } else {
      params = {
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
      };
    }

    const fullContext =
      context?.className && context?.methodName
        ? `${context.className}.${context.methodName}`
        : "UnknownContext";
    NestLogger.log(message, { ...(params || {}), context: fullContext });
  }

  /**
   * Prints at warn level
   *
   * @param message Log message
   * @param params Log context or Parameters
   */
  static warn(message: any, params?: undefined | ILogParams) {
    const context = this.getContext();
    const fullContext =
      context?.className && context?.methodName
        ? `${context.className}.${context.methodName}`
        : "UnknownContext";
    NestLogger.warn(message, { ...(params || {}), context: fullContext });
  }

  /**
   * Prints at error level
   *
   * @param message Log message
   * @param params Log context or Parameters
   * @returns TraceId of Error
   */
  static error(message: any, params?: undefined | ILogParams): string {
    const context = this.getContext();
    const fullContext =
      context?.className && context?.methodName
        ? `${context.className}.${context.methodName}`
        : "UnknownContext";
    let _params: IErrorLogParams;
    const traceId =
      typeof params === "object" && (params.traceId as string)
        ? (params.traceId as string)
        : crypto.randomUUID();

    _params = {
      traceId,
      ...params,
      context: fullContext,
    };

    NestLogger.error(message, _params);
    return traceId;
  }

  /**
   * Prints at debug level
   *
   * @param message Log message
   * @param params Log context or Parameters
   */
  static debug(message: any, params?: undefined | ILogParams) {
    const context = this.getContext();
    const fullContext =
      context?.className && context?.methodName
        ? `${context.className}.${context.methodName}`
        : "UnknownContext";
    NestLogger.debug(message, { ...(params || {}), context: fullContext });
  }

  /**
   * Prints at verbose level
   *
   * @param message Log message
   * @param params Log context or Parameters
   */
  static verbose(message: any, params?: undefined | ILogParams) {
    const context = this.getContext();
    const fullContext =
      context?.className && context?.methodName
        ? `${context.className}.${context.methodName}`
        : "UnknownContext";
    NestLogger.verbose(message, { ...(params || {}), context: fullContext });
  }

  /**
   * Prints at fatal level
   *
   * @param message Log message
   * @param params Log context or Parameters
   */
  static fatal(message: any, params?: undefined | ILogParams) {
    const context = this.getContext();
    const fullContext =
      context?.className && context?.methodName
        ? `${context.className}.${context.methodName}`
        : "UnknownContext";
    NestLogger.fatal(message, { ...(params || {}), context: fullContext });
  }

  /**
   * Print buffered logs and detach buffer.
   */
  static flush() {
    NestLogger.flush();
  }

  /**
   * Attach buffer. Turns on initialization logs buffering.
   */
  static attachBuffer() {
    NestLogger.attachBuffer();
  }
}
