import type { ScheduableServer, ScheduleGroup } from "../types/scheduler";
import { test_connection } from "./connection.util";
import type { ProxyConfig } from "../types/config";
import type { ScheduleStrategy } from "../types/config"
import type { Server } from "../types/config";
import {logger} from './logger.service';

export abstract class AbstractServerScheduler {


    abstract next(): { server: string, profile: (stat: number) => void };
    abstract add(server: ScheduableServer): void;
    abstract remove(server: ScheduableServer): void;
    abstract forEach(fn: (server: ScheduableServer) => void): void;

}


class SINGLETONScheduler extends AbstractServerScheduler {
    private readonly scheduleGroup: ScheduleGroup;
    private server: ScheduableServer;


    private timeoutHandler?: NodeJS.Timeout;
    private async updateAlive(): Promise<void> {
        if (this.scheduleGroup.timeout === undefined) {
            return;
        }
        clearTimeout(this.timeoutHandler);
        const singleton: ScheduableServer = this.scheduleGroup.servers[0];
        if (await test_connection(singleton.location)) {
            this.server = singleton;

            this.timeoutHandler = this.scheduleGroup.timeout ? setTimeout(() => {
                this.updateAlive();
            },
                Math.max(this.scheduleGroup.timeout,) * 1000) : undefined;
        } else {
            this.timeoutHandler = setTimeout(() => {
                this.updateAlive();
            }, 10 * 1000);
        }
    }


    constructor(scheduleGroup: ScheduleGroup) {
        super();
        this.scheduleGroup = scheduleGroup;
        this.server = scheduleGroup.servers[0];
        this.timeoutHandler = this.scheduleGroup.timeout ? setTimeout(() => {
            this.updateAlive();
        }, 0) : undefined;
    }

    next(): { server: string, profile: (stat: number) => void } {
        const server = this.server;
        return { server: server.location, profile: (stat: number) => { server.serveTime++ } };
    }

    add(server: ScheduableServer): void {
        this.server = server;
    }

    remove(server: ScheduableServer): void {
        if (this.server.id === server.id) {
            this.server = this.scheduleGroup.servers[0];
        }
    }

    forEach(fn: (server: ScheduableServer) => void): void {
        fn(this.server);
    }


}

abstract class LinearScheduler extends AbstractServerScheduler {
    protected readonly scheduleGroup: ScheduleGroup;
    protected index: number;
    protected timeoutHandler?: NodeJS.Timeout;

    protected alive_servers: ScheduableServer[];

    constructor(scheduleGroup: ScheduleGroup) {
        super();
        this.scheduleGroup = scheduleGroup;
        this.alive_servers = [];
        this.index = 0;
        this.updateAlive();
        this.timeoutHandler = this.scheduleGroup.timeout ? setTimeout(() => {
            this.updateAlive();
        },
            0) : undefined;
    }
    protected async updateAlive(): Promise<void> {


        if (this.scheduleGroup.timeout === undefined) {
            return;
        }

        clearTimeout(this.timeoutHandler);
        this.alive_servers = [];

        for (let i = 0; i < this.scheduleGroup.servers.length; i++) {

            const server = this.scheduleGroup.servers[i];

            if (await test_connection(server.location)) {

                this.alive_servers.push(server);

            }
        }
        if (this.alive_servers.length === 0) {

            this.timeoutHandler = setTimeout(() => {
                this.updateAlive()

            }, 10 * 1000)
        } else {

            this.timeoutHandler = this.scheduleGroup.timeout ? setTimeout(() => {
                this.updateAlive();
            },
                Math.max(this.scheduleGroup.timeout, 60 * 3) * 1000) : undefined;
        }

    }
    add(server: ScheduableServer): void {
        this.scheduleGroup.servers.push(server);
        this.updateAlive();
    }

    remove(server: ScheduableServer): void {
        const index = this.scheduleGroup.servers.findIndex((s) => s.id === server.id);
        if (index !== -1) {
            this.scheduleGroup.servers.splice(index, 1);
        }
        this.updateAlive();
    }

    forEach(fn: (server: ScheduableServer) => void): void {
        this.alive_servers.forEach(fn);
    }

    abstract next(): { server: string, profile: (stat: number) => void };

}


class RoundRobinScheduler extends LinearScheduler {


    constructor(scheduleGroup: ScheduleGroup) {
        super(scheduleGroup);


    }



    next(): { server: string, profile: (stat: number) => void } {
        if (this.alive_servers.length === 0) {
            throw new Error("No server available");
        } else {
            this.index = (this.index + 1) % this.alive_servers.length;
            const server = this.alive_servers[this.index];
            return {
                server: server.location,
                profile: (stat: number) => { server.serveTime++ }
            }
        }
    }


}



