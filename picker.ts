import express, { Express } from "express";
import { config } from "./config";

// Create Express app for serving the color picker web app
const app: Express = express();
const PORT = config.webAppPort || 3000;

// Serve static files (if needed)
app.use(express.json());

// Endpoint to receive color from web app
app.post("/send-color", async (req, res) => {
  try {
    const { color, initData } = req.body;
    console.log(`🎨 Received color via POST: ${color}`);
    console.log(`🎨 InitData: ${initData}`);
    
    // For now, just store it temporarily (we'll handle it better later)
    // Send success response
    res.json({ success: true, color });
  } catch (error) {
    console.error("Error in /send-color:", error);
    res.status(500).json({ success: false, error: String(error) });
  }
});

// Color picker web app page
app.get("/picker", (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Color Picker</title>
    <script src="https://telegram.org/js/telegram-web-app.js"></script>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--tg-theme-bg-color, #ffffff);
            color: var(--tg-theme-text-color, #000000);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 15px;
            overflow: hidden;
        }
        
        .container {
            width: 100%;
            max-width: 500px;
            text-align: center;
        }
        
        h1 {
            font-size: 20px;
            margin-bottom: 20px;
            color: var(--tg-theme-text-color, #000000);
        }
        
        .picker-section {
            background: var(--tg-theme-secondary-bg-color, #f0f0f0);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 15px;
        }
        
        .color-input-wrapper {
            position: relative;
            width: 140px;
            height: 140px;
            margin: 0 auto 15px;
        }
        
        input[type="color"] {
            width: 100%;
            height: 100%;
            border: none;
            border-radius: 50%;
            cursor: pointer;
            -webkit-appearance: none;
            -moz-appearance: none;
            appearance: none;
            background: none;
        }
        
        input[type="color"]::-webkit-color-swatch-wrapper {
            padding: 0;
        }
        
        input[type="color"]::-webkit-color-swatch {
            border: 4px solid var(--tg-theme-button-color, #0088cc);
            border-radius: 50%;
        }
        
        input[type="color"]::-moz-color-swatch {
            border: 4px solid var(--tg-theme-button-color, #0088cc);
            border-radius: 50%;
        }
        
        .color-display {
            font-size: 24px;
            font-weight: bold;
            margin: 15px 0 10px;
            font-family: 'Monaco', 'Courier New', monospace;
            letter-spacing: 1px;
        }
        
        .rgb-display {
            font-size: 14px;
            color: var(--tg-theme-hint-color, #999999);
            margin-bottom: 5px;
        }
        
        .camera-section {
            margin-top: 10px;
        }
        
        .camera-button {
            width: 100%;
            padding: 12px;
            font-size: 15px;
            border: none;
            border-radius: 10px;
            background: var(--tg-theme-button-color, #0088cc);
            color: var(--tg-theme-button-text-color, #ffffff);
            cursor: pointer;
            margin-top: 8px;
            font-weight: 600;
        }
        
        .camera-button:active {
            opacity: 0.8;
        }
        
        #video-container {
            display: none;
            position: relative;
            margin: 15px auto;
            border-radius: 12px;
            overflow: hidden;
            max-width: 320px;
            max-height: 240px;
        }
        
        #video-container.active {
            display: block;
        }
        
        video {
            width: 100%;
            height: 240px;
            max-width: 320px;
            border-radius: 12px;
            object-fit: cover;
        }
        
        .crosshair {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            border: 4px solid #00ff00;
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(0,255,0,0.8), inset 0 0 15px rgba(0,255,0,0.3);
            pointer-events: none;
            animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
            0%, 100% { opacity: 1; transform: translate(-50%, -50%) scale(1); }
            50% { opacity: 0.7; transform: translate(-50%, -50%) scale(1.1); }
        }
        
        .crosshair::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 10px;
            height: 10px;
            background: #00ff00;
            border-radius: 50%;
            box-shadow: 0 0 10px rgba(0,255,0,1);
        }
        
        .camera-hint {
            text-align: center;
            margin-top: 10px;
            font-size: 14px;
            color: var(--tg-theme-hint-color, #999999);
            font-weight: 600;
        }
        
        canvas {
            display: none;
        }
        
        .instructions {
            font-size: 13px;
            color: var(--tg-theme-hint-color, #999999);
            margin-top: 15px;
            line-height: 1.4;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎨 Выберите цвет</h1>
        
        <div class="picker-section">
            <div class="color-input-wrapper">
                <input type="color" id="colorPicker" value="#3498db">
            </div>
            <div class="color-display" id="colorDisplay">#3498db</div>
            <div class="rgb-display" id="rgbDisplay">RGB: 52, 152, 219</div>
        </div>
        
        <div class="camera-section">
            <button class="camera-button" id="cameraBtn">📷 Захват цвета с камеры</button>
            <button class="camera-button" id="captureBtn" style="display: none;">✓ Capture Color</button>
            <button class="camera-button" id="closeCameraBtn" style="display: none; background: #e74c3c;">✕ Close Camera</button>
        </div>
        
        <div id="video-container">
            <video id="video" autoplay playsinline></video>
            <div class="crosshair"></div>
        </div>
        <div class="camera-hint" id="cameraHint" style="display: none;">
            Point the green circle at the color you want to pick
        </div>
        
        <canvas id="canvas"></canvas>
        
        <div class="instructions">
            <p>Выберите цвет из палитры выше или используйте камеру!</p>
        </div>
    </div>

    <script>
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();
        
        const colorPicker = document.getElementById('colorPicker');
        const colorDisplay = document.getElementById('colorDisplay');
        const rgbDisplay = document.getElementById('rgbDisplay');
        const cameraBtn = document.getElementById('cameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        const closeCameraBtn = document.getElementById('closeCameraBtn');
        const videoContainer = document.getElementById('video-container');
        const cameraHint = document.getElementById('cameraHint');
        const video = document.getElementById('video');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        const instructions = document.querySelector('.instructions');
        
        let stream = null;
        
        // Update displays when color changes
        function updateColor(hex) {
            colorPicker.value = hex;
            colorDisplay.textContent = hex.toUpperCase();
            
            // Convert to RGB
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            rgbDisplay.textContent = \`RGB: \${r}, \${g}, \${b}\`;
            
            // Update Telegram MainButton (optional visual element at bottom)
            tg.MainButton.setText('Использовать цвет ' + hex.toUpperCase());
            tg.MainButton.color = hex;
            tg.MainButton.enable();
            tg.MainButton.show();
        }
        
        // Color picker change event
        colorPicker.addEventListener('input', (e) => {
            updateColor(e.target.value);
        });
        
        // Initialize
        updateColor('#3498db');
        
        // Camera functionality
        async function startCamera() {
            try {
                stream = await navigator.mediaDevices.getUserMedia({ 
                    video: { 
                        facingMode: 'environment',
                        width: { ideal: 640 },
                        height: { ideal: 480 }
                    } 
                });
                video.srcObject = stream;
                videoContainer.classList.add('active');
                cameraHint.style.display = 'block';
                instructions.style.display = 'none';
                cameraBtn.style.display = 'none';
                captureBtn.style.display = 'block';
                closeCameraBtn.style.display = 'block';
            } catch (error) {
                alert('Camera access denied or not available: ' + error.message);
            }
        }
        
        function stopCamera() {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
                stream = null;
            }
            videoContainer.classList.remove('active');
            cameraHint.style.display = 'none';
            instructions.style.display = 'block';
            cameraBtn.style.display = 'block';
            captureBtn.style.display = 'none';
            closeCameraBtn.style.display = 'none';
        }
        
        function captureColor() {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            // Get color from center pixel
            const x = Math.floor(canvas.width / 2);
            const y = Math.floor(canvas.height / 2);
            const imgData = ctx.getImageData(x, y, 1, 1).data;
            
            const r = imgData[0];
            const g = imgData[1];
            const b = imgData[2];
            
            const hex = '#' + 
                r.toString(16).padStart(2, '0') + 
                g.toString(16).padStart(2, '0') + 
                b.toString(16).padStart(2, '0');
            
            updateColor(hex);
            stopCamera();
            
            // Haptic feedback
            tg.HapticFeedback.impactOccurred('medium');
        }
        
        // Function to send color data back to bot
        function sendColorToBot() {
            const hex = colorPicker.value;
            
            try {
                // Send color data to bot
                tg.sendData(hex);
                
                // Close after a small delay to ensure data is sent
                setTimeout(() => {
                    tg.close();
                }, 300);
            } catch (error) {
                console.error('Error sending data:', error);
                alert('Error sending color. Please try again.');
            }
        }
        
        cameraBtn.addEventListener('click', startCamera);
        captureBtn.addEventListener('click', captureColor);
        closeCameraBtn.addEventListener('click', stopCamera);
        
        // Also handle MainButton clicks (Telegram's native button at bottom)
        tg.MainButton.onClick(function() {
            sendColorToBot();
        });
        
        // Handle back button
        tg.BackButton.show();
        tg.BackButton.onClick(() => {
            stopCamera();
            tg.close();
        });
    </script>
</body>
</html>
  `);
});

// Start the web server
export function startWebApp() {
  return new Promise<void>((resolve) => {
    app.listen(PORT, () => {
      console.log(`🌐 Web app server running on port ${PORT}`);
      console.log(`📱 Color picker URL: http://localhost:${PORT}/picker`);
      resolve();
    });
  });
}

// Export the app instance
export { app };

