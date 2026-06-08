
import { useEffect, useRef, useState } from 'react';
import './style/tobanner.css';
import { Box } from './Box';
import { useApplicationContext } from '../App';



export function TopBannerTools() {

    const topBannerReference = useRef<HTMLDivElement>(null);
    const formReference = useRef<HTMLFormElement>(null);
    const [visible, setVisible] = useState(false);

    const _givenPort = parseInt(localStorage.getItem("port") ?? "8999", 16);
    const givenPort = (isFinite(_givenPort)) ? _givenPort : 8999;

    const { getReceivedVotesById, setCandidates, candidates } = useApplicationContext() as ApplicationContextMap;

    useEffect(() => {

        window.electron.startUDPSocket(givenPort);

        let lastMouseVerticalPosition:undefined|number = undefined;
        let visibilityCheckId = -1;

        const onMouseMove = (event: MouseEvent) => {
            lastMouseVerticalPosition = event.offsetY;
        }

        const checkVisibility = () => {
            
            if (!lastMouseVerticalPosition || !topBannerReference.current) {
                runVisibilityCheck();
                return;
            }

            if (lastMouseVerticalPosition <= topBannerReference.current.offsetHeight) {
                setVisible(true);
            } else {
                setVisible(false);
            }

            runVisibilityCheck();
        }
                    
        const runVisibilityCheck = () => visibilityCheckId = requestAnimationFrame(checkVisibility);

        visibilityCheckId = runVisibilityCheck();
        window.addEventListener("mousemove", onMouseMove);

        return () => {
            cancelAnimationFrame(visibilityCheckId);
            window.removeEventListener("mousemove", onMouseMove);
            console.log("Destroyed");
            
        };

    }, []);

    function checkValidity():boolean {
        if (!formReference.current?.checkValidity()) {
            formReference.current?.requestSubmit();
            return false;
        }
        return true;
    }

    function onSubmit(event: React.FormEvent) {
        event.preventDefault();
    }

    function onImportCandidatesClicked(_:React.MouseEvent) {
        window.electron.importCandidates().then(_ => {
            const { success, result } = _;
            
            if (success) {
                setCandidates(result);
            }
        })
    }

    function onFullscreenClicked() {
        window.electron.switchFullscreen();
    }

    function handleSaveButton() {
        let rows: string[] = [];

        candidates.forEach(candidateData => {

            rows.push([
                candidateData.name,
                candidateData.id,
                getReceivedVotesById(candidateData.id)
            ].join(';'));
        });

        rows = [["Nombre", "ID", "Votos"].join(";"), ...rows];

        const fileContent = '\uFEFF' + rows.join('\n');
        window.electron.saveVotesFile(fileContent);
    }

    function onPortInputChanged(event: React.ChangeEvent) {
        if (!checkValidity()) {
            return;
        }

        const portInputElement = event.target as HTMLInputElement;
        const port = parseInt(portInputElement.value, 10);

        window.electron.startUDPSocket(port);
        localStorage.setItem("port", port.toString(16));
    }

    return (

        <div
            ref={topBannerReference}
            id='main_topbanner'
            className={(visible) ? "" : "hidden"

            }>
            
            <Box style={{
                width: "100%",
                maxWidth: "600px",
                margin:"0 auto"
            }}>
            
            
                <form
                    ref={formReference}
                    onSubmit={onSubmit}>
                    <Box
                        style={{
                            alignItems:"center"
                        }}
                        direction='horizontal'>
                        <p>Puerto</p>

                        <input
                            onChange={onPortInputChanged}
                            type="number"
                            name='port'
                            defaultValue={givenPort}
                            maxLength={5}
                            min={1024}
                            max={2 ** 16 - 1}

                            required
                        />

                        <button onClick={onImportCandidatesClicked}>
                            Importar candidatos
                        </button>

                        <button onClick={onFullscreenClicked}>
                            Pantalla completa
                        </button>

                        <button onClick={handleSaveButton}>
                            Guardar
                        </button>
                    </Box>
                </form>


                
            </Box>
        </div>
    );
}