const src = process.argv[2] || 'https://<release-domain>/ims-v0.1.0.js'
const relay = process.argv[3] || ''

const snippet = `(()=>{const SRC=${JSON.stringify(src)};const RELAY=${JSON.stringify(relay)};const frame=document.getElementById('mainFrame');const hostWin=frame?.contentWindow||window;const hostDoc=hostWin.document;if(RELAY)hostWin.__IMS_V010_BING_RELAY__=RELAY;if(hostWin.__IMS_V010_LOADING__||hostWin.__IMS_V010__)return;hostWin.__IMS_V010_LOADING__=true;const old=hostDoc.querySelector('script[data-ims-version="v0.1.0"]');if(old)old.remove();const script=hostDoc.createElement('script');script.src=\`\${SRC}?t=\${Date.now()}\`;script.dataset.imsVersion='v0.1.0';script.onload=()=>{hostWin.__IMS_V010_LOADING__=false};script.onerror=()=>{hostWin.__IMS_V010_LOADING__=false};hostDoc.head.appendChild(script)})();`

console.log(snippet)
