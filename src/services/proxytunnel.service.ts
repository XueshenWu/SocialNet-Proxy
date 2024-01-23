import { Request, Response } from "express";
import { Readable } from "stream";

export default async function relay(req: Request, resp: Response, target: string, method: "GET" | "POST" | "PUT" | "DELETE") {
    let target_response: globalThis.Response;


    let headers:any = {};
    Object.entries(req.headers).forEach(([key, value]) => {
        if (value !== undefined) {
            headers[key] = Array.isArray(value) ? value.join(', ') : value;
        }
    });
    

    target_response = await fetch(target, {
        method: method,
        headers:headers,
        body: method === "GET" ? undefined : req.body
    });
    const status = target_response.status;

    resp.status(status);
    resp.setHeader('Content-Type', target_response.headers.get('content-type') as string);
    if (status >= 200 && status < 300) {

        const binary = await target_response.arrayBuffer();
        // resp.write(Buffer.from(binary));
        const stream = new Readable()
        stream.push(Buffer.from(binary))
        stream.push(null)
        stream.pipe(resp)
        return;

    }

    resp.end();

}