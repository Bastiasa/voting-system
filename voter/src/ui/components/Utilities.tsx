

export function joinClases(...classNames:string[]) {  
    classNames = classNames.filter(c => c.length > 0);
    return classNames.join(" ");
}