const puppeteer = require('puppeteer');
const { PuppeteerScreenRecorder } = require('puppeteer-screen-recorder');
const path = require('path');

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });

    const htmlFile = `file:///${path.resolve('./video_flyer_v2.html').replace(/\\/g, '/')}`;
    console.log("Opening " + htmlFile);
    await page.goto(htmlFile, { waitUntil: 'networkidle0' });

    const recorder = new PuppeteerScreenRecorder(page, {
        fps: 30,
        quality: 100,
        videoFrame: {
            width: 1920,
            height: 1080
        },
        aspectRatio: '16:9'
    });

    const savePath = './skoola_demo.mp4';
    console.log("Starting recording to " + savePath);
    await recorder.start(savePath);

    // Wait 14 seconds for the whole animation to complete (13s + 1s buffer)
    await new Promise(r => setTimeout(r, 14000));

    console.log("Stopping recording...");
    await recorder.stop();
    await browser.close();
    
    console.log("Video saved successfully to " + path.resolve(savePath));
})();
