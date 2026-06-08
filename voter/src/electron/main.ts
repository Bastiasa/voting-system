import { app, BrowserWindow, dialog, Menu } from 'electron';
import path from 'path';
import { decryptAES, encryptAES, ipcMainHandle, ipcMainOnce, ipcMainSend, isDevelopment, loadValue, saveValue, validateObject } from './util.js';
import { getPreloadPath } from './resourceManager.js';

import dgram, { Socket } from 'dgram';

import fs from 'fs/promises';

const LAST_VOTES_PATH = path.join(
    app.getPath("userData"),
    "last_votes.json"
);

const LAST_CANDIDATES_PATH = path.join(
    app.getPath("userData"),
    "candidates_data.json"
);

const BROADCASTING_ENCODING_KEY = "perro salchicha gordo bachicha";
const BROADCAST_ADDRESS = "255.255.255.255";

let currentVotesForBroadcast: Votes | undefined = undefined;

let broadcastPort = -1;

let mainWindow: BrowserWindow | null = null;

let broadcastingSocket: Socket | null = null;
let votesData = [];

let reactReady = false;
let votesBroadcastingInterval:NodeJS.Timeout|null = null;

const REACT_READY_PROMISE = new Promise<void>(resolve => {
    ipcMainOnce('ready', () => {
        reactReady = true;
        resolve();
    });
})

function stopBroadcasting(callback?: () => void) {

    if (votesBroadcastingInterval) {
        clearInterval(votesBroadcastingInterval);
        votesBroadcastingInterval = null;
    }

    broadcastingSocket?.close(() => {
        broadcastingSocket = null;
        callback?.();
    });
}

function startBroadcasting() {
    console.log("Starting broadcasting...");
    

    broadcastingSocket = dgram.createSocket("udp4", (message, remoteInformation) => {});

    broadcastingSocket.bind(() => {
        broadcastingSocket?.setBroadcast(true);
        votesBroadcastingInterval = setInterval(() => broadcastVotes(), 800);
        console.log("Broadcast started.");
    });
}

loadValue<number>("broadcastPort", 8999).then(savedPort => {
    broadcastPort = savedPort ?? 8999;
});

function createWindow() {

    const win = new BrowserWindow({
        width: 800,
        height: 600,

        minWidth: 800,
        minHeight: 600,

        fullscreen: false,
        resizable: true,
        useContentSize: true,

        backgroundColor:"#00000090",

        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: getPreloadPath()

        },
    });

    if (isDevelopment()) {
        win.loadURL("http://localhost:5123/");
    } else {
        win.loadFile(path.join(app.getAppPath(), "/dist-react/index.html"));
        win.setMenu(null);
    }

    mainWindow = win;
}

function broadcastVotes(): void {
    if (broadcastingSocket == null) {
        return;
    }

    if (currentVotesForBroadcast == undefined) {
        return;
    }

    const targetPort = (broadcastPort > 1024 && broadcastPort < 65535) ? broadcastPort : 8999;

    currentVotesForBroadcast.forEach(_candidateVotes => {

        let candidateVotes = {
            ..._candidateVotes,
            picture: undefined,
            name: undefined,
            votes: _candidateVotes.votes.toString(16)
        };

        candidateVotes.votes = candidateVotes.votes.toString(16);

        const unsafeData = Buffer.from(JSON.stringify(candidateVotes), "utf8");
        const safeData = encryptAES(unsafeData);

        broadcastingSocket?.send(
            safeData,
            targetPort,
            BROADCAST_ADDRESS
        );
    });
    
}

async function readCandidatesFile(filePath: string): Promise<CandidateData[]| undefined> {
    const showErrorMessage = () => {
        if (!mainWindow) { return; }

        dialog.showMessageBox(mainWindow, {
            message: `El archivo ${path.basename(filePath)} parece estar corrupto.`,
            title: "No se pudo cargar",
            type:'error'
        });
    }   

    try {
        const rawFileContent = await fs.readFile(filePath);
        const fileContent = decryptAES(rawFileContent)?.toString('utf-8');

        if (!fileContent) {
            showErrorMessage();
            return;
        }

        const candidatesData = JSON.parse(fileContent) as object[];

        if (!(candidatesData instanceof Array)) {
            return undefined;
        }

        let errorFound = false;
        
        candidatesData.forEach(candidateData => {
            if (!validateObject(candidateData as Record<string, undefined | string>, {
                _id: 'string',
                id: 'string',
                name: 'string',
                picture: ['string', 'undefined']
            })) {
                errorFound = true;                
            }
        })

        // console.log("Error loading", candidatesData);
        

        if (errorFound) {
            showErrorMessage();
            return undefined;
        }

        return candidatesData as CandidateData[];
    } catch (error) {
        showErrorMessage();
        return undefined;
    }
}

const exportVotes = (votes: Votes) => {
    if (!mainWindow) {
        return;
    }

    const saveDialogResult = dialog.showSaveDialogSync(mainWindow, {
        filters: [{ name: "Hoja de cálculo", extensions: ["csv"] }],
        nameFieldLabel: "Votos"
    });

    if (!saveDialogResult) {
        try {
            fs.rm(LAST_VOTES_PATH);
        } finally {
            
        }
        return;
    }

    const rows = votes.map(candidateVotes => {
        return [
            candidateVotes.name.replaceAll(";", ""),
            candidateVotes.id.replaceAll(";", ""),
            candidateVotes.votes.toString(10).replaceAll(";", "")
        ].join(";");
    });

    const bom = '\uFEFF';
    const mainContent = [
        "Candidato;Identificador;Votos",
        ...rows
    ].join("\n");

    fs.writeFile(
        saveDialogResult,
        bom + mainContent,
        "utf-8"
    );
}


