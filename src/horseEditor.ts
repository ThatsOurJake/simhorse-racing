import {
  generateHorseName,
  generateBaseSpeed,
  calculateSpeedCurve,
  calculateRaceTime,
  generateRandomStats,
} from './horseStats';
import type { HorseData, HorseStats } from './horseStats';
import { SpeedGraph } from './speedGraph';
import {
  containerStyles,
  renderMainTemplate,
  renderHorseItem,
  renderEmptyHorseList,
  renderEditorForm,
  type HorseItemData,
  type EditorFormData,
} from './horseEditorTemplates';
import { validateRaceConfig, type RaceConfig } from './raceConfigSchema';

export class HorseEditor {
  private container: HTMLDivElement;
  private horses: HorseData[] = [];
  private raceSeed: number = 0;
  private onHorsesChanged: ((horses: HorseData[]) => void) | null = null;
  private speedGraph: SpeedGraph;
  private trackLength: number;
  private isOpen: boolean = true;
  private editingHorseId: string | null = null;
  private nameData: { descriptiveWords: string[]; christmasItems: string[] } | null = null;

  constructor(trackLength: number) {
    this.trackLength = trackLength;
    this.raceSeed = this.generateRandomSeed();
    this.container = this.createUI();
    this.speedGraph = new SpeedGraph();
    document.body.appendChild(this.container);
    this.loadNameData();
  }

  private async loadNameData(): Promise<void> {
    try {
      const response = await fetch('/horseNames.json');
      this.nameData = await response.json();
    } catch (error) {
      console.error('Failed to load horse names:', error);
    }
  }

  private generateRandomName(): string {
    if (!this.nameData) {
      return generateHorseName(this.raceSeed); // Fallback to old method
    }

    const descriptive = this.nameData.descriptiveWords[
      Math.floor(Math.random() * this.nameData.descriptiveWords.length)
    ];
    const christmasItem = this.nameData.christmasItems[
      Math.floor(Math.random() * this.nameData.christmasItems.length)
    ];

    return `${descriptive} ${christmasItem}`;
  }

  private generateRandomSeed(): number {
    return Math.floor(Math.random() * 1000000);
  }

  private createUI(): HTMLDivElement {
    const container = document.createElement('div');
    container.style.cssText = containerStyles;

    this.updateUI(container);
    return container;
  }

  private updateUI(container: HTMLDivElement): void {
    container.innerHTML = renderMainTemplate({
      raceSeed: this.raceSeed,
      horseListHTML: this.renderHorseList(),
      horsesCount: this.horses.length,
      editingHorseId: this.editingHorseId,
      editorFormHTML: this.renderEditorForm(),
    });

    this.attachEventListeners(container);
  }

  private renderHorseList(): string {
    if (this.horses.length === 0) {
      return renderEmptyHorseList();
    }

    return this.horses
      .map((horse) => {
        // Calculate estimated race time for this horse
        const speedCurve = calculateSpeedCurve(horse, this.trackLength);
        const raceTime = calculateRaceTime(speedCurve);

        const horseData: HorseItemData = {
          id: horse.id,
          name: horse.name,
          color: horse.color,
          speed: horse.stats.speed,
          stamina: horse.stats.stamina,
          acceleration: horse.stats.acceleration,
          baseSpeed: horse.baseSpeed,
          raceTime: raceTime,
        };

        return renderHorseItem(horseData);
      })
      .join('');
  }

