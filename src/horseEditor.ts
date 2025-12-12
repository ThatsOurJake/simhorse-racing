import {
  generateHorseName,
  generateBaseSpeed,
  calculateSpeedCurve,
  calculateRaceTime,
  generateRandomStats,
} from './horseStats';
import type { HorseData, HorseStats } from './horseStats';
import { SpeedGraph } from './speedGraph';

export class HorseEditor {
  private container: HTMLDivElement;
  private horses: HorseData[] = [];
  private raceSeed: number = 0;
  private onHorsesChanged: ((horses: HorseData[]) => void) | null = null;
  private speedGraph: SpeedGraph;
  private trackLength: number;
  private isOpen: boolean = true;
  private editingHorseId: string | null = null;

  constructor(trackLength: number) {
    this.trackLength = trackLength;
    this.raceSeed = this.generateRandomSeed();
    this.container = this.createUI();
    this.speedGraph = new SpeedGraph();
    document.body.appendChild(this.container);
  }

  private generateRandomSeed(): number {
    return Math.floor(Math.random() * 1000000);
  }

  private createUI(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = `
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

    this.updateUI(container);
    return container;
  }

  private updateUI(container: HTMLDivElement): void {
    container.innerHTML = `
      <h2 style="margin-top: 0;">Horse Editor</h2>
      
      <div style="margin-bottom: 20px;">
        <label style="display: block; margin-bottom: 5px;">Race Seed:</label>
        <input 
          type="number" 
          id="raceSeed" 
          value="${this.raceSeed}"
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
        ${this.renderHorseList()}
      </div>

      <button 
        id="addHorse"
        ${this.horses.length >= 8 ? 'disabled' : ''}
        style="padding: 10px; background: #0a6; color: white; border: none; cursor: pointer; width: 100%; margin-bottom: 10px; ${this.horses.length >= 8 ? 'opacity: 0.5; cursor: not-allowed;' : ''}"
      >
        Add Horse (${this.horses.length}/8)
      </button>

      <button 
        id="randomizeRace"
        style="padding: 10px; background: #a06; color: white; border: none; cursor: pointer; width: 100%; margin-bottom: 10px;"
      >
        🎲 Randomize Full Race (8 Horses)
      </button>

      <div id="editorForm" style="display: ${this.editingHorseId ? 'block' : 'none'}; border-top: 2px solid #555; padding-top: 20px; margin-top: 20px;">
        ${this.renderEditorForm()}
      </div>

      <div id="speedGraphContainer" style="margin-top: 20px; display: ${this.editingHorseId ? 'block' : 'none'};">
        <h3 style="margin-bottom: 10px;">Speed Graph</h3>
        <canvas id="speedGraphCanvas" width="360" height="200" style="background: #222; border: 1px solid #555;"></canvas>
        <div id="raceTimeInfo" style="margin-top: 10px; color: #aaa; font-size: 12px;"></div>
      </div>
    `;

    this.attachEventListeners(container);
  }

  private renderHorseList(): string {
    if (this.horses.length === 0) {
      return '<p style="color: #888;">No horses added yet. Click "Add Horse" to start.</p>';
    }

    return this.horses
      .map((horse) => {
        // Calculate estimated race time for this horse
        const speedCurve = calculateSpeedCurve(horse, this.trackLength);
        const raceTime = calculateRaceTime(speedCurve);

        return `
      <div 
        style="background: #222; padding: 10px; margin-bottom: 10px; border-left: 4px solid #${horse.color.toString(16).padStart(6, '0')}; cursor: pointer;"
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
          Speed: ${horse.stats.speed.toFixed(2)} | Stamina: ${horse.stats.stamina.toFixed(2)} | Accel: ${horse.stats.acceleration.toFixed(2)}
        </div>
        <div style="font-size: 11px; color: #888;">
          Base Speed: ${horse.baseSpeed.toFixed(2)} u/s | Est. Time: ${raceTime.toFixed(2)}s
        </div>
      </div>
    `;
      })
      .join('');
  }

  private renderEditorForm(): string {
    if (!this.editingHorseId) return '';

    const horse = this.horses.find((h) => h.id === this.editingHorseId);
    if (!horse) return '';

    return `
      <h3 style="margin-top: 0;">Editing: ${horse.name}</h3>
      
      <label style="display: block; margin-bottom: 5px;">Name:</label>
      <input 
        type="text" 
        id="horseName" 
        value="${horse.name}"
        style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
      />

      <label style="display: block; margin-bottom: 5px;">Speed (0-1):</label>
      <input 
        type="number" 
        id="horseSpeed" 
        value="${horse.stats.speed}"
        min="0"
        max="1"
        step="0.01"
        style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
      />

      <label style="display: block; margin-bottom: 5px;">Stamina (0-1):</label>
      <input 
        type="number" 
        id="horseStamina" 
        value="${horse.stats.stamina}"
        min="0"
        max="1"
        step="0.01"
        style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
      />

      <label style="display: block; margin-bottom: 5px;">Acceleration (0-1):</label>
      <input 
        type="number" 
        id="horseAcceleration" 
        value="${horse.stats.acceleration}"
        min="0"
        max="1"
        step="0.01"
        style="width: 100%; padding: 5px; background: #333; color: white; border: 1px solid #555; margin-bottom: 15px;"
      />

      <button 
        id="randomizeStats"
        style="width: 100%; padding: 8px; background: #444; color: white; border: 1px solid #666; cursor: pointer; margin-bottom: 15px;"
      >
        🎲 Randomize Stats
      </button>

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

  private attachEventListeners(container: HTMLDivElement): void {
    // Race seed input
    const seedInput = container.querySelector('#raceSeed') as HTMLInputElement;
    if (seedInput) {
      seedInput.addEventListener('change', () => {
        const newSeed = parseInt(seedInput.value) || 0;
        if (newSeed !== this.raceSeed) {
          this.raceSeed = newSeed;
          this.regenerateAllBaseSpeeds();
        }
      });
    }

    // Randomize seed button
    const randomizeBtn = container.querySelector('#randomizeSeed');
    if (randomizeBtn) {
      randomizeBtn.addEventListener('click', () => {
        this.raceSeed = this.generateRandomSeed();
        this.regenerateAllBaseSpeeds();
        this.updateUI(this.container);
      });
    }

    // Add horse button
    const addBtn = container.querySelector('#addHorse');
    if (addBtn) {
      addBtn.addEventListener('click', () => this.addHorse());
    }

    // Randomize race button
    const randomizeRaceBtn = container.querySelector('#randomizeRace');
    if (randomizeRaceBtn) {
      randomizeRaceBtn.addEventListener('click', () => this.randomizeFullRace());
    }

    // Delete horse buttons
    const deleteButtons = container.querySelectorAll('.deleteHorse');
    deleteButtons.forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const horseId = (btn as HTMLElement).getAttribute('data-horse-id');
        if (horseId) this.deleteHorse(horseId);
      });
    });

    // Horse item click (for editing)
    const horseItems = container.querySelectorAll('.horse-item');
    horseItems.forEach((item) => {
      item.addEventListener('click', () => {
        const horseId = (item as HTMLElement).getAttribute('data-horse-id');
        if (horseId) this.editHorse(horseId);
      });
    });

    // Save button
    const saveBtn = container.querySelector('#saveHorse');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => this.saveHorseEdits());
    }

    // Cancel button
    const cancelBtn = container.querySelector('#cancelEdit');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        this.editingHorseId = null;
        this.updateUI(this.container);
      });
    }

    // Randomize stats button
    const randomizeStatsBtn = container.querySelector('#randomizeStats');
    if (randomizeStatsBtn) {
      randomizeStatsBtn.addEventListener('click', () => this.randomizeCurrentHorseStats());
    }

    // Live update for stat changes
    const statInputs = ['horseSpeed', 'horseStamina', 'horseAcceleration'];
    statInputs.forEach((inputId) => {
      const input = container.querySelector(`#${inputId}`) as HTMLInputElement;
      if (input) {
        input.addEventListener('input', () => this.updateSpeedGraph());
      }
    });
  }

  private addHorse(): void {
    if (this.horses.length >= 8) return;

    const horseIndex = this.horses.length;
    const horse: HorseData = {
      id: `horse-${Date.now()}-${Math.random()}`,
      name: generateHorseName(horseIndex),
      stats: generateRandomStats(),
      baseSpeed: generateBaseSpeed(this.raceSeed, horseIndex),
      color: this.generateHorseColor(horseIndex),
    };

    this.horses.push(horse);
    this.editingHorseId = horse.id;
    this.notifyHorsesChanged();
    this.updateUI(this.container);
    this.updateSpeedGraph();
  }

  private deleteHorse(horseId: string): void {
    this.horses = this.horses.filter((h) => h.id !== horseId);
    if (this.editingHorseId === horseId) {
      this.editingHorseId = null;
    }
    this.notifyHorsesChanged();
    this.updateUI(this.container);
  }

  private randomizeFullRace(): void {
    // Clear all existing horses
    this.horses = [];
    this.editingHorseId = null;

    // Add 8 random horses
    for (let i = 0; i < 8; i++) {
      const horse: HorseData = {
        id: `horse-${Date.now()}-${Math.random()}`,
        name: generateHorseName(i),
        stats: generateRandomStats(),
        baseSpeed: generateBaseSpeed(this.raceSeed, i),
        color: this.generateHorseColor(i),
      };
      this.horses.push(horse);
    }

    this.notifyHorsesChanged();
    this.updateUI(this.container);
  }

  private editHorse(horseId: string): void {
    this.editingHorseId = horseId;
    this.updateUI(this.container);
    this.updateSpeedGraph();
  }

  private saveHorseEdits(): void {
    if (!this.editingHorseId) return;

    const horse = this.horses.find((h) => h.id === this.editingHorseId);
    if (!horse) return;

    const nameInput = this.container.querySelector('#horseName') as HTMLInputElement;
    const speedInput = this.container.querySelector('#horseSpeed') as HTMLInputElement;
    const staminaInput = this.container.querySelector('#horseStamina') as HTMLInputElement;
    const accelInput = this.container.querySelector('#horseAcceleration') as HTMLInputElement;

    const oldSpeed = horse.stats.speed;
    const newSpeed = this.clamp(parseFloat(speedInput.value) || 0.5, 0, 1);

    horse.name = nameInput.value;
    horse.stats.speed = newSpeed;
    horse.stats.stamina = this.clamp(parseFloat(staminaInput.value) || 0.5, 0, 1);
    horse.stats.acceleration = this.clamp(parseFloat(accelInput.value) || 0.5, 0, 1);

    // Regenerate base speed only if max speed changed
    if (oldSpeed !== newSpeed) {
      const horseIndex = this.horses.findIndex((h) => h.id === this.editingHorseId);
      horse.baseSpeed = generateBaseSpeed(this.raceSeed, horseIndex);
    }

    this.editingHorseId = null;
    this.notifyHorsesChanged();
    this.updateUI(this.container);
  }

  private regenerateAllBaseSpeeds(): void {
    this.horses.forEach((horse, index) => {
      horse.baseSpeed = generateBaseSpeed(this.raceSeed, index);
    });
    this.notifyHorsesChanged();
    this.updateSpeedGraph();
  }

  private randomizeCurrentHorseStats(): void {
    if (!this.editingHorseId) return;

    const speedInput = this.container.querySelector('#horseSpeed') as HTMLInputElement;
    const staminaInput = this.container.querySelector('#horseStamina') as HTMLInputElement;
    const accelInput = this.container.querySelector('#horseAcceleration') as HTMLInputElement;

    if (!speedInput || !staminaInput || !accelInput) return;

    const randomStats = generateRandomStats();
    speedInput.value = randomStats.speed.toFixed(3);
    staminaInput.value = randomStats.stamina.toFixed(3);
    accelInput.value = randomStats.acceleration.toFixed(3);

    this.updateSpeedGraph();
  }

  private updateSpeedGraph(): void {
    if (!this.editingHorseId) return;

    const horse = this.horses.find((h) => h.id === this.editingHorseId);
    if (!horse) return;

    // Get current values from inputs
    const speedInput = this.container.querySelector('#horseSpeed') as HTMLInputElement;
    const staminaInput = this.container.querySelector('#horseStamina') as HTMLInputElement;
    const accelInput = this.container.querySelector('#horseAcceleration') as HTMLInputElement;

    if (!speedInput || !staminaInput || !accelInput) return;

    const tempStats: HorseStats = {
      speed: this.clamp(parseFloat(speedInput.value) || 0.5, 0, 1),
      stamina: this.clamp(parseFloat(staminaInput.value) || 0.5, 0, 1),
      acceleration: this.clamp(parseFloat(accelInput.value) || 0.5, 0, 1),
    };

    const tempHorse: HorseData = { ...horse, stats: tempStats };
    const speedCurve = calculateSpeedCurve(tempHorse, this.trackLength);
    const raceTime = calculateRaceTime(speedCurve);

    const canvas = this.container.querySelector('#speedGraphCanvas') as HTMLCanvasElement;
    if (canvas) {
      this.speedGraph.draw(canvas, speedCurve);
    }

    const raceTimeInfo = this.container.querySelector('#raceTimeInfo');
    if (raceTimeInfo) {
      raceTimeInfo.textContent = `Estimated race time: ${raceTime.toFixed(2)}s`;
    }
  }

  private generateHorseColor(index: number): number {
    const colors = [
      0xff6b6b, // Red
      0x4ecdc4, // Cyan
      0xffe66d, // Yellow
      0x95e1d3, // Mint
      0xf38181, // Pink
      0xaa96da, // Purple
      0xfcbad3, // Light pink
      0xa8d8ea, // Light blue
    ];
    return colors[index % colors.length];
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
  }

  private notifyHorsesChanged(): void {
    if (this.onHorsesChanged) {
      this.onHorsesChanged(this.horses);
    }
  }

  public onHorsesChange(callback: (horses: HorseData[]) => void): void {
    this.onHorsesChanged = callback;
  }

  public getHorses(): HorseData[] {
    return this.horses;
  }

  public getRaceSeed(): number {
    return this.raceSeed;
  }

  public open(): void {
    this.isOpen = true;
    this.container.style.transform = 'translateX(0)';
  }

  public close(): void {
    this.isOpen = false;
    this.container.style.transform = 'translateX(100%)';
  }

  public hide(): void {
    this.container.style.display = 'none';
  }

  public show(): void {
    this.container.style.display = 'block';
  }

  public toggle(): void {
    if (this.isOpen) {
      this.close();
    } else {
      this.open();
    }
  }

  public isEditorOpen(): boolean {
    return this.isOpen;
  }
}
