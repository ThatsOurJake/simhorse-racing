export const containerStyles = `
  position: fixed;
  top: 0;
  right: 0;
  width: 400px;
  height: 100vh;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 20px;
  box-sizing: border-box;
  overflow-y: auto;
  font-family: monospace;
  z-index: 1000;
  transition: transform 0.3s ease;
`;

export interface MainTemplateData {
  raceSeed: number;
  horseListHTML: string;
  horsesCount: number;
  editingHorseId: string | null;
  editorFormHTML: string;
}

export function renderMainTemplate(data: MainTemplateData): string {
  return `
    <h2 style="margin-top: 0;">Horse Editor</h2>
    
    <div style="margin-bottom: 20px;">
      <label style="display: block; margin-bottom: 5px;">Race Seed:</label>
      <input 
        type="number" 
        id="raceSeed" 
        value="${data.raceSeed}"
        style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555;"
      />
      <button 
        id="randomizeSeed"
        style="margin-top: 5px; padding: 5px 10px; background: #444; color: white; border: 1px solid #666; cursor: pointer; width: 100%;"
      >
        Randomize Seed
      </button>
    </div>

    <div id="horseList" style="margin-bottom: 20px;">
      ${data.horseListHTML}
    </div>

    <button 
      id="addHorse"
      ${data.horsesCount >= 8 ? "disabled" : ""}
      style="padding: 10px; background: #0a6; color: white; border: none; cursor: pointer; width: 100%; margin-bottom: 10px; ${data.horsesCount >= 8 ? "opacity: 0.5; cursor: not-allowed;" : ""}"
    >
      Add Horse (${data.horsesCount}/8)
    </button>

    <button 
      id="randomizeRace"
      style="padding: 10px; background: #a06; color: white; border: none; cursor: pointer; width: 100%; margin-bottom: 10px;"
    >
      🎲 Randomize Full Race (8 Horses)
    </button>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
      <button 
        id="exportRace"
        style="padding: 10px; background: #06a; color: white; border: none; cursor: pointer;"
      >
        📥 Export Race
      </button>
      <button 
        id="importRace"
        style="padding: 10px; background: #660; color: white; border: none; cursor: pointer;"
      >
        📤 Import Race
      </button>
    </div>
    <input type="file" id="importFileInput" accept=".json" style="display: none;" />

    <div id="editorForm" style="display: ${data.editingHorseId ? "block" : "none"}; border-top: 2px solid #555; padding-top: 20px; margin-top: 20px;">
      ${data.editorFormHTML}
    </div>

    <div id="speedGraphContainer" style="margin-top: 20px; display: ${data.editingHorseId ? "block" : "none"};">
      <h3 style="margin-bottom: 10px;">Speed Graph</h3>
      <canvas id="speedGraphCanvas" width="360" height="200" style="background: #222; border: 1px solid #555;"></canvas>
      <div id="raceTimeInfo" style="margin-top: 10px; color: #aaa; font-size: 12px;"></div>
    </div>
  `;
}

export interface HorseItemData {
  id: string;
  name: string;
  color: number;
  speed: number;
  stamina: number;
  acceleration: number;
  baseSpeed: number;
  raceTime: number;
}

export function renderHorseItem(horse: HorseItemData): string {
  return `
    <div 
      style="background: #222; padding: 10px; margin-bottom: 10px; border-left: 4px solid #${horse.color.toString(16).padStart(6, "0")}; cursor: pointer;"
      data-horse-id="${horse.id}"
      class="horse-item"
    >
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span><strong>${horse.name}</strong></span>
        <button 
          class="deleteHorse" 
          data-horse-id="${horse.id}"
          style="background: #c33; color: white; border: none; padding: 5px 10px; cursor: pointer;"
        >Delete</button>
      </div>
      <div style="font-size: 11px; color: #aaa; margin-top: 5px;">
        Speed: ${horse.speed.toFixed(2)} | Stamina: ${horse.stamina.toFixed(2)} | Accel: ${horse.acceleration.toFixed(2)}
      </div>
      <div style="font-size: 11px; color: #888;">
        Base Speed: ${horse.baseSpeed.toFixed(2)} u/s | Est. Time: ${horse.raceTime.toFixed(2)}s
      </div>
    </div>
  `;
}

