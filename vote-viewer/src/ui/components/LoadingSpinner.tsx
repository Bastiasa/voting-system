import { CSSProperties } from "react";
import "./style/loading-spinner-style.css";


export function LoadingSpinner({
    size = "32px",
    thickness = "10px"
}: {
        size?: string,
        thickness?:string
}) {
    
    const style: CSSProperties = {
        width: size,
        height: size,

        border: `${thickness} solid gray`,
        borderTop: `${thickness} solid transparent`
    };

    return (
        <div className="loading-spinner" style={style}>
        </div>
    );
}