import { app, BrowserView, BrowserWindow, ipcMain } from "electron";
import os from 'os';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { AES_ENCRYPT_PASSWORD } from "./privates.js";

const algorithm = 'aes-256-cbc';
const key = crypto.scryptSync(AES_ENCRYPT_PASSWORD, 'salt', 32);

export function encryptAES(data: Buffer):Buffer {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);
    let encrypted = cipher.update(data);
    encrypted = Buffer.concat([iv, encrypted, cipher.final()]);
    return encrypted;
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
    return process.env.NODE_ENV == "development";
}

type ValueTypes = 'string' | 'boolean' | 'number' | 'undefined' | 'object' | 'symbol' | 'bigint' | 'function';


export function validateObject(object: Record<any, unknown>, expectedValues: Record<any, ValueTypes|Array<ValueTypes>>):boolean {
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

export function ipcMainHandle<Key extends keyof EventPayloadMapping, Method extends EventPayloadMapping[Key]>(
    key: Key,
    handler: (...args: Parameters<Method>) => ReturnType<Method>|Promise<ReturnType<Method>>
) {
    ipcMain.handle(key, (event, ...args) => {
        return handler(...args as Parameters<Method>);
    });
}

export function ipcMainOnce<EventName extends keyof IpcMainCallbacks, Callback extends IpcMainCallbacks[EventName]>(
    eventName: EventName,
    callback: (...args:Parameters<Callback>) => ReturnType<Callback>
) {
    ipcMain.once(eventName, (event, ...args: Parameters<Callback>) => callback(...args));
}

export function ipcMainOn<EventName extends keyof IpcMainCallbacks, Callback extends IpcMainCallbacks[EventName]>(
    eventName: EventName,
    callback: (...args:Parameters<Callback>) => ReturnType<Callback>
) {
    ipcMain.on(eventName, (event, ...args: Parameters<Callback>) => callback(...args));
}

export function ipcMainSend<EventName extends keyof IpcRendererCallbacks, Callback extends IpcRendererCallbacks[EventName]>(
    mainWindow:BrowserWindow,
    eventName: EventName,
    ...args: Parameters<Callback>
) {
    mainWindow.webContents.send(eventName, ...args);
}


export function getIpAddress(): string | null {
    const interfaces = os.networkInterfaces();

    for (const name in interfaces) {
        const iface = interfaces[name];
        
        if (iface === undefined) {
            continue;
        }

        for (const addressInformation of iface) {
            if (addressInformation.family == "IPv4" && !addressInformation.internal) {
                return addressInformation.address;
            }
        }
        
    }

    return null;
}

type SavableValue = string | number | boolean | object| null ;

const DATA_FILEPATH = path.join(
    app.getPath("userData"),
    "saved_data.json"
);

let dataIsLoading = true;
let data: Record<string, SavableValue> = {};

const DATA_LOAD_PROMISE = new Promise<void>(resolve => {
    fs.readFile(DATA_FILEPATH, (err, data) => {
        if (err) {
            return;
        }
        try {
            const loadedData = data.toString('utf-8');
            const parsedData = JSON.parse(loadedData);

            data = parsedData;

        } catch (err) {
            
        }

        dataIsLoading = false;
        resolve();
    });
})



export function saveValue(key: string, value: SavableValue) {
    data[key] = value;
}

export async function loadValue<ExpectedType extends SavableValue>(key: string, defaultValue: ExpectedType|null = null): Promise<ExpectedType|null> {

    await DATA_LOAD_PROMISE;

    const value = data[key];
    return (value !== undefined) ? value as ExpectedType : defaultValue;

}

app.on('before-quit', event => {
    
    fs.writeFileSync(
        DATA_FILEPATH,
        JSON.stringify(data)
    );

});