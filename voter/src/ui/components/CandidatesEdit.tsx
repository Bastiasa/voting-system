import { useEffect, useRef, useState } from "react";
import { Box } from "./Box";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { AnimatePresence, motion} from 'framer-motion';
import { useMenuManagerContext, useShowOnMenu } from "./MenuManager";
import { useMainApplicationContext } from "../App";

import emptyPfp from '../assets/empty_pfp.png';



function hideElements(...elements:HTMLElement[]) {
    elements.forEach(element => {
        element.style.display = "none";
    });
}

function removeElements(...elements:HTMLElement[]) {
    elements.forEach(element => {
        element.remove();
    });
}

function CandidateEditableDataView({ data, clean, onEdited }: {
    data: CandidateData,
    clean?: () => void,
    onEdited?: () => void
}) {
    
    const imageInputReference = useRef<HTMLInputElement>(null);
    const imageElementReference = useRef<HTMLImageElement>(null);

    const candidateNameRef = useRef<HTMLInputElement>(null);
    const candidateIdRef = useRef<HTMLInputElement>(null);

    const minWaitTimeForSave = 600;

    let lastTyped = useRef(-minWaitTimeForSave);

    const [imageHover, setImageHover] = useState(false);
    
    useEffect(() => {

        let animationFrame = -1;
        let saved = true;

        const mainLoop = (time: number) => {

            const timeDifference = performance.now() - lastTyped.current;
            

            if (timeDifference < minWaitTimeForSave) {
                saved = false;
            }

            if (!saved && timeDifference > minWaitTimeForSave) {
                
                saved = true

                if (candidateIdRef.current) {
                    data.id = candidateIdRef.current.value;
                }

                if (candidateNameRef.current) {
                    data.name = candidateNameRef.current.value;                
                }

                onEdited?.();
            }

            animationFrame = requestAnimationFrame(mainLoop);
        }

        animationFrame = requestAnimationFrame(mainLoop);

        return () => {
            cancelAnimationFrame(animationFrame);
        }
        
    }, []);

    function onImageMouseEnter() {
        setImageHover(true);
    }

    function onImageMouseLeave() {
        setImageHover(false);
    }
    

    function onChangeImageInputChanged(event:React.ChangeEvent) {
        const inputElement = imageInputReference.current;

        if (!inputElement) {
            return;
        }

        const imageFile: File | undefined = inputElement.files?.[0];

        if (!imageFile ) {
            return;
        }
        
        if (!imageFile.type.startsWith("image")) {
            alert("El archivo no es una imagen válida.");
            return;
        }
        
        const dataUrl = URL.createObjectURL(imageFile);
        const canvasElement = document.createElement("canvas");
        const context = canvasElement.getContext("2d", {willReadFrequently:false}) as CanvasRenderingContext2D;

        const imageElement = new Image();

        imageElement.addEventListener('load', e => {

            let width = 0;
            let height = 0;

            const size = 448;

            if (imageElement.naturalHeight > size || imageElement.naturalWidth > size) {
                if (imageElement.naturalWidth > imageElement.naturalHeight) {
                    width = size;
                    height = (size / imageElement.naturalWidth) * imageElement.naturalHeight;
                } else if (imageElement.naturalWidth < imageElement.naturalHeight) {
                    width = (size / imageElement.naturalHeight) * imageElement.naturalWidth;
                    height = size;
                } else {
                    width = size;
                    height = size;
                }
            } else {
                width = imageElement.naturalWidth;
                height = imageElement.naturalHeight;
            }

            canvasElement.width = width;
            canvasElement.height = height;

            context.drawImage(imageElement, 0, 0, width, height);
            
            const dataUrl = canvasElement.toDataURL("image/jpeg", .78);
            
            if (imageElementReference.current) {
                imageElementReference.current.src = dataUrl;
            }

            data.picture = dataUrl;

            onEdited?.();
            removeElements(imageElement, canvasElement);
        });

        imageElement.addEventListener('error', e => {

            removeElements(
                imageElement,
                canvasElement
            );
            
            alert("No se pudo cargar la imagen correctamente. Tal vez esté corrupta.");
        });

        document.body.appendChild(canvasElement);
        document.body.appendChild(imageElement);

        hideElements(imageElement, canvasElement);

        imageElement.src = dataUrl;
    }

    function onImageClicked(evet:React.MouseEvent) {
        if (imageInputReference.current) {
            imageInputReference.current.click();
            console.log(imageInputReference);
            
        }
    }

    function onInputTyped() {
        lastTyped.current = performance.now();
    }

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            
            className="vertical box"
            style={{width:"170px", gap:"10px"}}
        >

            <input ref={imageInputReference} accept="image/*" onChange={onChangeImageInputChanged} type="file" style={{display:"none"}} />

            <div
                
                onMouseEnter={onImageMouseEnter}
                onMouseLeave={onImageMouseLeave}
                onClick={onImageClicked}

                style={{
                    position: "relative",
                    width: "100%",
                    height: "170px",
                    cursor: "pointer"
                }}>
                <img
                    ref={imageElementReference}
                    
                    style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain"
                    }}
                    src={data.picture ?? emptyPfp} alt="Foto de perfil del candidato"
                />

                {imageHover &&
                    <div
                        style={{
                        position: "absolute",
                        
                        left: "0",
                        right: "0",
                        top: "0",
                        bottom: "0",
                        
                        backgroundColor: "#000000a0",

                        textAlign: "center",
                        fontSize: "13px",

                        padding:"7px 20px",

                        display: "flex",
                        justifyContent: "center",
                        alignItems:"center"
                    }}>
                        <span
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                gap:"10px"
                            }}
                        >Haga click para cambiar imagen <Icon iconName="photo_library" /></span>
                    </div>
                }
            </div>


            <input ref={candidateNameRef} onInput={onInputTyped} type="text" name="candidate-name" placeholder="Nombre" defaultValue={data.name} />
            <input ref={candidateIdRef} onInput={onInputTyped} type="text" name="candidate-id" placeholder="Identificador" defaultValue={data.id} />

            <Button className="delete-candidate-button" onMouseUp={()=>clean?.()} style={{justifyContent:"space-between"}}>Eliminar <Icon iconName="delete"/> </Button>
        </motion.div>

    );
}

