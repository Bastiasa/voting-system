// import rsbLogo from './assets/rsb_logo.png';
import { MenuManagerProvider, useShowOnMenu, useMenuManagerContext } from './components/MenuManager';
import { Box } from './components/Box';

import rsbLogo from './assets/rsb_logo.png';

import './App.css';
import './classes.css'
import './google_icons_fonts.css';
import { MainMenu } from './components/MainMenu';
import { SettingMenu } from './components/SettingsMenu';
import { CandidatesEditMenu } from './components/CandidatesEdit';
import { createContext, RefObject, useContext, useEffect, useRef, useState } from 'react';
import { VotateMenu } from './components/VotateMenu';

type ApplicationContext = {
  readonly getCandidateUniqueKey: ()=>number
  readonly candidates: UniqueCandidateData[]
  readonly setCandidates: (candidates: CandidateData[]) => void
  
  readonly votes: Votes
  readonly setVotes: (votes: Votes) => void
  
  readonly votationTitle: string | undefined
  readonly setVotationTitle: (title: string) => void
  
  readonly loadCandidatesPromise: RefObject<{
    promise: Promise<CandidateData[]>
    setted: boolean
  }>
}

const MainApplicationContext = createContext<ApplicationContext>({
  getCandidateUniqueKey: ()=>-1,
  setCandidates: (candidates) => { },
  candidates: [],
  
  setVotes: (votes) => { },
  votes: [],

  votationTitle: undefined,
  setVotationTitle: (title: string | undefined) => { },
  loadCandidatesPromise: {
    current: {
      promise: new Promise<CandidateData[]>(resolve => resolve([])),
      setted: false
    }
  }
});

export function MainApplicationProvider({ children }: { children?: React.ReactNode|null }) {
  
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [votes, setVotes] = useState<Votes>([]);
  const [votationTitle, setVotationTitle] = useState<string | undefined>();

  const nextCandidateKey = useRef(0);

  const getCandidateUniqueKey = () => {
    nextCandidateKey.current++;
    return nextCandidateKey.current;
  }

  const loadCandidatesPromise = useRef({
    promise: new Promise<CandidateData[]>(resolve => resolve([])),
    setted: false
  });

  const contextData: ApplicationContext = {
    getCandidateUniqueKey,
    setCandidates,
    candidates,

    setVotes,
    votes,

    votationTitle,
    setVotationTitle,

    loadCandidatesPromise
  }

  return (
    <MainApplicationContext.Provider value={contextData}>
      {children}
    </MainApplicationContext.Provider>
  );
}

export function useMainApplicationContext() {
  return useContext(MainApplicationContext);
}

function CandidatesLoader() {

  const { setCandidates, loadCandidatesPromise, getCandidateUniqueKey } = useMainApplicationContext();

  function setContextPromise() {
    const promise = new Promise<CandidateData[]>(async (resolve) => {
      const { result, success } = await window.electron.invoke('load-candidates');

      if (success) {
        result.forEach(candidateData => {
          (candidateData as UniqueCandidateData).key = `unique_candidate_element__${getCandidateUniqueKey()}`;
        });
        
        setCandidates(result);
        resolve(result);
        return;
      }

      resolve([]);
    });

    loadCandidatesPromise.current = {
      promise,
      setted:true
    };
  }
  
  if (!loadCandidatesPromise.current.setted) {
    setContextPromise();
  }


  return (
    <></>
  );
  
}

function App() {

  useEffect(() => { 
    window.electron.sendReady();
  }, []);

  return (
    <>
      
      <img src={rsbLogo} alt="Logo institucional" id="centered-logo" />
      
      <MainApplicationProvider>
        <CandidatesLoader/>
        <MenuManagerProvider>
          <SettingMenu />
          <MainMenu />
          <VotateMenu />
          <CandidatesEditMenu />
        </MenuManagerProvider>
      </MainApplicationProvider>
      
    </>
  )
}

export default App;
