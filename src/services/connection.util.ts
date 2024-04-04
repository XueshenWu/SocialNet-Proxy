export async function test_connection(url:string):Promise<boolean>{
    try{
        let response = await fetch(url, {
            method: "GET"
        
        });
      
        return 200 <= response.status && response.status < 300;
    }catch(e){
        return false;
    }
}