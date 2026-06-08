import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import emptyPfp from '../assets/empty_pfp.png';
import { useApplicationContext } from "../App";
import { useMemo } from "react";

const colors = [
  "#1E90FF",
  "#FF4500",
  "#32CD32",
  "#FFD700",
  "#8A2BE2",
  "#FF69B4",
  "#A52A2A",
  "#00CED1"
];

interface DataItem {
    value: {
        picture?: string,
        id: string,
        name: string
    }
}

const TEXT_HEIGHT = 32;
const BAR_CHAR_IMAGES_SIZE = 128;

// const CustomBar = (props: BarProps) => {
//     let { x = 0, y = 0, width = 0, height = 0 } = props;
    
//     x = Number(x);
//     y = Number(y);

//     width = Number(width);
//     height = Number(height);


//     const maxSize = 64 + 16;
//     const rectangleWidth = (width < maxSize) ? width : maxSize;

//     const centeredX = (elementWidth: number) => {
//         return x + (width * .5) - (elementWidth * .5);
//     }
    
//     return (
//         <>

//             <rect
//                 x={centeredX(rectangleWidth)}
//                 y={y}
//                 width={rectangleWidth}
//                 height={height}
//             />
//         </>
//   );
// };

type VotesData = { name: string, id: string, picture?: string|null, votes:number }[];


interface TickProps {
    index?:number
    x?: number,
    y?: number,
    width?: number,
    height?: number,
    visibleTicksCount?: number,
    payload?: DataItem,
    dataKey?: string,
    data: VotesData
}

function getColor(index: number) : string {
    return colors[index % colors.length];
}

const BarCharCustomXAxis = (props: TickProps) => {
    let { data, index, x, y, width, height, visibleTicksCount } = props;
    const { id, picture, name } = data[index ?? 0];

    x = Number(x);
    y = Number(y);

    width = Number(width);
    height = Number(height);
    
    const spacing = 10;

    const tickWidth = width / (visibleTicksCount ?? 1)

    const imageSize = (BAR_CHAR_IMAGES_SIZE > (tickWidth-20)) ? (tickWidth - 20) : BAR_CHAR_IMAGES_SIZE;
    const imageX = -imageSize * .5;

    return (
        <g transform={`translate(${x}, ${y + spacing})`}>

            <defs>
                <mask id="rounded-mask">
                    <rect x={imageX} width={imageSize} height={imageSize} rx="5" ry="5" fill="white" />
                </mask>
            </defs>

            <image
                x={imageX}
                width={imageSize}
                height={imageSize}
                href={picture ?? emptyPfp}
                mask="url(#rounded-mask)"
            />

            <text y={spacing + imageSize + 10} textAnchor="middle">
                <tspan style={{ fontSize: "15px" }} x={0} dy={0}>{ name }</tspan>
                <tspan fill="gray" style={{ fontSize: "13px" }} x={0} dy={15}>{ id }</tspan>
            </text>
        </g>
    );
}


export function VotesChart() {

    const { receivedVotes, candidates, getReceivedVotesById } = useApplicationContext();

    const votesData = useMemo(() => {
        return candidates.map(candidateData => ({
            ...candidateData,
            votes: getReceivedVotesById(candidateData.id)
        }));
    }, [candidates, receivedVotes])


    return (
        <div style={{padding:"20px", width:"100%", height:"100%", boxSizing:"border-box"}}>

            <ResponsiveContainer style={{
                boxSizing: "border-box",
                maxWidth: "1200px",
                margin: "0 auto"
            }} width="100%" height="100%">

                <BarChart data={votesData}>
                    <XAxis
                        height={BAR_CHAR_IMAGES_SIZE + 20 + TEXT_HEIGHT}
                        tick={<BarCharCustomXAxis data={votesData} />}
                        dataKey={"name"}
                    />
                    
                    <YAxis />

                    <CartesianGrid vertical={false} />
                    
                        <Bar
                        dataKey="votes"
                        fill="#ccc" // Color por defecto
                        radius={[5, 5, 0, 0]} // Bordes redondeados superiores
                        maxBarSize={BAR_CHAR_IMAGES_SIZE}
                            >
                            {votesData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={getColor(index)} />
                            ))}
                        </Bar>
                </BarChart>
            </ResponsiveContainer>

        </div>

    );
}