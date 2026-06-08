import { RefObject, useEffect, useRef, useState } from "react";
import { useMenuManagerContext, useShowOnMenu } from "./MenuManager";
import { Box } from "./Box";
import { useMainApplicationContext } from "../App";

import { AnimatePresence,motion } from "framer-motion";

import emptyPfp from '../assets/empty_pfp.png';
import './styles/votate_menu.css';
import { Button } from "./Button";

export const DEFAULT_VOTATION_TITLE = "Haga click en el candidato que desea votar";
const CONTINUE_BUTTON_DELAY = 2;

interface VoteResult {
    readonly id: string,
    readonly key?: string,
    readonly onContinue?: ()=>void
}

interface VotingContext {
    readonly setVoteResult: (voteResult: string|null, key?:string|undefined, onContinue?:()=>void) => void,
    readonly voteResult: VoteResult|null
}


function CandidateVoteButton({ data, votingContext, index}: { data: UniqueCandidateData, votingContext:VotingContext, index:number}) {

    const containerReference = useRef<HTMLDivElement>(null);
    const voteClicked = useRef(false);

    function runIfContainer(handler:(container:HTMLDivElement)=>void) {
        if (!containerReference.current) {
            return;
        }

        handler(containerReference.current);
    }
    
    function hold() {
        runIfContainer(container => {
            
            if (voteClicked.current) {
                return;
            }

            container.style.transitionProperty = "outline, border, background";
            container.style.scale = "1"; 
        });
    }

    function onClicked(container: HTMLDivElement) {
        
        if (votingContext.voteResult !== null) {
            return;
        }

        votingContext.setVoteResult(data.id, data.key, ()=>container.style.pointerEvents = "");
        container.style.pointerEvents = "none";
    }

    function release(clicked:boolean) {
        runIfContainer(container => {

            if (voteClicked.current) {
                return;
            }

            container.style.outline = "0 solid transparent";
            container.style.transitionProperty = "";
            container.style.scale = "";

            if (clicked) {
                voteClicked.current = true;


                setTimeout(() => {
                    onClicked(container);
                    voteClicked.current = false;
                }, 300);
            }
        })
    }

    return (
        <motion.div
            
            layout
            initial={{ opacity: 0, y: 0, scale:0.9 }}
            animate={{ opacity: 1, y: 0, scale:1, transition:{duration:.4} }}
            exit={{ opacity: 0, y: -100, transition:{delay:index*.04}}}
            transition={{ duration: 0.5}}
        
        >
            <Box
                ref={containerReference}
                onMouseDown={hold}
                onMouseLeave={()=>release(false)}
                onMouseUp={()=>release(true)}
                className="candidate-vote-button"
                style={{
                    borderRadius: "8px",
                    display: "inline-flex",
                    padding: "10px"
                }}>
                <img style={{
                    width: "170px",
                    height: "170px",
                    objectFit: "cover",
                    borderRadius: "8px"
                }} src={data.picture ?? emptyPfp} alt="Candidato de votación" />    
                <div>
                    <p style={{textAlign:"center"}}> {data.name} </p>
                    <p style={{textAlign:"center"}} className="little-gray"> {data.id} </p>
                </div>
            </Box>
        </motion.div>
    );
}


