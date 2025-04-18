async function captiveCheck() {
    try {
        console.log("Checking")
        const searchParams = new URLSearchParams(window.location.search);
        const url = searchParams.get("from");
        if (url && url.trim() != "") {
            window.location.href = url;
        } else {
            window.location.reload();
        }
    } catch (_) {}
}

export default captiveCheck;