  private renderEditorForm(): string {
    if (!this.editingHorseId) return '';

    const horse = this.horses.find((h) => h.id === this.editingHorseId);
    if (!horse) return '';

    const formData: EditorFormData = {
      horseName: horse.name,
      speed: horse.stats.speed,
      stamina: horse.stats.stamina,
      acceleration: horse.stats.acceleration,
      hat: horse.hat,
      face: horse.face,
    };

    return renderEditorForm(formData);
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

    // Export race button
    const exportBtn = container.querySelector('#exportRace');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.exportRace());
    }

    // Import race button
    const importBtn = container.querySelector('#importRace');
    const importFileInput = container.querySelector('#importFileInput') as HTMLInputElement;
    if (importBtn && importFileInput) {
      importBtn.addEventListener('click', () => importFileInput.click());
      importFileInput.addEventListener('change', (e) => this.handleImportFile(e));
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

    // Randomize name button
    const randomizeNameBtn = container.querySelector('#randomizeName');
    if (randomizeNameBtn) {
      randomizeNameBtn.addEventListener('click', () => this.randomizeCurrentHorseName());
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
      name: this.generateRandomName(),
      stats: generateRandomStats(),
      baseSpeed: generateBaseSpeed(this.raceSeed, horseIndex),
      color: this.generateHorseColor(horseIndex),
      hat: 'horse-ears',
      face: 'happy',
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
      const hats: ('horse-ears' | 'reindeer-antlers' | 'top-hat' | 'crown' | 'propeller-hat')[] = [
        'horse-ears', 'reindeer-antlers', 'top-hat', 'crown', 'propeller-hat'
      ];
      const faces: ('happy' | 'innocent' | 'red-nose' | 'angry' | 'shocked' | 'glasses')[] = [
        'happy', 'innocent', 'red-nose', 'angry', 'shocked', 'glasses'
      ];

      const horse: HorseData = {
        id: `horse-${Date.now()}-${Math.random()}`,
        name: this.generateRandomName(),
        stats: generateRandomStats(),
        baseSpeed: generateBaseSpeed(this.raceSeed, i),
        color: this.generateHorseColor(i),
        hat: hats[Math.floor(Math.random() * hats.length)],
        face: faces[Math.floor(Math.random() * faces.length)],
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
    const hatSelect = this.container.querySelector('#horseHat') as HTMLSelectElement;
    const faceSelect = this.container.querySelector('#horseFace') as HTMLSelectElement;

    const oldSpeed = horse.stats.speed;
    const newSpeed = this.clamp(parseFloat(speedInput.value) || 0.5, 0, 1);

    horse.name = nameInput.value;
    horse.stats.speed = newSpeed;
    horse.stats.stamina = this.clamp(parseFloat(staminaInput.value) || 0.5, 0, 1);
    horse.stats.acceleration = this.clamp(parseFloat(accelInput.value) || 0.5, 0, 1);
    horse.hat = hatSelect.value as 'horse-ears' | 'reindeer-antlers' | 'top-hat';
    horse.face = faceSelect.value as 'happy' | 'innocent' | 'red-nose';

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

  private randomizeCurrentHorseName(): void {
    if (!this.editingHorseId) return;

    const nameInput = this.container.querySelector('#horseName') as HTMLInputElement;
    if (!nameInput) return;

    nameInput.value = this.generateRandomName();
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

  private exportRace(): void {
    const raceConfig: RaceConfig = {
      version: '1.0',
      raceSeed: this.raceSeed,
      horses: this.horses,
    };

    const jsonString = JSON.stringify(raceConfig, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `reindeer-race-${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  }

  private async handleImportFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const json = JSON.parse(text);

      // Validate the file
      const validation = validateRaceConfig(json);
      if (!validation.success) {
        const errorMessage = validation.issues
          ? `${validation.error}:\n${validation.issues.join('\n')}`
          : validation.error;
        alert(errorMessage);
        input.value = ''; // Reset file input
        return;
      }

      // Check if we need confirmation
      if (this.horses.length > 0) {
        const confirmed = confirm(
          `This will replace your current ${this.horses.length} horse(s). Continue?`
        );
        if (!confirmed) {
          input.value = ''; // Reset file input
          return;
        }
      }

      // Import the race
      this.horses = validation.data.horses;
      this.raceSeed = validation.data.raceSeed;
      this.editingHorseId = null;
      this.notifyHorsesChanged();
      this.updateUI(this.container);

      alert('✅ Race imported successfully!');
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Invalid JSON file format';
      alert(`❌ Import Failed\n\n${errorMsg}`);
    } finally {
      input.value = ''; // Reset file input
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