export function VotateMenu({ }) {
    const { candidates, setCandidates, votationTitle, loadCandidatesPromise, getCandidateUniqueKey } = useMainApplicationContext();
    const { menu, setMenu } = useMenuManagerContext();

    const [voteResult, setVoteResultState] = useState<VoteResult | null>(null);

    const votes = useRef<Votes>([]);
    const mustSave = useRef(false);
    
    if (menu == "votate_menu" && votes.current.length <= 0) {
        votes.current = candidates.map(candidateData => {
            const voteData = {
                ...candidateData,
                votes: 0
            };

            delete voteData.picture;
            delete voteData.key;

            return voteData as CandidateVotes;
        });

        mustSave.current = true;

        window.electron.invoke('save-votes', votes.current);
        window.electron.invoke('start-broadcast');
        window.electron.invoke('set-fullscreen', true);
    } else if (menu !== "votate_menu") {
        votes.current = [];
        window.electron.invoke('stop-broadcast');
        window.electron.invoke('set-fullscreen', false);
    }

    function onExportResultsFired() {
        if (menu !== "votate_menu") {
            return;
        }

        setVoteResultState(null);

        const resultVotes = [...votes.current];
        
        Promise.all(
            [
                window.electron.invoke('save-votes', []),
                window.electron.invoke('export-votes', resultVotes)
            ]
        );

        votes.current = [];
        setMenu("main");
    }

    useEffect(() => {

        function onKeyPressed(e: KeyboardEvent) {
            console.log(e);
            
            if (e.ctrlKey && e.code === "KeyF") {
                onExportResultsFired();
            }
        }
        
        window.addEventListener("keypress", onKeyPressed);

        return () => {
            window.removeEventListener("keypress", onKeyPressed);
        }

    }, [candidates, menu]);

    useEffect(() => {
        if (voteResult) {
            votes.current.forEach(vote => {
                if (vote.id === voteResult.id) {
                    vote.votes += 1;
                    console.log(votes);
                }
            });
        }

        if (mustSave.current) {
            window.electron.invoke('save-votes', votes.current);
        }
    }, [voteResult]);

    useEffect(() => {
        window.electron.onContinueVoting(async lastVotes => {
            
            const candidatesFileData = await loadCandidatesPromise.current.promise ?? [];
            votes.current = lastVotes;

            lastVotes.forEach(candidateVotes => {
                let candidateData = candidatesFileData.find(cData => cData.id === candidateVotes.id);

                if (!candidateData) {
                    candidateData = {
                        id: candidateVotes.id,
                        name: candidateVotes.name
                    };

                    candidatesFileData.push(candidateData);
                    console.log("Created in base of votes data: ", candidateData);
                }
            });

            candidatesFileData.forEach(candidateData => {
                (candidateData as UniqueCandidateData).key =  `candidate_id__${getCandidateUniqueKey()}`;
            })

            setMenu("votate_menu");
            setCandidates(candidatesFileData);
            
            window.electron.invoke('save-votes', lastVotes);
            window.electron.invoke('start-broadcast');
            window.electron.invoke('set-fullscreen', true);
        })
     }, []);


    const setVoteResult: VotingContext["setVoteResult"] = (resultId, key, onContinue) => {
        mustSave.current = true;

        setVoteResultState(
            resultId !== null ?
                {
                    id: resultId,
                    key,
                    onContinue
                }
                :
                null
        );
    }

    const votingContext: VotingContext = {
        voteResult,
        setVoteResult
    }

    function continuePressed() {
        voteResult?.onContinue?.();
        setVoteResultState(null);
    }

    return (
        <div ref={useShowOnMenu("votate_menu")} className="menu">
            <Box className="centered-block" style={{padding: "20px", height:"100%", justifyContent:"center"}}>
                <h3 style={{ textAlign: "center" }}>
                    {
                        (votationTitle)
                            ? votationTitle
                            : DEFAULT_VOTATION_TITLE
                    }
                </h3>
                
                <Box direction="horizontal" style={{
                    justifyContent: "center",
                    flexWrap: "wrap",
                    overflow: (voteResult === null) ? "auto" : "hidden",
                    padding: "20px"
                }}>
                    <AnimatePresence>
                        {(menu == "votate_menu") && candidates.map((candidateData, index) => {

                            if (voteResult && voteResult.key !== candidateData.key) {
                                return;
                            }
                            
                            return (
                                <CandidateVoteButton
                                    index={index}
                                    votingContext={votingContext}
                                    key={candidateData.key}
                                    data={candidateData}
                                />
                            );
                        }
                        )}
                    </AnimatePresence>
                </Box>

                <AnimatePresence>

                    {
                        voteResult &&

                        <>
                        
                            <motion.p
                                key={"vote_finished_text"}
                                layout
                                style={{ textAlign: "center", maxWidth:"400px", margin:"0 auto", padding:"10px", background:"#000000ff" }}
                                initial={{ opacity: 0, y: 200 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 0, transition: { duration: 0.3 } }}
                                transition={{duration:0.5}}
                            >
                                Su voto ha sido realizado correctamente. Por favor deje continuar al siguiente votante.
                            </motion.p>

                            <motion.div
                                    key={"vote_continue_button"}
                                    layout
                                    initial={{ opacity: 0, y: 100 }}
                                    animate={{ opacity: 1, y: 0, transition:{delay:CONTINUE_BUTTON_DELAY} }}
                                    exit={{ opacity: 0, y: 0, transition: { duration: 0.25 } }}
                                    transition={{ duration: 0.3 }}
                                >
                                    
                                    <Button
                                        onClick={continuePressed}
                                        style={{
                                            display: "block",
                                            width: "100%",
                                            maxWidth: "300px",
                                            margin: "0 auto"
                                        }}>
                                        Siguiente voto
                                    </Button>
                            </motion.div>
                        
                        </>



                    }


                </AnimatePresence>
            </Box>

        </div>
    );
}