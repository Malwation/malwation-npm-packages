/* eslint-disable no-param-reassign */
import { Format, format, TransformableInfo } from "logform";
import { Client } from "syslog-client";
import { Colors, LevelColors } from "./logfmt.constants";

export type LogfmtFormatWrap = (opts?: ILogfmtTransformOptions) => Format;

export interface ILogParams
  extends Record<string, string | number | boolean | Error | undefined> {
  /**
   * Associated userId with log
   * @type {string | undefined}
   */
  userId?: string;

  /**
   * Associated sessionId with log
   * @type {string | undefined}
   */
  sessionId?: string;
}

export interface IErrorLogParams extends ILogParams {
  /**
   * Unique id of log to find it later
   * If not in a special format, this will be automatically assigned UUID v4
   * @type {string | undefined}
   * @required
   */
  traceId?: string;

  /**
   * StackTrace of Error,
   * If you have a StackTrace, this field is required
   * @type {Error | undefined}
   */
  error?: Error;
}

export interface ILogfmtTransformOptions {
  /**
   * If `true`, console outputs will be colorized.
   * This should be false if NODE_ENV is not development.
   * @default false
   */
  colorize?: boolean;

  /**
   * If `true` it'll add timestamp to all logs.
   * This should be false if NODE_ENV is not development.
   * @default false
   */
  timestamp?: boolean;
}

export type TransformFunction = (
  info: TransformableInfo,
  opts?: ILogfmtTransformOptions
) => TransformableInfo | boolean;

// eslint-disable-next-line @typescript-eslint/naming-convention
export class logfmt {
  static ObjectToLogfmt(payload: IErrorLogParams): string {
    if (typeof payload === "string") {
      return `\n${payload}`;
    }

    let str = Object.entries(payload)
      .filter(({ "0": key }) => key !== "context" && key !== "error")
      .map(
        ({ "0": key, "1": value }) =>
          `${key}=${
            typeof value === "string" &&
            (value.split(" ").length > 1 ||
              value.match(/[$&+,:;=?@#|'<>.^*()%!-]/))
              ? `"${value}"`
              : value
          }`
      )
      .join(" ");

    if (payload.error) {
      const err = payload.error as Error;
      str += `\n${err.stack}`;
    }

    return str;
  }

  static parse: LogfmtFormatWrap = format(
    (info: TransformableInfo, opts: ILogfmtTransformOptions) => {
      const { message } = info;
      const isError = info.stack !== undefined;
      const hasContext = !isError && info.context !== undefined;
      let hasDetailedContext = false;

      const level = opts.colorize
        ? [LevelColors[info.level], info.level, Colors.Reset].join("")
        : info.level;

      info.message = `level=${level}`;

      if (hasContext) {
        let context: string | number | bigint | boolean = "";
        switch (typeof info.context) {
          case "bigint":
          case "number":
          case "boolean":
          case "string":
            context = opts.colorize
              ? `${Colors.FgCyan}${info.context}${Colors.Reset}`
              : info.context;

            if (info?.context) {
              if (info.context.toString().includes(" ")) {
                info.message += ` context="${context}" `;
              } else {
                info.message += ` context=${context} `;
              }
            }
            break;
          case "object": {
            hasDetailedContext = true;
            context = opts.colorize
              ? `${Colors.FgCyan}${(info.context as any).context}${
                  Colors.Reset
                }`
              : (info.context as any).context;

            const objContext = (info?.context as any)?.context;
            if (objContext) {
              if (objContext.includes(" ")) {
                info.message += ` context="${context}" `;
              } else {
                info.message += ` context=${context} `;
              }
            }
            break;
          }
          default:
            break;
        }
      } else if (isError) {
        let context: string | number | bigint | boolean = "";

        switch (typeof info.stack) {
          case "bigint":
          case "number":
          case "boolean":
          case "string":
            context = opts.colorize
              ? `${Colors.FgCyan}${info.stack}${Colors.Reset}`
              : info.stack;

            info.message += ` context=${context} `;
            break;
          case "undefined":
          case "object":
            if ((info.stack as any)[0] === undefined) {
              context = opts.colorize
                ? `${Colors.FgCyan}NodeApplication${Colors.Reset}`
                : "NodeApplication";
            } else {
              hasDetailedContext = true;
              context = opts.colorize
                ? `${Colors.FgCyan}${(info.stack as any)[0].context}${
                    Colors.Reset
                  }`
                : (info.stack as any)[0].context;
            }

            info.message += ` context=${context} `;
            break;
          default:
            break;
        }
      } else {
        info.message += opts.colorize
          ? ` context=${Colors.FgCyan}Unknown${Colors.Reset} `
          : ` context=Unknown `;
      }

      info.message += opts.colorize
        ? `message="${Colors.FgCyan}${message}${Colors.Reset}" `
        : `message="${message}" `;

      if (hasDetailedContext) {
        const context = isError ? (info.stack as any)[0] : info.context;
        if (opts.colorize && context.userId) {
          context.userId = `${Colors.FgGreen}${context.userId}${Colors.Reset}`;
        }
        if (opts.colorize && context.traceId) {
          context.traceId = `${Colors.FgRed}${context.traceId}${Colors.Reset}`;
        }
        if (opts.colorize && context.sessionId) {
          context.sessionId = `${Colors.FgBlue}${context.sessionId}${Colors.Reset}`;
        }

        info.message += this.ObjectToLogfmt(context);
      }

      if (opts.timestamp) {
        const date = new Date();
        const timestamp = date.toLocaleDateString("en-us", {
          minute: "2-digit",
          hour: "2-digit",
          second: "numeric",
          hour12: false,
        });

        if (opts.colorize) {
          info.message = `${Colors.FgGray}time=${timestamp.replace(
            /, /,
            "-"
          )}.${date.getMilliseconds()}${Colors.Reset} ${info.message}`;
        } else {
          info.message = `time=${timestamp.replace(
            /, /,
            "-"
          )}.${date.getMilliseconds()} ${info.message}`;
        }
      }

      if (
        typeof info.context === "object" &&
        (info.context as Record<string, any>).send_to_syslog === true
      ) {
        const { context } = info as unknown as { context: Record<string, any> };
        const client = new Client(context.syslog_host, {
          port: context.syslog_port,
          appName: context.syslog_appName,
          syslogHostname: context.syslog_syslogHostname,
          tcpTimeout: context.syslog_tcpTimeout,
          transport: context.syslog_transport,
          facility: context.syslog_facility,
          severity: context.syslog_severity,
          rfc3164: context.syslog_rfc3164,
        });

        info.message = (info.message as string).replace(
          "send_to_syslog=true",
          ""
        );
        client.log(info.message as string);
        client.close();
      }

      info[Symbol.for("message")] = info.message;
      return info;
    }
  );
}