function ActionButtons({
    cleanButtonClicked,
    addCandidateClicked,
    importFileClicked,
    exportClicked,
    candidatesCount
}: {
        cleanButtonClicked?: React.MouseEventHandler,
        addCandidateClicked?: React.MouseEventHandler,
        importFileClicked?: React.MouseEventHandler,
        exportClicked?: React.MouseEventHandler,
        candidatesCount?: number,
    }) {
    
    const isAtLeastOne = (candidatesCount != undefined && candidatesCount > 0);
    
    return (
        <div style={{overflow:"auto"}}>
            <Box style={{width:"fit-content"}} direction="horizontal">
                <Button style={{overflow:"hidden", textWrap:"nowrap"}} onMouseUp={addCandidateClicked}>Añadir candidato <Icon iconName="new_window"/> </Button>
                <Button style={{overflow:"hidden", textWrap:"nowrap"}} onClick={importFileClicked}>Importar <Icon iconName="file_open"/> </Button>
                <Button style={{overflow:"hidden", textWrap:"nowrap"}} onClick={exportClicked} disabled={!isAtLeastOne}>Exportar <Icon iconName="file_export"/></Button>
                <Button style={{overflow:"hidden", textWrap:"nowrap"}} onMouseUp={cleanButtonClicked} disabled={!isAtLeastOne}>Limpiar <Icon iconName="cleaning_bucket"/> </Button>
            </Box>
        </div>

    )
}


export function CandidatesEditMenu({ }) {


    const { setMenu, menu} = useMenuManagerContext();
    const { candidates, setCandidates, getCandidateUniqueKey } = useMainApplicationContext();

    const mustSave = useRef(false);
    function handleOnBackButtonClicked() {
        setMenu("main");
    }

    function getCandidateElementKey() {
        return `candidate_editable_view#${getCandidateUniqueKey()}`;
    }

    function handleAddCandidateClicked() {

        let defaultId = 0;

        function generateDefaultId() {
            let result = '';

            while (!result || candidates.find(v => v.id === result)) {
                defaultId++;
                result = `#${defaultId.toString(10).padStart(2, '0')}`;
            }

            return result;
        }

        let id = generateDefaultId();

        const candidateData: UniqueCandidateData = {
            id,
            name: "Sin nombre",
            picture: undefined,
            key: getCandidateElementKey()
        }

        mustSave.current = true;
        setCandidates([...candidates, candidateData]);
    }

    function handleImportCandidateClicked() {
        window.electron.invoke('import-candidates').then((result) => {
            if (result) {

                result.forEach(candidateData => {
                    (candidateData as UniqueCandidateData).key = getCandidateElementKey();
                });

                mustSave.current = true;
                setCandidates(result as CandidateData[]);

                console.log("Loaded candidates: ", result);
                
            }
        })
    }

    function handleExportClicked() {
        const savingCandidatesData = structuredClone(candidates);
        savingCandidatesData.forEach(candidateData => delete candidateData.key);
        window.electron.invoke('export-candidates', savingCandidatesData);
    }

    function saveCandidates() {
        window.electron.invoke("save-candidates", candidates);
        console.log("Guardado nwn");
        
    }

    function deleteCandidate(candidateIndex: number) {
        mustSave.current = true;
        setCandidates(candidates.filter((v, i) => i !== candidateIndex));
    }


    function handleCleanButtonClicked() {
        mustSave.current = true;
        setCandidates([]);
    }

    if (mustSave.current) {
        saveCandidates();
    }

    return (
        <div className="menu" id="candidates-menu" ref={useShowOnMenu("candidates_menu")}>
            <Box className="centered-block" style={{ padding: "20px", height:"100%" }}>
                <Box style={{justifyContent:"space-between", height:"fit-content"}} direction="horizontal">
                    <span style={{overflow:"visible"}}>
                        <Button onClick={handleOnBackButtonClicked}><Icon iconName="arrow_left" /></Button>
                    </span>

                    <ActionButtons
                        cleanButtonClicked={handleCleanButtonClicked}
                        addCandidateClicked={handleAddCandidateClicked}
                        exportClicked={handleExportClicked}
                        importFileClicked={handleImportCandidateClicked}
                        candidatesCount={candidates.length}
                        
                        
                        />
                </Box>
                
                <div style={{flexGrow:"1", overflowY:"auto"}}>
                    <Box direction="horizontal" style={{justifyContent: "center", flexWrap: "wrap"}}>
                        <AnimatePresence>
                        
                            {
                                (candidates.length > 0 && menu == "candidates_menu")
                                    ? candidates.map((candidateData, index) => {

                                        

                                        return <CandidateEditableDataView
                                            key={candidateData.key}
                                            data={candidateData}
                                            clean={() => deleteCandidate(index)}
                                            onEdited={saveCandidates}
                                        />
                                    } )
                                    : <span></span>
                            }
                        </AnimatePresence>
                    </Box>
                </div>


            </Box>
        </div>
    );
}