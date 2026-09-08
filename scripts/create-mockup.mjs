import sharp from 'sharp';
import path from 'path';

async function createMockup() {
  const W = 1600;
  const H = 900;

  // Background SVG with gradient and subtle glow
  const bgSvg = Buffer.from(`
    <svg width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
          <stop offset="0%" stop-color="#192030" stop-opacity="1"/>
          <stop offset="50%" stop-color="#0e1420" stop-opacity="1"/>
          <stop offset="100%" stop-color="#06090f" stop-opacity="1"/>
        </radialGradient>
        <radialGradient id="centerHighlight" cx="50%" cy="42%" r="42%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.18"/>
          <stop offset="60%" stop-color="#0284c7" stop-opacity="0.04"/>
          <stop offset="100%" stop-color="#0f172a" stop-opacity="0"/>
        </radialGradient>
        <radialGradient id="shadowLeft" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stop-color="#000000" stop-opacity="0.6"/>
          <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
        </radialGradient>
        <linearGradient id="pedestal" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#38bdf8" stop-opacity="0"/>
          <stop offset="50%" stop-color="#38bdf8" stop-opacity="0.3"/>
          <stop offset="100%" stop-color="#38bdf8" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#bgGlow)"/>
      <ellipse cx="${W/2}" cy="380" rx="550" ry="360" fill="url(#centerHighlight)"/>
      <!-- Soft phone floor shadows -->
      <ellipse cx="${W/2 - 290}" cy="840" rx="160" ry="18" fill="url(#shadowLeft)"/>
      <ellipse cx="${W/2 + 290}" cy="840" rx="160" ry="18" fill="url(#shadowLeft)"/>
      <ellipse cx="${W/2}" cy="845" rx="190" ry="22" fill="url(#shadowLeft)"/>
      <!-- subtle platform light line below phones -->
      <ellipse cx="${W/2}" cy="840" rx="430" ry="12" fill="url(#pedestal)"/>
    </svg>
  `);

  async function makePhone(srcPath, screenW, screenH, bezelRadius, isCenter = false) {
    const bezelPad = 10;
    const phoneW = screenW + bezelPad * 2;
    const phoneH = screenH + bezelPad * 2;
    const screenRadius = bezelRadius - 6;

    // 1. Resize screenshot
    const screenImg = await sharp(srcPath)
      .resize(screenW, screenH, { fit: 'cover' })
      .toBuffer();

    // 2. Mask screenshot with rounded corners
    const screenMask = Buffer.from(`
      <svg width="${screenW}" height="${screenH}">
        <rect width="${screenW}" height="${screenH}" rx="${screenRadius}" ry="${screenRadius}" fill="white"/>
      </svg>
    `);
    const roundedScreen = await sharp(screenImg)
      .composite([{ input: screenMask, blend: 'dest-in' }])
      .png()
      .toBuffer();

    // 3. Create Bezel SVG with subtle metallic border, dynamic island notch
    const notchW = Math.round(screenW * 0.26);
    const notchH = Math.round(screenW * 0.065);
    const notchX = Math.round((phoneW - notchW) / 2);
    const notchY = bezelPad + 6;

    const strokeColor = isCenter ? "#38bdf8" : "#475569";
    const strokeOpacity = isCenter ? "0.6" : "0.35";

    const frameSvg = Buffer.from(`
      <svg width="${phoneW}" height="${phoneH}" viewBox="0 0 ${phoneW} ${phoneH}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bezelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#334155"/>
            <stop offset="40%" stop-color="#1e293b"/>
            <stop offset="100%" stop-color="#0f172a"/>
          </linearGradient>
        </defs>
        <!-- Outer phone body with metallic rim -->
        <rect x="1" y="1" width="${phoneW - 2}" height="${phoneH - 2}" rx="${bezelRadius}" ry="${bezelRadius}" fill="url(#bezelGrad)" stroke="${strokeColor}" stroke-width="2" stroke-opacity="${strokeOpacity}"/>
        <!-- Screen bezel border -->
        <rect x="${bezelPad - 1}" y="${bezelPad - 1}" width="${screenW + 2}" height="${screenH + 2}" rx="${screenRadius + 1}" ry="${screenRadius + 1}" fill="#000"/>
      </svg>
    `);

    const notchSvg = Buffer.from(`
      <svg width="${notchW}" height="${notchH}">
        <rect width="${notchW}" height="${notchH}" rx="${notchH/2}" ry="${notchH/2}" fill="#000"/>
        <circle cx="${notchW - notchH/2}" cy="${notchH/2}" r="${notchH*0.26}" fill="#0f172a"/>
      </svg>
    `);

    // Combine frame + screen + notch
    const phone = await sharp(frameSvg)
      .composite([
        { input: roundedScreen, left: bezelPad, top: bezelPad },
        { input: notchSvg, left: notchX, top: notchY }
      ])
      .png()
      .toBuffer();

    return { buffer: phone, width: phoneW, height: phoneH };
  }

  // Side phones: 315 x 700
  const leftPhone = await makePhone('src/assets/fialo-2.jpg', 315, 700, 36, false);
  const rightPhone = await makePhone('src/assets/fialo-3.jpg', 315, 700, 36, false);
  // Center phone: 360 x 800
  const centerPhone = await makePhone('src/assets/fialo-1.jpg', 360, 800, 42, true);

  // Positions
  const centerY = Math.round((H - centerPhone.height) / 2) + 6;
  const centerX = Math.round((W - centerPhone.width) / 2);

  const leftX = centerX - 285;
  const leftY = centerY + 48;

  const rightX = centerX + 285;
  const rightY = centerY + 48;

  // Render composite
  await sharp(bgSvg)
    .composite([
      { input: leftPhone.buffer, left: leftX, top: leftY },
      { input: rightPhone.buffer, left: rightX, top: rightY },
      { input: centerPhone.buffer, left: centerX, top: centerY }
    ])
    .png({ quality: 95 })
    .toFile('src/assets/fialo-1.png');

  console.log('Mockup created successfully at src/assets/fialo-1.png');
}

createMockup().catch(console.error);
