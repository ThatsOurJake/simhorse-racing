// Photo Finish Templates
export const photoFinishThumbnailStyles = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  width: 200px;
  height: 120px;
  background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
  border: 3px solid #fff;
  cursor: pointer;
  display: none;
  overflow: hidden;
  z-index: 1000;
  transition: transform 0.2s ease;
`;

export const photoFinishThumbnailHTML = `
  <div style="
    position: absolute;
    top: 8px;
    left: 8px;
    right: 8px;
    bottom: 8px;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  ">
    <img id="photo-finish-img" style="
      width: 100%;
      height: 100%;
      object-fit: cover;
    " />
  </div>
  <div style="
    position: absolute;
    bottom: 12px;
    left: 0;
    right: 0;
    text-align: center;
    color: #fff;
    font-family: 'Georgia', serif;
    font-size: 10px;
    font-style: italic;
    text-shadow: 1px 1px 3px rgba(0,0,0,0.8);
    background: linear-gradient(transparent, rgba(0,0,0,0.5));
    padding: 8px 4px 4px;
  ">
    PHOTO FINISH
  </div>
`;

export const photoFinishModalStyles = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.9);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  cursor: pointer;
`;

export const photoFinishModalHTML = `
  <div style="
    position: relative;
    max-width: 90%;
    max-height: 90%;
    background: linear-gradient(145deg, #2c2c2c, #1a1a1a);
    padding: 20px;
    border: 4px solid #fff;
  ">
    <img id="photo-finish-modal-img" style="
      display: block;
      max-width: calc(90vw - 80px);
      max-height: calc(90vh - 120px);
      object-fit: contain;
    " />
    <div style="
      text-align: center;
      color: #fff;
      font-family: 'Georgia', serif;
      font-size: 16px;
      font-style: italic;
      margin-top: 12px;
      text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    ">
      PHOTO FINISH
    </div>
    <div style="
      text-align: center;
      color: #aaa;
      font-size: 11px;
      margin-top: 8px;
    ">
      Right-click to save • ESC or click outside to close
    </div>
  </div>
`;

// Leaderboard Templates
export const leaderboardOverlayStyles = `
  position: fixed;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.85);
  color: white;
  padding: 15px 20px;
  font-family: monospace;
  font-size: 14px;
  border-radius: 8px;
  border: 2px solid #4ecdc4;
  z-index: 999;
  min-width: 200px;
  display: none;
`;

export function renderLeaderboardContent(
  raceTime: number,
  leaders: Array<{ position: number; name: string }>,
): string {
  const minutes = Math.floor(raceTime / 60);
  const seconds = Math.floor(raceTime % 60);
  const milliseconds = Math.floor((raceTime % 1) * 1000);
  const timeStr = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;

  let entriesHtml = "";
  if (leaders.length === 0) {
    entriesHtml = '<div style="color: #888;">Waiting for race...</div>';
  } else {
    const positionColors = ["#FFD700", "#C0C0C0", "#CD7F32"]; // Gold, Silver, Bronze
    const medals = ["🥇", "🥈", "🥉"];

    leaders.forEach((entry, index) => {
      const isTopThree = index < 3;
      const color = isTopThree ? positionColors[index] : "#aaa";
      const medal = isTopThree ? `${medals[index]} ` : "";
      const fontWeight = isTopThree ? "bold" : "normal";
      const fontSize = isTopThree ? "14px" : "13px";

      entriesHtml += `
        <div style="color: ${color}; font-weight: ${fontWeight}; font-size: ${fontSize};">
          ${medal}${entry.position}. ${entry.name}
        </div>
      `;
    });
  }

  return `
    <div style="font-weight: bold; color: #4ecdc4; margin-bottom: 10px; font-size: 16px;">
      RACE TIME: ${timeStr}
    </div>
    <div id="leaderboard-entries" style="line-height: 1.8;">
      ${entriesHtml}
    </div>
  `;
}

// Riders Overlay Templates
export const ridersOverlayStyles = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.85);
  display: none;
  align-items: center;
  justify-content: center;
  z-index: 1500;