class WeightedRandomScheduler extends LinearScheduler {

    private totalWeight = 0;


    constructor(scheduleGroup: ScheduleGroup) {
        super(scheduleGroup);
        this.totalWeight = 0;
        this.updateAlive();
    }

    protected async updateAlive(): Promise<void> {
        if (this.scheduleGroup.timeout === undefined) {
            return;
        }
        clearTimeout(this.timeoutHandler);
        this.alive_servers = [];
        this.totalWeight = 0;
        for (let i = 0; i < this.scheduleGroup.servers.length; i++) {

            const server = this.scheduleGroup.servers[i];

            if (await test_connection(server.location)) {

                this.alive_servers.push(server);
                this.totalWeight += server.getWeight();

            }
        }
        if (this.alive_servers.length === 0) {

            this.timeoutHandler = setTimeout(() => {
                this.updateAlive()

            }, 10 * 1000)
        } else {

            this.timeoutHandler = this.scheduleGroup.timeout ? setTimeout(() => {
                this.updateAlive();
            },
                Math.max(this.scheduleGroup.timeout, 60 * 3) * 1000) : undefined;
        }

    }

    next(): { server: string, profile: (stat: number) => void } {
        if (this.alive_servers.length === 0) {
            throw new Error("No server available");
        } else {
            const rand = Math.random() * this.totalWeight;
            let sum = 0;
            for (let i = 0; i < this.alive_servers.length; i++) {
                sum += this.alive_servers[i].getWeight();
                if (rand < sum) {
                    const server = this.alive_servers[i];
                    return {
                        server: server.location,
                        profile: (stat: number) => { server.serveTime++ }
                    }
                }
            }
            const server = this.alive_servers[this.alive_servers.length - 1];
            return {
                server: server.location,
                profile: (stat: number) => { server.serveTime++ }
            }
        }
    }


}

// MIN_HEAP
class ServerHeap {


    private _size: number;

    size() {
        return this._size;
    }


    private heap = Array<ScheduableServer>();

    constructor(servers: ScheduableServer[]) {
        if (servers.length === 0) {
            throw new Error("No server available");
        } else {
            this._size = servers.length;
            this.heap = servers;
            this.buildHeap();
        }
    }

    private buildHeap(): void {
        for (let i = Math.floor(this._size / 2); i >= 0; i--) {
            this.heapfy_down(i);
        }
    }

    public add(server: ScheduableServer): void {
        this._size++;
        this.heap.push(server);
        this.heapify_up(this._size - 1);
    }

    public remove(server: ScheduableServer): void {
        const index = this.heap.findIndex((s) => s.id === server.id);
        if (index !== -1) {
            this.heap[index] = this.heap[this._size - 1];
            this._size--;
            this.heapify_up(index);
            this.heapfy_down(index);
        }
    }

    public pop(): ScheduableServer {
        if (this._size === 0) {
            throw new Error("No server available");
        }
        const server = this.heap[0];
        this.heap[0] = this.heap[this._size - 1];
        this._size--;
        this.heapfy_down(0);
        return server;
    }


    private heapify_up(index: number): void {
        if (index === 0) {
            return;
        }
        const parent = Math.floor((index - 1) / 2);
        if (this.heap[parent].getWeight() < this.heap[index].getWeight()) {
            const temp = this.heap[parent];
            this.heap[parent] = this.heap[index];
            this.heap[index] = temp;
            this.heapify_up(parent);
        }
    }

    private heapfy_down(index: number): void {
        const left = index * 2 + 1;
        const right = index * 2 + 2;
        if (left >= this._size) {
            return;
        }
        if (right >= this._size) {
            if (this.heap[left].getWeight() > this.heap[index].getWeight()) {
                const temp = this.heap[left];
                this.heap[left] = this.heap[index];
                this.heap[index] = temp;
                this.heapfy_down(left);
            }
        } else {
            if (this.heap[left].getWeight() > this.heap[right].getWeight()) {
                if (this.heap[left].getWeight() > this.heap[index].getWeight()) {
                    const temp = this.heap[left];
                    this.heap[left] = this.heap[index];
                    this.heap[index] = temp;
                    this.heapfy_down(left);
                }
            } else {
                if (this.heap[right].getWeight() > this.heap[index].getWeight()) {
                    const temp = this.heap[right];
                    this.heap[right] = this.heap[index];
                    this.heap[index] = temp;
                    this.heapfy_down(right);
                }
            }
        }
    }






}

abstract class MaxHeapScheduler extends AbstractServerScheduler {
    protected timeoutHandler?: NodeJS.Timeout;
    protected abstract updateAlive(): Promise<void>;

}

