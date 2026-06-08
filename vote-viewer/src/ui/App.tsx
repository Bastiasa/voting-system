
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';
import { TopBannerTools } from './components/TopBanner';
import { VotesChart } from './components/VotesChart';

import './App.css';
import './google_icons_fonts.css';


const ApplicationContext = createContext<undefined | ApplicationContextMap>(undefined);

export function useApplicationContext() {
  return useContext(ApplicationContext);
}

const VotesReceiver = () => {


  return <></>;
}

export function ApplicationProvider({ children }: { children?: ReactNode }) {
  
  const [menu, setMenuState] = useState("main");
  const [receivedVotes, setReceivedVotesState] = useState<ReceivedVotes>({});
  const [candidates, setCandidatesState] = useState<UniqueCandidateData[]>([]);

  const candidatesNextId = useRef(0);

  function getCandidateId():number {
    candidatesNextId.current++;
    return candidatesNextId.current;
  }


  const setMenu = (menu: string) => {
    setMenuState(menu);
  }

  const setCandidates = (candidatesData: UniqueCandidateData[]) => {
    setCandidatesState(candidatesData);
  }

  const getReceivedVotesById = (candidateId: string): number => {
    let result = 0;

    for (const receivedMap of Object.values(receivedVotes)) {
      const possibleReceivedVotes = receivedMap[candidateId];

      if (possibleReceivedVotes) {
        result += possibleReceivedVotes;
      }
    }

    return result;
  }


  useEffect(() => { 

    const listener = window.electron.onCandidateVotesReceived((votes: CandidateVotes, from: string) => {
      setReceivedVotesState((previous: ReceivedVotes) => {
        const receivedAlready: object = previous[from] || {};

        return {
          ...previous,
          [from]: {
            ...(receivedAlready || {}),
            [votes.id]: votes.votes
          }
        } as ReceivedVotes
      });
    });

    return () => {
      window.electron.removeRendererListener('candidate-votes',listener);
    }

  });

  const data = {
    menu,
    setMenu,

    candidates,
    setCandidates,

    getCandidateId,

    receivedVotes,

    getReceivedVotesById
  };

  return <ApplicationContext.Provider value={data}>
    <VotesReceiver/>
    {children}
  </ApplicationContext.Provider>
}

function App() {



  return (
    <>
      <ApplicationProvider>
        <TopBannerTools />
        <VotesChart/>
      </ApplicationProvider>
    </>
  )
}

export default App
