import { ReactEventHandler, useEffect, useRef } from "react";
import { Box } from "./Box";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { useMenuManagerContext, useShowOnMenu } from "./MenuManager";
import { useMainApplicationContext } from "../App";
import { DEFAULT_VOTATION_TITLE } from "./VotateMenu";


interface SettingsData {
    targetPort: number,
    votationTitle:string|undefined
}

export function SettingMenu({ }) {

    const { setVotationTitle, votationTitle } = useMainApplicationContext();
    const { menu, setMenu } = useMenuManagerContext();

    const votationTitleReference = useRef<HTMLInputElement>(null);
    const sendPortReference = useRef<HTMLInputElement>(null);

    const settingsData = useRef<SettingsData>({
        targetPort: 8999,
        votationTitle: undefined
    });

    useEffect(() => {
        
        if (menu == "settings") {
            let lastSettings: string | null | SettingsData = localStorage.getItem("settings");

            if (lastSettings) {
                try {
                    lastSettings = JSON.parse(lastSettings) as SettingsData;
                    settingsData.current = lastSettings;

                    (votationTitleReference.current as HTMLInputElement).value = settingsData.current.votationTitle ?? "";
                    (sendPortReference.current as HTMLInputElement).value = settingsData.current.targetPort?.toString() ?? "8999";
                    
                    setVotationTitle(settingsData.current.votationTitle ?? "");
                } finally { }
            }
        }

    }, [menu]);


    const formReference = useRef<HTMLFormElement>(null);

    function handleOnBackButtonClicked() {
        setMenu("main");
    }

    const handleOnSettingsSubmited:React.FormEventHandler = function(event:React.FormEvent) {
        event.preventDefault();        
    }

    function handleAcceptButtonClicked(event: React.MouseEvent<HTMLButtonElement>) {
        const formElement = formReference.current as HTMLFormElement;
        const formData = new FormData(formElement);

        if (!formElement.checkValidity()) {
            formElement.requestSubmit();
            return;
        }

        settingsData.current.votationTitle = formData.get("votation-title") as string;
        
        settingsData.current.targetPort = parseInt(formData.get("port") as string ?? "8999", 10);
        settingsData.current.targetPort = !isFinite(settingsData.current.targetPort) ? 8999 : settingsData.current.targetPort;

        setVotationTitle(settingsData.current.votationTitle);
        window.electron.invoke('set-broadcast-port', settingsData.current.targetPort);

        const saveSettings = () => localStorage.setItem("settings", JSON.stringify(settingsData.current));
        
        try {

            if (localStorage.getItem("settings") == null) {
                saveSettings();
            } else {
                const savedSettings = localStorage.getItem("settings");
                if (savedSettings == null) {
                    saveSettings();
                } else {
                    if (savedSettings !== JSON.stringify(settingsData)) {
                        saveSettings();
                    }
                }
            }
        } catch (err) {
            saveSettings();
        }

        setMenu("main")
    }

    function handleResetSettings() {
        formReference.current?.reset();
    }

    return (
        <div ref={useShowOnMenu("settings")} className="menu centered-block" style={{padding:"20px"}}>
            <Box className="container-01">

                <Box direction="horizontal">
                    <Button title="Volver" onClick={handleOnBackButtonClicked}>
                        <Icon iconName="arrow_left"/>
                    </Button>

                    <Button
                        onClick={handleResetSettings}
                        title="Restaurar ajustes">
                        <Icon iconName="reset_settings" />
                    </Button>
                </Box>

                <form ref={formReference} onSubmit={handleOnSettingsSubmited}>
                    <Box style={{maxWidth:"400px"}} className="centered-block">
                        <h2>Configuración adicional</h2>

                        <Box direction="horizontal">
                            <h3 className="fit-width">Título de la votación</h3>
                            <input
                                ref={votationTitleReference}
                                defaultValue={""}
                                placeholder={DEFAULT_VOTATION_TITLE}
                                className="fit-width"
                                type="text"
                                name="votation-title" />
                        </Box>

                        <p className="little-gray">
                                Escriba el título que quiere que se muestra al realizar la votación. Puede dejarlo vacío.
                        </p>

                        <Box direction="horizontal">
                            <h3 className="fit-width">Puerto</h3>
                            <input
                                ref={sendPortReference}
                                className="fit-width"
                                defaultValue={8999}
                                type="number"
                                name="port"
                                min={1024}
                                max={2 ** 16 - 1}
                                step={1}
                                required 
                                />
                        </Box>

                        <p className="little-gray">
                                Escriba el puerto al que se enviará la información de los votos a través de wifi.
                        </p>

                        <Button onClick={handleAcceptButtonClicked} type="submit" style={{justifyContent:"center"}}>Aceptar</Button>
                    </Box>
                </form>


                <span style={{textAlign:"center"}} className="little-gray">&copy; Luis Bastidas 2025</span>

            </Box>
        </div>
    );
}