ipcMainHandle('start-broadcast', () => startBroadcasting());
ipcMainHandle('stop-broadcast', () => stopBroadcasting());

ipcMainHandle('set-broadcast-port', (port) => {
    broadcastPort = port;
    saveValue("broadcastPort", port);
});

ipcMainHandle('update-votes', votes => {
    votesData = votes;
});

ipcMainHandle('save-candidates', candidatesData => {
    fs.writeFile(LAST_CANDIDATES_PATH, JSON.stringify(candidatesData), {encoding:'utf-8'});
});

ipcMainHandle('load-candidates', async () => {
    const filePath = LAST_CANDIDATES_PATH

    try {
        const rawContent = (await fs.readFile(filePath)).toString('utf-8');
        const readedContent = JSON.parse(rawContent) as CandidateData[];

        return {
            success: true,
            result: readedContent
        } as FileReadResult<CandidateData[]>;
        
    } catch (error) {
        return {
            success: false,
            error
        } as FileReadResult<CandidateData[]>; 
    }
});

ipcMainHandle('export-candidates', candidatesData => {

    if (!mainWindow) {
        return;
    }

    dialog.showSaveDialog(
        mainWindow,
        {
            filters: [{ extensions: ["cv"], name: "Candidatos" }],
            nameFieldLabel:"Candidatos"
        }
    )
        .then(result => {
            if (result.canceled) {
                return;
            }

            const stringJson = JSON.stringify(candidatesData);
            const encryptedData = encryptAES(Buffer.from(stringJson, 'utf-8'));

            fs.writeFile(result.filePath, encryptedData);
        }); 
});

ipcMainHandle('import-candidates', async () => {

    if (!mainWindow) {
        return;
    }

    const cvExtensions = ["cv"];
    const imageExtensions = ["png", "jpeg", "jpg", "webp", "gif", "svg", 'avif'];

    const openResult: string[] | undefined = dialog.showOpenDialogSync(
        mainWindow,
        {
            filters: [
                {
                    extensions: [...cvExtensions, ...imageExtensions],
                    name:"Candidatos e imágenes"
                },
                {
                    extensions: [...cvExtensions],
                    name: "Candidatos"
                },
                {
                    extensions: [...imageExtensions],
                    name: "Imágenes"
                }
            ],
            properties: [
                "multiSelections"
            ]
        }
    );

    if (!openResult) {
        return undefined;
    }

    const result: (CandidateData)[] = [];

    await Promise.all(openResult.map(async (filePath:string) => {
        
        const extension = path.extname(filePath.toLocaleLowerCase()).substring(1);

        switch (extension) {
            case 'cv':
                const readCandidatesData = await readCandidatesFile(filePath);
                
                if (readCandidatesData) {
                    result.push(...readCandidatesData);
                }
                
                break;
            case 'png':
            case 'jpeg':
            case 'jpg':
            case 'gif':
            case 'svg':
            case 'webp':
            case 'avif':

                try {

                    function getCandidateDefaultId() {
                        let id = "";
                        let nId = 0;

                        while (!id || result.find(v => v.id === id)) {
                            nId++;
                            id = `#${nId.toString(10).padStart(2, "0")}`;
                        }

                        return id;
                    }

                    const imageContent = await fs.readFile(filePath, {encoding:"base64"});
                    const candidateData:CandidateData = {
                        name: "Sin nombre",
                        id: getCandidateDefaultId(),
                        picture: `data:image/${extension == "svg" ? (`${extension}+xml`) : extension};base64,${imageContent}`,
                    }

                    result.push(candidateData);

                } catch (error) {
                    
                }

                break;
            default:
                return undefined
        };
    }));
    

    return result.filter(v=>v!==undefined);
});

ipcMainHandle('set-fullscreen', enabled => {
    mainWindow?.setFullScreen(enabled);
});

ipcMainHandle('export-votes', exportVotes);

ipcMainHandle('save-votes', votes => {
    fs.writeFile(
        LAST_VOTES_PATH,
        JSON.stringify(votes),
        'utf-8'
    );

    currentVotesForBroadcast = votes;
});

async function whenReady() {
    createWindow();

    if (!mainWindow) {
        return;
    }

    try {
        const lastVotesData:CandidateVotes[] = JSON.parse((await fs.readFile(LAST_VOTES_PATH)).toString('utf-8'));

        if (lastVotesData.length < 1) {
            return;
        }

        const {response} = await dialog.showMessageBox(mainWindow, {
            message: "Se encontraron votos no guardados de la última vez.\n¿Qué desea hacer?",
            type: "question",
            title: "Atención",
            cancelId: -1,
            noLink: true,
            defaultId: 0,
            buttons: [
                "Guardar",
                "Descartar",
                "Continuar votación"
            ]
        });

        if (response === 0) {
            exportVotes(lastVotesData);
        } else if (response === 2) {
            
            if (!reactReady) {
                await REACT_READY_PROMISE;
            }

            ipcMainSend(mainWindow, 'continue-voting', lastVotesData);
        }

        try {
            fs.rm(LAST_VOTES_PATH);
        } catch (error) {
            
        }

    } catch (error) {
        
    }
}


app.whenReady().then(whenReady);

app.on('quit', e => {
    stopBroadcasting();
});


