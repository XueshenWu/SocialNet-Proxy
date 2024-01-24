import { Request, Response } from "express";
import { Readable } from "stream";

export async function relay_stream(req: Request, resp: Response, target: string, method: "GET" | "POST" | "PUT" | "DELETE") {

    try {
        let target_response: globalThis.Response;


        let headers: any = {};
        Object.entries(req.headers).forEach(([key, value]) => {
            if (value !== undefined) {
                headers[key] = Array.isArray(value) ? value.join(', ') : value;
            }
        });



        target_response = await fetch(target, {
            method: method,
            headers: headers,
            body: method === "GET" ? undefined : req.body
        });






        const status = target_response.status;

        resp.status(status);
        resp.setHeader('Content-Type', target_response.headers.get('content-type') as string);
        if (status >= 200 && status < 300) {

            const binary = await target_response.arrayBuffer();

            const stream = new Readable()
            stream.push(Buffer.from(binary))
            stream.push(null)
            stream.pipe(resp)
            return;

        }

        resp.end();
    } catch (e) {
        resp.status(502).end();
    }


}


export async function relay_json(req: Request, resp: Response, target: string, method: "GET" | "POST" | "PUT" | "DELETE") {

    try {
        let target_response: globalThis.Response;
        target_response = await fetch(target, {
            method: method,
            body: method === "GET" ? undefined : JSON.stringify(req.body),

        });


        const status = target_response.status;



        if (status >= 200 && status < 300) {
            try {
                const json = await target_response.json();
                resp.json(json);
            } catch (e) {

                const res = await target_response.text();

                resp.status(status).end(res);
            }



        } else {
            resp.status(status).end();
        }
    } catch (e) {
        resp.status(502).end();
    }
}