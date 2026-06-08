type ValueTypes = 'string' | 'boolean' | 'number' | 'undefined' | 'object' | 'symbol' | 'bigint' | 'function';
type ValidityMap = Record<any, ValueTypes | ValueTypes[]>


interface CandidateData {
    name: string,
    id: string,
    picture?: string | null
}

interface UniqueCandidateData extends CandidateData {
    key?: string
}

interface CandidateVotes extends CandidateData { 
    picture: never
    votes: number
}

type FileReadResult<GivenType> =
    | {success: true, result: GivenType, error?:never }
    | {success: false, error:unknown, result?:never} 

type Votes = CandidateVotes[]; 


type ReceivedVotes = Record<string, Record<string, number>>


type IpcMainEvents = {
    'candidate-votes': (data: CandidateVotes, from:string) => void,
    'udp-bound': () => void,
};

type IpcMainMethods = {
    'run-udp': (port: number) => void,
    'stop-udp': () => void,
    
    'candidate-data-load': () => FileReadResult<CandidateData[]>,
    'switch-fullscreen': () => void,
    'export-votes': (content:string)=>void 
}

type IpcMainEventName = keyof IpcMainEvents;
type IpcMainEventCallback<EventName extends IpcMainEventName> = IpcMainEvents[EventName];

type IpcMainMethodName = keyof IpcMainMethods;
type IpcMaineMethodCallback<EventName extends IpcMainMethodName> = IpcMainMethods[EventName];

type ApplicationContextMap = {
    readonly menu: string,
    readonly setMenu: (menu: string) => void,
    readonly candidates: CandidateData[],
    readonly setCandidates: (candidates: CandidateData[]) => void,
    readonly getCandidateId: () => number,
    readonly receivedVotes: ReceivedVotes,
    readonly getReceivedVotesById: (id:string)=>number
}

interface Window {
    'electron': {
        removeRendererListener: (eventName:IpcMainEventName, listener:(event:Electron.IpcRendererEvent, ...args:any[]) => void)=>void,
        onCandidateVotesReceived: (callback: IpcMainEvents['candidate-votes']) => (event:Electron.IpcRendererEvent, ...args:any[]) => void,
        onUDPSocketBound: (callback: IpcMainEvents['udp-bound']) => void,
        startUDPSocket: (port: number) => void,
        stopUDPSocket: () => void,
        importCandidates: () => Promise<FileReadResult<CandidateData[]>>,
        switchFullscreen: () => void,
        
        saveVotesFile: (content:string)=>void
    }
}