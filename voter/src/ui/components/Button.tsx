import React, { forwardRef, useRef } from "react";


interface ButtonProps extends React.ComponentPropsWithoutRef<"button"> {
    children?:React.ReactNode|null
}

function mergeRefs<T>(
  ...refs: (React.Ref<T> | undefined | null)[]
): React.RefCallback<T> {
  return (value: T | null) => {
    refs.forEach(ref => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(value);
      } else if ("current" in ref) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    const { style = {}, onClick , onMouseDown, onMouseUp, onMouseLeave, ...rest } = props;


    const buttonRef = useRef<HTMLButtonElement>(null);
    let currentExpandingElement: HTMLDivElement | null = null;
    
    function hideCurrentExpandingElement(callback?:()=>void) {

        if (currentExpandingElement === null) {
            return;
        }

        const computedStyle = getComputedStyle(currentExpandingElement);
        const currentTransform = computedStyle.transform;
        const currentOpacity = computedStyle.opacity;

        const animation = currentExpandingElement.animate(
            [
                { transform: currentTransform, opacity: currentOpacity },
                { transform: "translate(-50%, -50%) scale(13)", opacity: "0" }
            ],
            {
                duration: 500,
                fill: "forwards"
            }
        )

        function removeSelf(this: HTMLDivElement) {
            this.remove();
        }

        const _removeSelfTargetMethod = removeSelf.bind(currentExpandingElement);

        animation?.addEventListener('finish', e => {
            _removeSelfTargetMethod();
            callback?.();
        });
        animation.play();
    }
    
    function handleMouseDown(this:HTMLButtonElement, event:React.MouseEvent<HTMLButtonElement>) {
        onMouseDown?.(event);

        if (event.button !== 0) {
            return;
        }

        if (currentExpandingElement != null) {
            hideCurrentExpandingElement();
        }

        currentExpandingElement = document.createElement("div");
        currentExpandingElement.className = "button-expanding-element";

        const buttonElement = buttonRef.current;

        if (buttonElement instanceof HTMLButtonElement) {
            buttonElement.appendChild(currentExpandingElement);
            
            const boundaries = buttonElement.getBoundingClientRect()

            currentExpandingElement.style.left = `${event.clientX - boundaries.x}px`;
            currentExpandingElement.style.top = `${event.clientY - boundaries.y}px`;
        }
        
        
        const animation = currentExpandingElement.animate(
            [
                { transform: "translate(-50%, -50%) scale(1)", opacity: "1" },
                { transform: "translate(-50%, -50%) scale(6)", opacity: ".15" }
            ],
            {
                duration: 600,
                fill: "forwards"
            }
        )

        //animation.onfinish = ev => expandingElement.remove();
        animation.play();
    }

    function handleMouseUp(event:React.MouseEvent<HTMLButtonElement>) {
        onMouseUp?.(event);

        if (event.button !== 0) {
            return;
        }

        hideCurrentExpandingElement();
        setTimeout(() => onClick?.(event), 200);
    }

    function handleOnClick(event:React.MouseEvent<HTMLButtonElement>) {
        event.preventDefault();
    }

    function handleMouseLave(event:React.MouseEvent<HTMLButtonElement>) {
        onMouseLeave?.(event);
        hideCurrentExpandingElement();
    }

    return (<button
        
        onMouseLeave={handleMouseLave}
        onMouseUp={handleMouseUp}
        onMouseDown={handleMouseDown}
        onClick={handleOnClick}

        style={{
            gap: "10px",
            display: "inline-flex",
            position: "relative",
            overflow: "hidden", ...style
        }}
        ref={mergeRefs(ref, buttonRef)}
        {...rest}
    >{props.children}
    </button>);
});