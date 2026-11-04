import {defineConfig} from 'vite'
import react from '@vitejs/plugin-react'
import ssl from '@vitejs/plugin-basic-ssl'
// HTTPS + host:true so a phone on the same Wi-Fi can open https://<PC-IP>:5173 and use the camera
export default defineConfig({plugins:[react(),ssl()],server:{host:true,port:5173,proxy:{'/api':'http://localhost:8000','/uploads':'http://localhost:8000'}}})
