
type ScheduleStrategy = "SINGLETON" | "ROUND_ROBIN" | "MIN_AVG_RTT" | "WEIGHTED_RANDOM"

type Server = {

    location: string;
    weight: number;

}


type ProxyConfig = Array<{

    service: string;

    serviceProvider: Server[]

    timeout?: number;

    scheduleStrategy: ScheduleStrategy;
    

}>

type TokenConfig = {
    auth: {
        SECRET: string;
        expire_seconds: number;
    },
    refresh: {
        SECRET: string;
        expire_seconds: number;
    }
}

type FileConfig = {
    path: string;
}



type Config = {
    proxy_c: ProxyConfig;
    token_c: TokenConfig;
    file_c: FileConfig;
}

export type { Config, ProxyConfig, TokenConfig, FileConfig , ScheduleStrategy, Server};