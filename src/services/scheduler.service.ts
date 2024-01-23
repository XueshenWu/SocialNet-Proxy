import type { Server, ServerGroup } from "../types/server-scheduler";
import { test_connection } from "./connection.util";

abstract class AbstractServerScheduler {


    abstract next(): Server;
    abstract add(server: Server): void;
    abstract remove(server: Server): void;
    abstract forEach(fn: (server: Server) => void): void;

}

abstract class LinearScheduler extends AbstractServerScheduler {
    protected readonly serverGroup: ServerGroup;
    protected index: number;
    protected timeoutHandler?: NodeJS.Timeout;

    protected alive_servers: Server[];

    constructor(serverGroup: ServerGroup) {
        super();
        this.serverGroup = serverGroup;
        this.alive_servers = [];
        this.index = 0;
        this.updateAlive();
        this.timeoutHandler = this.serverGroup.timeout ? setTimeout(() => {
            this.updateAlive();
        },
            Math.max(this.serverGroup.timeout, 60 * 3) * 1000) : undefined;
    }
    protected async updateAlive(): Promise<void> {


        if (this.serverGroup.timeout === undefined) {
            return;
        }

        clearTimeout(this.timeoutHandler);
        this.alive_servers = [];

        for (let i = 0; i < this.serverGroup.servers.length; i++) {

            const server = this.serverGroup.servers[i];

            if (await test_connection(server.server)) {

                this.alive_servers.push(server);

            }
        }
        if (this.alive_servers.length === 0) {

            this.timeoutHandler = setTimeout(() => {
                this.updateAlive()

            }, 10 * 1000)
        } else {

            this.timeoutHandler = this.serverGroup.timeout ? setTimeout(() => {
                this.updateAlive();
            },
                Math.max(this.serverGroup.timeout, 60 * 3) * 1000) : undefined;
        }

    }
    add(server: Server): void {
        this.serverGroup.servers.push(server);
        this.updateAlive();
    }

    remove(server: Server): void {
        const index = this.serverGroup.servers.findIndex((s) => s.id === server.id);
        if (index !== -1) {
            this.serverGroup.servers.splice(index, 1);
        }
        this.updateAlive();
    }

    forEach(fn: (server: Server) => void): void {
        this.alive_servers.forEach(fn);
    }

    abstract next(): Server;

}


class RoundRobinScheduler extends LinearScheduler {


    constructor(serverGroup: ServerGroup) {
        super(serverGroup);


    }



    next(): Server {
        if (this.alive_servers.length === 0) {
            throw new Error("No server available");
        } else {
            this.index = (this.index + 1) % this.alive_servers.length;
            return this.alive_servers[this.index];
        }
    }


}



class WeightedRandomScheduler extends LinearScheduler {

    private totalWeight = 0;


    constructor(serverGroup: ServerGroup) {
        super(serverGroup);
        this.totalWeight = 0;
        this.updateAlive();
    }

    protected async updateAlive(): Promise<void> {
        if (this.serverGroup.timeout === undefined) {
            return;
        }
        clearTimeout(this.timeoutHandler);
        this.alive_servers = [];
        this.totalWeight = 0;
        for (let i = 0; i < this.serverGroup.servers.length; i++) {

            const server = this.serverGroup.servers[i];

            if (await test_connection(server.server)) {

                this.alive_servers.push(server);
                this.totalWeight += server.getWeight();

            }
        }
        if (this.alive_servers.length === 0) {

            this.timeoutHandler = setTimeout(() => {
                this.updateAlive()

            }, 10 * 1000)
        } else {

            this.timeoutHandler = this.serverGroup.timeout ? setTimeout(() => {
                this.updateAlive();
            },
                Math.max(this.serverGroup.timeout, 60 * 3) * 1000) : undefined;
        }

    }

    next(): Server {
        if (this.alive_servers.length === 0) {
            throw new Error("No server available");
        } else {
            const rand = Math.random() * this.totalWeight;
            let sum = 0;
            for (let i = 0; i < this.alive_servers.length; i++) {
                sum += this.alive_servers[i].getWeight();
                if (rand < sum) {
                    return this.alive_servers[i];
                }
            }
            return this.alive_servers[this.alive_servers.length - 1];
        }
    }


}


class ServerHeap {


    private _size: number;

    size() {
        return this._size;
    }


    private heap = Array<Server>();

    constructor(servers: Server[]) {
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

    public add(server: Server): void {
        this._size++;
        this.heap.push(server);
        this.heapify_up(this._size - 1);
    }

    public remove(server: Server): void {
        const index = this.heap.findIndex((s) => s.id === server.id);
        if (index !== -1) {
            this.heap[index] = this.heap[this._size - 1];
            this._size--;
            this.heapify_up(index);
            this.heapfy_down(index);
        }
    }

    public pop(): Server {
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

abstract class MinHeapScheduler extends AbstractServerScheduler {
    protected timeoutHandler?: NodeJS.Timeout;
    protected abstract updateAlive(): Promise<void>;

}

class MinRTTScheduler extends MinHeapScheduler {
    private readonly serverGroup: ServerGroup;
    private heap: ServerHeap;
    protected timeoutHandler?: NodeJS.Timeout;
    constructor(serverGroup: ServerGroup) {
        super();
        this.serverGroup = serverGroup;
        const servers: Server[] = serverGroup.servers;
        this.heap = new ServerHeap(servers);

        this.timeoutHandler = this.serverGroup.timeout ? setTimeout(() => {
            this.updateAlive();
        }, Math.max(this.serverGroup.timeout, 60 * 10) * 1000) : undefined;
    }

    protected async updateAlive(): Promise<void> {
        if (this.serverGroup.timeout === undefined) {
            return;
        }
        clearTimeout(this.timeoutHandler);
        const servers: Server[] = this.serverGroup.servers;
        const alive_servers: Server[] = [];
        for (let i = 0; i < servers.length; i++) {
            const server = servers[i];
            if (await test_connection(server.server)) {
                alive_servers.push(server);
            }
        }


        if (alive_servers.length === 0) {
            this.timeoutHandler = setTimeout(() => {
                this.updateAlive();
            }, 10 * 1000)
        } else {
            this.heap = new ServerHeap(alive_servers);
            this.timeoutHandler = this.serverGroup.timeout ? setTimeout(() => {
                this.updateAlive();
            }, Math.max(this.serverGroup.timeout, 60 * 10) * 1000) : undefined;
            this.heap = new ServerHeap(alive_servers);
        }
    }

    next(): Server {
        return this.heap.pop();
    }
    add(server: Server): void {
        this.heap.add(server);
    }
    remove(server: Server): void {
        this.heap.remove(server);
    }
    forEach(fn: (server: Server) => void): never {
        throw new Error("Method not implemented.");
    }
}



// const servers:Server[] = []
// for (let i = 0; i < 100; i++) {
//     let weight = Math.floor(Math.random() * 1000);
//     servers.push({ server: "http://localhost:8000", getWeight:()=>-weight, id: Symbol() });
// }


// const serverHeap:ServerHeap = new ServerHeap(servers);


// while(serverHeap.size()>0){
//     let server = serverHeap.pop();
//     console.log(server.getWeight());
// }