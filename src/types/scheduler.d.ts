import type {Server} from './config.d.ts';

// type Scheduable_Server = {
//     location: string;
//     getWeight: () => number;
//     setWeight:(number)=>void
//     id: symbol;
// }

type ScheduableServer = Server & {
    id: symbol;
    getWeight: () => number;
    setWeight: (val:number) => void;
    serveTime: number;
}

type ScheduleGroup = {
    service: string;
    servers:ScheduableServer[];
    timeout?: number;
}







export type {ScheduableServer, ScheduleGroup};