class MinRTTScheduler extends MaxHeapScheduler {
    private readonly scheduleGroup: ScheduleGroup;
    private heap: ServerHeap;
    protected timeoutHandler?: NodeJS.Timeout;
    constructor(scheduleGroup: ScheduleGroup) {
        super();
        this.scheduleGroup = scheduleGroup;
        const servers: ScheduableServer[] = scheduleGroup.servers;
        this.heap = new ServerHeap(servers);



        this.timeoutHandler = this.scheduleGroup.timeout ? setTimeout(() => {
            logger.info(`Set Update alive servers for ${this.scheduleGroup.service} at constructor`);
            this.updateAlive();
        }, 0) : undefined;
    }

    protected async updateAlive(): Promise<void> {
        
        if (this.scheduleGroup.timeout === undefined) {
            logger.info(`No timeout for ${this.scheduleGroup.service}`);
            return;
        }
        logger.info(`Update alive servers for ${this.scheduleGroup.service}`);
        clearTimeout(this.timeoutHandler);
        const servers: ScheduableServer[] = this.scheduleGroup.servers;
        const alive_servers: ScheduableServer[] = [];
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            if (await test_connection(server.location)) {
                alive_servers.push(server);
            }
        }

        logger.info(`Alive servers for ${this.scheduleGroup.service} ${alive_servers.map((s) => s.location).join(",")}`);
        if (alive_servers.length === 0) {
            this.timeoutHandler = setTimeout(() => {
                this.updateAlive();
            }, 5 * 1000)
        } else {
            this.heap = new ServerHeap(alive_servers);
            this.timeoutHandler = this.scheduleGroup.timeout ? setTimeout(() => {
                this.updateAlive();
            }, Math.max(this.scheduleGroup.timeout, 5) * 1000) : undefined;
            this.heap = new ServerHeap(alive_servers);
        }
    }

    next(): { server: string, profile: (stat: number) => void } {
        const server = this.heap.pop();
        return {
            server: server.location,
            profile: (stat: number) => {
                server.serveTime++;
                server.setWeight((server.weight + stat + 1) / (server.serveTime + 1));
                this.heap.add(server);
            }
        }
    }
    add(server: ScheduableServer): void {
        this.heap.add(server);
    }
    remove(server: ScheduableServer): void {
        this.heap.remove(server);
    }
    forEach(fn: (server: ScheduableServer) => void): never {
        throw new Error("Method not implemented.");
    }
}


const mapGetWeightFunction: {
    [key in ScheduleStrategy]: (server: Server) => () => number
} = {
    "SINGLETON": (server: Server) => () => 1,
    "ROUND_ROBIN": (server: Server) => () => 1,
    "WEIGHTED_RANDOM": (server: Server) => () => server.weight,
    "MIN_AVG_RTT": (server: Server) => () => -server.weight
}



export function schedulerFactory(proxyRoute: ProxyConfig[number]): AbstractServerScheduler {
    const scheduleGroup: ScheduleGroup = {
        service: proxyRoute.service,
        servers: proxyRoute.serviceProvider.map((server) => ({
            ...server,
            id: Symbol(),
            getWeight: mapGetWeightFunction[proxyRoute.scheduleStrategy](server),
            setWeight: (weight) => { server.weight = weight; },
            serveTime: 0
        })),
        timeout: proxyRoute.timeout
    }
    switch (proxyRoute.scheduleStrategy) {
        case "SINGLETON":
            return new SINGLETONScheduler(scheduleGroup);
        case "ROUND_ROBIN":
            return new RoundRobinScheduler(scheduleGroup);
        case "WEIGHTED_RANDOM":
            return new WeightedRandomScheduler(scheduleGroup);
        case "MIN_AVG_RTT":
            return new MinRTTScheduler(scheduleGroup);
        default:
            throw new Error("Invalid schedule strategy");
    }
}

// const proxyConfig: ProxyConfig = [

// ]

// const serviceProvider: Server[] = []

// for (let i = 0; i < 100; i++) {
//     serviceProvider.push({
//         location: `http://localhost:${i}`,
//         weight: Math.floor(Math.random() * 1000)

//     })
// }

// proxyConfig.push({
//     service: "test",
//     serviceProvider,
//     scheduleStrategy: "MIN_AVG_RTT"
// })
// const scheduler = schedulerFactory(proxyConfig[0]);
// const test = async () =>{
// try {
//     while (true) {
//         const {server, profile} = scheduler.next();
//         console.log(`Request to ${server}`);
//         profile(Math.floor(Math.random() * 1000));
//         await new Promise((resolve) => {
//             setTimeout(resolve, 300);
//         })
//     }
// } catch (e) {

// }
// }

// test();


