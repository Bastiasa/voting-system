import { app } from "electron";
import { isDevelopment } from "./util.js";
import path from 'path';

export function getPreloadPath():string {
    return path.join(
        app.getAppPath(),
        isDevelopment() ? "." : "..",
        "/dist-electron/preload.cjs"
    );
}