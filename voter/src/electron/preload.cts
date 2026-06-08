import { contextBridge, ipcRenderer } from 'electron';

function ipcRendererOn<EventName extends keyof IpcRendererCallbacks, Callback extends IpcRendererCallbacks[EventName]>(
    eventName: EventName,
    callback: (...args:Parameters<Callback>) => ReturnType<Callback>
) {
    ipcRenderer.on(
        eventName,
        (event, ...args: Parameters<Callback>) => {
            callback(...args);
        }
    );
}

function ipcRendererSend<EventName extends keyof IpcMainCallbacks, Callback extends IpcMainCallbacks[EventName]>(
    eventName: EventName,
    ...args:Parameters<Callback>
) {
    ipcRenderer.send(eventName, ...args);
}

const electron:Window["electron"] = {
    invoke: (methodName, ...args) => {
        return ipcRenderer.invoke(methodName, ...args);
    },

    onContinueVoting: (callback) => {
        ipcRendererOn('continue-voting', (votes: Votes) => {
            callback(votes);
        });
    },

    sendReady: () => {
        ipcRendererSend('ready');
    }
}

contextBridge.exposeInMainWorld("electron", electron satisfies Window["electron"]);