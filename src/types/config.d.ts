
type ProxyConfig = Array<{

    service: string;

    serverGroup: Array<{
        server: string;
        weight: number;
    }>;

    timeout?: number;

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

export type {Config, ProxyConfig, TokenConfig, FileConfig};