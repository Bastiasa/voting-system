
import { DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES, forwardRef, ReactNode } from 'react';
import '../classes.css';
import { joinClases } from './Utilities';

interface BoxProps extends React.ComponentPropsWithoutRef<"div"> {
    spacing?:
    string, children?: ReactNode | null,
    direction?: 'vertical' | 'horizontal',
}

export const Box = forwardRef<HTMLDivElement, BoxProps>(
    (props, ref) => {

        const {style={}, spacing = '20px', children, direction = 'vertical', className='', ...rest } = props;

        return (
            <div ref={ref} className={joinClases(direction, 'box', className)} style={{ gap: spacing, ...style }} {...rest}>
                {children}
            </div>
        );
    }
);

