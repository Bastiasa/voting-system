import dgram, { Socket } from "dgram";
import { encryptAES, loadValue } from "./util.js";

const BROADCAST_ADDRESS = "255.255.255.255";


let votesBroadcastingInterval: NodeJS.Timeout | null = null;
let broadcastingSocket: Socket | null = null;
export let currentVotesForBroadcast: Votes = [];
export let broadcastPort = -1;

loadValue<number>("broadcastPort", 8999).then(savedPort => {
    broadcastPort = savedPort ?? 8999;
});


export function broadcastVotes(): void {
    if (broadcastingSocket == null) {
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

        const unsafeData = Buffer.from(JSON.stringify(candidateVotes), "utf8");
        const safeData = encryptAES(unsafeData);

        broadcastingSocket?.send(
            safeData,
            targetPort,
            BROADCAST_ADDRESS
        );
    });

}

export function stopBroadcasting(callback?: () => void) {

    if (votesBroadcastingInterval) {
        clearInterval(votesBroadcastingInterval);
        votesBroadcastingInterval = null;
    }

    broadcastingSocket?.close(() => {
        broadcastingSocket = null;
        callback?.();
    });
}

export function startBroadcasting() {
    console.log("Starting broadcasting...");


    broadcastingSocket = dgram.createSocket("udp4", (message, remoteInformation) => { });

    broadcastingSocket.bind(() => {
        broadcastingSocket?.setBroadcast(true);
        votesBroadcastingInterval = setInterval(() => broadcastVotes(), 800);
        console.log("Broadcast started.");
    });
}


export function setBroadcastPort(port: number) {
    broadcastPort = port;
}