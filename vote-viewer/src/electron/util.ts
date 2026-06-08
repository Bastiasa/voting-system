import crypto from 'crypto';
import path from 'path';
import { app, BrowserWindow, ipcMain } from 'electron';

const algorithm = 'aes-256-cbc';
const password = 'perro salchicha gordo bachicha, toma solcito a la orilla del mar.';
const key = crypto.scryptSync(password, 'salt', 32);


export function getPreloadPath():string {
    return path.join(
        app.getAppPath(),
        isDevelopment() ? "." : "..",
        "/dist-electron/preload.cjs"
    );
}

export function validateObject(object: Record<any, unknown>, expectedValues: Record<any, ValueTypes|ValueTypes[]>):boolean {
    for (const key in object) {

        const typeDerteminator = expectedValues[key];
        const valueType = typeof object[key];

        if (typeDerteminator instanceof Array) {
            if (!typeDerteminator.includes(valueType)) {
                console.error(`The key of some passed object is expected to be the types ${typeDerteminator.join(", ")} but it was ${typeof object[key]}`);
                return false;
            }

            continue;
        }

        if (valueType !== typeDerteminator) {
            console.error(`The key of some passed object is expected to be ${typeDerteminator} but it was ${valueType}`);
            return false;
        }
    }
    return true;
}


export function decryptAES(data: Buffer): Buffer|null {

    if (data.length < 18) {
        return null;
    }

    const iv = data.subarray(0, 16);
    const encryptedData = data.subarray(16);

    const decipher = crypto.createDecipheriv(algorithm, key, iv);
    let decrypted = decipher.update(encryptedData);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted;
}

export function isDevelopment():boolean {
    return process.env.NODE_ENV === "development"
}

export function sendToWebContents<EventName extends IpcMainEventName>(
    mainWindow:BrowserWindow,
    eventName: EventName,
    ...args: Parameters<IpcMainEventCallback<EventName>>
) {
    mainWindow.webContents.send(eventName, ...args);
}

export function ipcMainHandle<MethodName extends IpcMainMethodName, Method extends IpcMainMethods[MethodName]>(
    eventName: MethodName,
    handler: (...args:Parameters<Method>) => ReturnType<Method>|Promise<ReturnType<Method>>
) {
    ipcMain.handle(eventName, (event, ...args: Parameters<Method>) => handler(...args));
}