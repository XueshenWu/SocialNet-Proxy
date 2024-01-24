const main = async () => {
    await fetch("http://localhost:3001", {
        method: "POST",
        body: JSON.stringify({ "key": "value" }),
    })
}

main()