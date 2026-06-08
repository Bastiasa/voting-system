import { useState, createContext, useContext, ReactNode, useRef, useEffect } from "react";

type MenuManagerType = {
  menu: string,
  setMenu: (nextMenu:string)=>void
}

const MenuManagerContext = createContext<MenuManagerType>({ menu: "main", setMenu: (menu) => { } });

export function MenuManagerProvider({ children, defaultMenu = 'main' }: { children?: ReactNode | null, defaultMenu?: any }) {
  
  const [menu, setMenuState] = useState(defaultMenu);

  const setMenu = (menu: string) => {
    setMenuState(menu);
  }

  return (
    <MenuManagerContext.Provider value={{ menu, setMenu }}>
      {children}
    </MenuManagerContext.Provider>
  );
}


export function useMenuManagerContext():MenuManagerType {
  return useContext(MenuManagerContext);
}


export function useShowOnMenu<ReferenceType extends HTMLElement>(visibilityMenu: string) {
  // Usamos useRef de manera correcta
  const containerReference = useRef<ReferenceType | null>(null);
  const { menu } = useMenuManagerContext(); // Accedemos al contexto del menú

  useEffect(() => { 
    if (!containerReference.current) {
      return;
    }

    const container = containerReference.current;

    if (menu !== visibilityMenu) {
      container.style.display = "none";
    } else {
      container.style.display = "";
    }

  }, [menu, visibilityMenu]);

  return containerReference;
}