`;

export interface RiderData {
  name: string;
  color: number;
  speed: number;
  stamina: number;
  acceleration: number;
  winProbability: number;
  previewImage?: string;
}

export function renderRidersContent(riders: RiderData[]): string {
  const ridersHTML = riders
    .map((rider) => {
      const colorHex = `#${rider.color.toString(16).padStart(6, "0")}`;
      const previewHTML = rider.previewImage
        ? `<img src="${rider.previewImage}" style="width: 100%; height: 120px; object-fit: contain; background: #000; border-radius: 4px; margin-bottom: 10px;" />`
        : `<div style="width: 100%; height: 120px; background: #000; border-radius: 4px; margin-bottom: 10px; display: flex; align-items: center; justify-content: center; color: #666;">No Preview</div>`;

      return `
        <div style="
          background: rgba(255, 255, 255, 0.05);
          padding: 15px;
          border: 2px solid ${colorHex};
          border-radius: 8px;
        ">
          ${previewHTML}
          <h3 style="margin: 0 0 8px 0; font-size: 18px; text-align: center;">${rider.name}</h3>
          <div style="
            background: ${colorHex};
            color: black;
            padding: 6px;
            border-radius: 4px;
            font-weight: bold;
            font-size: 16px;
            text-align: center;
            margin-bottom: 10px;
          ">
            ${(rider.winProbability * 100).toFixed(1)}% Win Chance
          </div>
          <div style="display: flex; justify-content: space-between; gap: 8px; font-size: 11px;">
            <div style="flex: 1; text-align: center;">
              <div style="color: #aaa; margin-bottom: 3px;">SPD</div>
              <div style="font-weight: bold;">${(rider.speed * 100).toFixed(0)}%</div>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="color: #aaa; margin-bottom: 3px;">STA</div>
              <div style="font-weight: bold;">${(rider.stamina * 100).toFixed(0)}%</div>
            </div>
            <div style="flex: 1; text-align: center;">
              <div style="color: #aaa; margin-bottom: 3px;">ACC</div>
              <div style="font-weight: bold;">${(rider.acceleration * 100).toFixed(0)}%</div>
            </div>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    <div style="
      background: rgba(0, 0, 0, 0.95);
      color: white;
      padding: 30px;
      border-radius: 12px;
      max-width: 90vw;
      max-height: 90vh;
      overflow-y: auto;
      box-sizing: border-box;
    ">
      <h1 style="text-align: center; margin: 0 0 25px 0; font-size: 32px; color: #4ecdc4;">
        RIDERS ROSTER
      </h1>
      <div style="
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 15px;
        margin-bottom: 20px;
      ">
        ${ridersHTML}
      </div>
      <div style="text-align: center; color: #aaa; font-size: 12px; padding: 10px 0; border-top: 1px solid #333;">
        <span style="color: #4ecdc4;">SPD</span> = Speed &nbsp;|&nbsp; <span style="color: #4ecdc4;">STA</span> = Stamina &nbsp;|&nbsp; <span style="color: #4ecdc4;">ACC</span> = Acceleration
      </div>
      <div style="text-align: center; color: #888; font-size: 14px; padding-top: 10px;">
        Press <span style="color: #4ecdc4; font-weight: bold;">A</span> to close and return to track
      </div>
    </div>
  `;
}

// Debug Overlay Templates
export const debugOverlayStyles = `
  position: fixed;
  bottom: 20px;
  left: 20px;
  background: rgba(0, 0, 0, 0.85);
  color: #00ff00;
  padding: 15px;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  border: 2px solid #00ff00;
  border-radius: 8px;
  z-index: 1000;
  display: none;
  max-width: 400px;
`;

export function renderDebugContent(currentTheme: string = "christmas"): string {
  const themeName = currentTheme === "normal" ? "Normal" : "Christmas";
  return `
    <div style="font-weight: bold; margin-bottom: 10px; color: #00ff00; font-size: 14px;">
      ⌨️ KEYBOARD CONTROLS
    </div>
    <div style="line-height: 1.8;">
      <div><span style="color: #ffff00;">P:</span> Start Race</div>
      <div><span style="color: #ffff00;">R:</span> Reset Race</div>
      <div><span style="color: #ffff00;">E:</span> Toggle Horse Editor</div>
      <div><span style="color: #ffff00;">L:</span> Toggle Leaderboard</div>
      <div><span style="color: #ffff00;">T:</span> Trigger Crowd Wave</div>
      <div><span style="color: #ffff00;">D:</span> Toggle Debug Info</div>
      <div><span style="color: #ffff00;">Q:</span> Show Riders Roster</div>
      <div><span style="color: #ffff00;">W:</span> Show Podium</div>
      <div><span style="color: #ffff00;">A:</span> Return to Main</div>
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #00ff00;">
        <div><span style="color: #ffff00;">0:</span> Orbital Camera</div>
        <div><span style="color: #ffff00;">9:</span> Follow Camera</div>
        <div><span style="color: #ffff00;">-:</span> Finish Line Camera</div>
        <div><span style="color: #ffff00;">F:</span> Free Fly Camera [WASD + Space/Shift + Double-tap W Sprint]</div>
        <div><span style="color: #ffff00;">1-8:</span> Individual Horse Cameras</div>
      </div>
      <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #00ff00;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: #ffff00;">Theme:</span>
          <button id="themeToggle" style="
            background: #00ff00;
            color: #000;
            border: none;
            padding: 5px 12px;
            cursor: pointer;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            border-radius: 4px;
          ">${themeName}</button>
        </div>
      </div>
    </div>
  `;
}
