import { CSSProperties } from "react";
import { Box } from "./Box";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { useMenuManagerContext, useShowOnMenu } from "./MenuManager";
import { useMainApplicationContext } from "../App";

export function MainMenu({ }) {

    const { setMenu } = useMenuManagerContext();
    const { candidates } = useMainApplicationContext();

  function handleOnSettingButtonClick() {
    setMenu("settings");
    }
    
    function handleEditCandidatesButtonClick() {
        setMenu("candidates_menu");
    }

    function handleStartVoteClick() {
        setMenu("votate_menu")
    }
  
    return (
        <div ref={useShowOnMenu<HTMLDivElement>('main')} id='configuration-layout' className='menu centered-block' style={{ padding: '20px' }}>
            <Box className="container-01">
                <Box direction="horizontal">
                    <Button onClick={handleOnSettingButtonClick}>
                        <Icon iconName="settings" />
                    </Button>
                </Box>

                <Box className="centered-block" style={{ maxWidth: "400px" }}>
                    <Icon iconName="how_to_vote" className="centered-block bg-01" size="128px" />

                    <Box style={{padding:"10px", backgroundColor:"#00000020"} as React.CSSProperties} spacing="0">
                        <p  style={{textAlign:"center"}}>Institución Educativa Regional Simón Bolívar</p>
                        <p className="little-gray" style={{ textAlign: 'center' }}>Sistema de votación</p>
                    </Box>

                    <div
                        style={{textAlign:"center"}}
                        className="little-gray">Recuerde usar Ctrl + F para finalizar la votación.</div>

                    <Button onClick={handleStartVoteClick} disabled={candidates.length < 1} style={{justifyContent:"space-between"}}>Iniciar la votación <Icon iconName="start"/> </Button>
                    <Button onClick={handleEditCandidatesButtonClick} style={{justifyContent:"space-between"}}>Editar candidatos <Icon iconName="edit"/> </Button>
                </Box>

                <span></span>
            </Box>
        </div>
    );
}
