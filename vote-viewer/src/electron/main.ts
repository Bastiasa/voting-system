import { app, BrowserWindow, dialog } from 'electron';
import { sendToWebContents, isDevelopment, decryptAES, validateObject, ipcMainHandle, getPreloadPath } from './util.js';

import path from 'path';
import dgram from 'dgram';
import fs from 'fs/promises';

const onBroadcastReceived = (message: Buffer, remoteInformation: dgram.RemoteInfo) => {
    if (!mainWindow) {
        return;
    }

    try {
        const decryptedMessage = decryptAES(message)?.toString("utf-8");

        if (!decryptedMessage) {
            return;
        }

        console.log("Decrypted message:\n", decryptedMessage);


        const expectedCandidatesVotes = JSON.parse(decryptedMessage);

        if (typeof expectedCandidatesVotes !== "object") {
            return;
        }

        const validityMap: ValidityMap = {
            votes: 'string',
            id: 'string'
        }

        if (!validateObject(expectedCandidatesVotes, validityMap)) {
            return;
        }

        const candidateVotes = expectedCandidatesVotes as { votes: string | number, id: string };
        candidateVotes.votes = parseInt(candidateVotes.votes as string, 16);

        if (!isFinite(candidateVotes.votes)) {
            return;
        }

        sendToWebContents(
            mainWindow,
            'candidate-votes',
            candidateVotes as CandidateVotes,
            `${remoteInformation.address}:${remoteInformation.port}`
        );

    } catch (error) {
        console.log("Error: ", error);
    }
}

let udpSocket: dgram.Socket | null = null;

function stopSocket(callback?: () => void) {
    udpSocket?.close(callback);
}

function startSocket(port: number, callback?: () => void) {

    if (udpSocket !== null) {
        stopSocket(() => startSocket(port, callback));
        return;
    }

    udpSocket = dgram.createSocket("udp4", onBroadcastReceived);

    udpSocket.bind(port, '0.0.0.0', () => {
        console.log("UDP socket running");
        udpSocket?.setBroadcast(true);
        callback?.();
    })

    udpSocket.on('close', () => {
        udpSocket = null;
        console.log("UDP socket stopped");
    });
}

let mainWindow: BrowserWindow | null = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,

        backgroundColor: "#000000",
        webPreferences: {
            nodeIntegration: false,
            preload: getPreloadPath()
        }
    });

    if (isDevelopment()) {
        mainWindow.loadURL("http://localhost:5124/");
    } else {
        mainWindow.loadFile(path.join(
            app.getAppPath(),
            "/dist-react/index.html"
        ));
    }
}

const whenReady = async () => {
    createWindow();
};

app.whenReady().then(whenReady);


ipcMainHandle('run-udp', (port: number) => {

    if (!isFinite(port)) {
        return;
    }

    return startSocket(port, () => {
        if (mainWindow) {
            sendToWebContents(mainWindow, 'udp-bound');
        }
    });
});

ipcMainHandle('stop-udp', () => stopSocket());

ipcMainHandle('candidate-data-load', async () => {


    if (!mainWindow) {
        return {
            success: false,
            error: new Error("Main window isn't available")
        };
    }

    const openDialogResult = await dialog.showOpenDialog(
        mainWindow,
        {
            filters: [
                {
                    name: "Candidatos",
                    extensions: ["cv"]
                }
            ],

            properties: ["openFile"]
        }
    );

    const path = openDialogResult.filePaths[0];

    if (!path) {
        return {
            success: false,
            error: null
        };
    }

    const fileContent = await fs.readFile(path);
    const decryptedData = decryptAES(fileContent);

    const fileCorruptAlert = () => {
        if (mainWindow) {
            dialog.showMessageBox(mainWindow, {
                title: "No se pudo cargar",
                message: "El archivo está corrupto.",
                type: "error"
            });
        }
    }

    if (!decryptedData) {
        fileCorruptAlert();

        return {
            success: false,
            error: -1
        };
    }

    try {
        const parsedData = JSON.parse(decryptedData.toString("utf8"));

        if (!(parsedData instanceof Array)) {
            fileCorruptAlert();
            return {
                success: false,
                error: -1
            };
        }

        const map: ValidityMap = {
            name: 'string',
            id: 'string',
            picture: ['string', 'undefined']
        }

        let errorFound = false;

        parsedData.forEach(candidateData => {
            if (!validateObject(candidateData, map)) {
                errorFound = true;
            }
        })

        if (errorFound) {
            fileCorruptAlert();
            return {
                success: false,
                error: -1
            }
        }


        return {
            success: true,
            result: parsedData
        };

    } catch (error) {
        dialog.showErrorBox("No se pudo cargar", "Error desconocido al cargar el archivo.");
        return {
            success: false,
            error: -2
        }
    }

});

ipcMainHandle('switch-fullscreen', () => {
    if (!mainWindow) {
        return;
    }

    mainWindow.setFullScreen(!mainWindow.fullScreen);
})

ipcMainHandle('export-votes', content => {

    if (!mainWindow) {
        return;
    }

    const savePath = dialog.showSaveDialogSync(mainWindow, {
        filters: [
            {
                name: "Hoja de cálculo",
                extensions: ["csv"]
            }
        ]
    });

    if (!savePath) {
        return;
    }

    fs.writeFile(savePath, Buffer.from(content, 'utf8'));
});