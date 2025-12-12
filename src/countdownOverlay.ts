export class CountdownOverlay {
  private overlayElement: HTMLDivElement;
  private currentElement: HTMLDivElement | null = null;

  constructor() {
    this.overlayElement = this.createContainer();
    document.body.appendChild(this.overlayElement);
  }

  private createContainer(): HTMLDivElement {
    const container = document.createElement('div');
    container.id = 'countdown-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.display = 'none';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '2000';
    container.style.perspective = '1000px';
    return container;
  }

  public async showCountdown(sequence: string[]): Promise<void> {
    this.overlayElement.style.display = 'block';

    for (const text of sequence) {
      await this.animateText(text);
    }

    this.overlayElement.style.display = 'none';
  }

  private animateText(text: string): Promise<void> {
    return new Promise((resolve) => {
      // Create text element
      const textElement = document.createElement('div');
      textElement.textContent = text;
      textElement.style.position = 'absolute';
      textElement.style.top = '50%';
      textElement.style.left = '50%';
      textElement.style.transform = 'translate(-50%, -50%) translateZ(-500px) scale(0.1)';
      textElement.style.fontSize = '150px';
      textElement.style.fontWeight = 'bold';
      textElement.style.color = text === 'GO' ? '#00ff00' : '#ffff00';
      textElement.style.textShadow = '0 0 20px rgba(0, 0, 0, 0.8), 0 0 40px rgba(0, 0, 0, 0.5)';
      textElement.style.fontFamily = 'Arial, sans-serif';
      textElement.style.transition = 'transform 0.5s ease-out';
      textElement.style.willChange = 'transform';

      this.overlayElement.appendChild(textElement);

      // Remove previous element if it exists
      if (this.currentElement && this.currentElement.parentNode) {
        this.currentElement.parentNode.removeChild(this.currentElement);
      }
      this.currentElement = textElement;

      // Trigger animation
      requestAnimationFrame(() => {
        textElement.style.transform = 'translate(-50%, -50%) translateZ(0) scale(1)';
      });

      // Wait for animation + display time, then resolve
      setTimeout(() => {
        resolve();
      }, 1500); // 500ms fly-in + 1000ms display
    });
  }

  public hide(): void {
    this.overlayElement.style.display = 'none';
    if (this.currentElement && this.currentElement.parentNode) {
      this.currentElement.parentNode.removeChild(this.currentElement);
      this.currentElement = null;
    }
  }

  public dispose(): void {
    this.hide();
    if (this.overlayElement.parentNode) {
      document.body.removeChild(this.overlayElement);
    }
  }
}
