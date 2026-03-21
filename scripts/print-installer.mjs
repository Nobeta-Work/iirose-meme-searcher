const src = process.argv[2] || 'https://<release-domain>/ims.js'
const searchApiUrl = process.argv[3] || ''
const corsProxyUrl = process.argv[4] || ''

const snippet = `(()=>{const SRC=${JSON.stringify(src)};const SEARCH_API_URL=${JSON.stringify(searchApiUrl)};const CORS_PROXY_URL=${JSON.stringify(corsProxyUrl)};const frame=document.getElementById('mainFrame');const hostWin=frame?.contentWindow||window;const hostDoc=hostWin.document;if(SEARCH_API_URL){hostWin.__IMS_V010_SEARCH_API_URL__=SEARCH_API_URL;hostWin.__IMS_V010_BING_RELAY__=SEARCH_API_URL;}if(CORS_PROXY_URL){hostWin.__IMS_V010_CORS_PROXY__=CORS_PROXY_URL;}if(hostWin.__IMS_V010_LOADING__||hostWin.__IMS_V010__)return;hostWin.__IMS_V010_LOADING__=true;const old=hostDoc.querySelector('script[data-ims-version="v0.1.0"]');if(old)old.remove();const script=hostDoc.createElement('script');script.src=\`\${SRC}?t=\${Date.now()}\`;script.dataset.imsVersion='v0.1.0';script.onload=()=>{hostWin.__IMS_V010_LOADING__=false};script.onerror=()=>{hostWin.__IMS_V010_LOADING__=false};hostDoc.head.appendChild(script)})();`

console.log(snippet)
