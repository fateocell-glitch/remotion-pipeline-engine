"use strict";

const {appendFile, mkdir} = require("node:fs/promises");
const {join} = require("node:path");
const {projectPaths} = require("../services/project-store.cjs");

const levels = new Set(["INFO", "WARN", "ERROR"]);

function createLogger({root}) {
  const write = async (level, record) => {
    if (!levels.has(level)) throw new Error("Invalid log level.");
    const projectId = record?.projectId;
    const row = {
      timestamp: new Date().toISOString(),
      traceId: record?.traceId ?? `trace-${Date.now()}`,
      projectId,
      stage: record?.stage ?? "UPLOAD",
      level,
      beatId: record?.beatId,
      frames: record?.frames,
      message: record?.message ?? "",
      context: record?.context,
      errorStack: record?.errorStack,
      command: record?.command,
    };
    const line = `${JSON.stringify(row)}\n`;
    const globalDir = join(root, "logs");
    await mkdir(globalDir, {recursive: true});
    await appendFile(join(globalDir, "system.log"), line);
    if (projectId) {
      const paths = projectPaths(root, projectId);
      await mkdir(paths.logDir, {recursive: true});
      await appendFile(paths.executionLog, line);
    }
    return row;
  };
  return {
    info: (record) => write("INFO", record),
    warn: (record) => write("WARN", record),
    error: (record) => write("ERROR", record),
  };
}

module.exports = {createLogger};
