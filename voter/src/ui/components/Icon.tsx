import { forwardRef } from "react";
import { joinClases } from "./Utilities";

interface IconProps extends React.ComponentPropsWithoutRef<"span"> {
    iconName: IconName,
    size?: string
};
    
export const Icon = forwardRef<HTMLSpanElement, IconProps>(
    (props, ref) => {

        const { iconName, size = "24px", className='', style = {}, ...rest } = props;
        
    
        return (
            <span
                ref={ref}
                className={joinClases("material-symbols-rounded", className)}
                style={{ '--size': size || "24px", ...style } as React.CSSProperties}
                {...rest}
            >
                {iconName}
            </span>
        );
    
    }
);