
type ScheduleStrategy = "SINGLETON" | "ROUND_ROBIN" | "MIN_AVG_RTT" | "WEIGHTED_RANDOM" |"MIN_ACC_RTT";

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
        location: string;
    },
    refresh: {
        SECRET: string;
        expire_seconds: number;
        
    },
    signup:{
        location: string;
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

export type { Config, ProxyConfig, TokenConfig, FileConfig, ScheduleStrategy, Server };