export function renderEmptyHorseList(): string {
  return '<p style="color: #888;">No horses added yet. Click "Add Horse" to start.</p>';
}

export interface EditorFormData {
  horseName: string;
  speed: number;
  stamina: number;
  acceleration: number;
  hat: string;
  face: string;
}

export function renderEditorForm(data: EditorFormData): string {
  return `
    <h3 style="margin-top: 0;">Editing: ${data.horseName}</h3>
    
    <label style="display: block; margin-bottom: 5px;">Name:</label>
    <input 
      type="text" 
      id="horseName" 
      value="${data.horseName}"
      style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
    />

    <label style="display: block; margin-bottom: 5px;">Hat:</label>
    <select 
      id="horseHat"
      style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
    >
      <option value="horse-ears" ${data.hat === "horse-ears" ? "selected" : ""}>🐴 Horse Ears</option>
      <option value="reindeer-antlers" ${data.hat === "reindeer-antlers" ? "selected" : ""}>🦌 Reindeer Antlers</option>
      <option value="top-hat" ${data.hat === "top-hat" ? "selected" : ""}>🎩 Top Hat</option>
      <option value="crown" ${data.hat === "crown" ? "selected" : ""}>👑 Crown</option>
      <option value="propeller-hat" ${data.hat === "propeller-hat" ? "selected" : ""}>🚁 Propeller Hat</option>
    </select>

    <label style="display: block; margin-bottom: 5px;">Face:</label>
    <select 
      id="horseFace"
      style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
    >
      <option value="happy" ${data.face === "happy" ? "selected" : ""}>😊 Happy Face</option>
      <option value="innocent" ${data.face === "innocent" ? "selected" : ""}>👀 Innocent Eyes</option>
      <option value="red-nose" ${data.face === "red-nose" ? "selected" : ""}>🔴 Red Nose</option>
      <option value="angry" ${data.face === "angry" ? "selected" : ""}>😠 Angry Face</option>
      <option value="shocked" ${data.face === "shocked" ? "selected" : ""}>😲 Shocked Face</option>
      <option value="glasses" ${data.face === "glasses" ? "selected" : ""}>👓 Glasses</option>
    </select>

    <label style="display: block; margin-bottom: 5px;">Speed (0-1):</label>
    <input 
      type="number" 
      id="horseSpeed" 
      value="${data.speed}"
      min="0"
      max="1"
      step="0.01"
      style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
    />

    <label style="display: block; margin-bottom: 5px;">Stamina (0-1):</label>
    <input 
      type="number" 
      id="horseStamina" 
      value="${data.stamina}"
      min="0"
      max="1"
      step="0.01"
      style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
    />

    <label style="display: block; margin-bottom: 5px;">Acceleration (0-1):</label>
    <input 
      type="number" 
      id="horseAcceleration" 
      value="${data.acceleration}"
      min="0"
      max="1"
      step="0.01"
      style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
    />

    <div style="display: flex; gap: 10px; margin-bottom: 15px;">
      <button 
        id="randomizeName"
        style="flex: 1; padding: 8px; background: #444; color: white; border: 1px solid #666; cursor: pointer;"
      >
        🎲 Random Name
      </button>
      <button 
        id="randomizeStats"
        style="flex: 1; padding: 8px; background: #444; color: white; border: 1px solid #666; cursor: pointer;"
      >
        🎲 Random Stats
      </button>
    </div>

    <div style="display: flex; gap: 10px;">
      <button 
        id="saveHorse"
        style="flex: 1; padding: 10px; background: #0a6; color: white; border: none; cursor: pointer;"
      >
        Save Changes
      </button>
      <button 
        id="cancelEdit"
        style="flex: 1; padding: 10px; background: #666; color: white; border: none; cursor: pointer;"
      >
        Cancel
      </button>
    </div>
  `;
}
