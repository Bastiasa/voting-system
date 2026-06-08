import { contextBridge, ipcRenderer } from "electron";


function ipcRendererOn<EventName extends IpcMainEventName, Callback extends IpcMainEventCallback<EventName>>(
    eventName: EventName,
    callback: (...args:Parameters<Callback>) => ReturnType<Callback>
) : (event:Electron.IpcRendererEvent, ...args:any[]) => void {
    const listener = (event: Electron.IpcRendererEvent, ...args: Parameters<Callback>) => callback(...args);
    ipcRenderer.on(eventName, listener);
    return listener;
}

function removeRendererListener<EventName extends IpcMainEventName>(
    eventName: EventName,
    listener: (event:Electron.IpcRendererEvent, ...args:any[]) => void
) {
    ipcRenderer.removeListener(eventName, listener);
}

function ipcRendererInvoke<MethodName extends IpcMainMethodName, Method extends IpcMainMethods[MethodName]>(
    methodName: MethodName,
    ...args:Parameters<Method>
): Promise<ReturnType<Method>> {
    return ipcRenderer.invoke(methodName, ...args);
}

const electron: Window["electron"] = {
    removeRendererListener,
    onCandidateVotesReceived: (callback) => ipcRendererOn('candidate-votes', callback),
    onUDPSocketBound: (callback) => ipcRendererOn('udp-bound', callback),
    startUDPSocket: (port: number) => ipcRendererInvoke('run-udp', port),
    stopUDPSocket: () => ipcRendererInvoke('stop-udp'),
    importCandidates: () => ipcRendererInvoke('candidate-data-load'),
    switchFullscreen: () => ipcRendererInvoke('switch-fullscreen'),
    saveVotesFile: (content: string) => ipcRendererInvoke('export-votes', content)
}

contextBridge.exposeInMainWorld('electron', electron satisfies Window["electron"]);