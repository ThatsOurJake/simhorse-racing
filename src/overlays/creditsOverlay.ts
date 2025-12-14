import {
  creditsButtonStyles,
  creditsCloseButtonStyles,
  creditsDialogBoxStyles,
  creditsDialogStyles,
} from "./creditsOverlayTemplates";

export class CreditsOverlay {
  private button: HTMLButtonElement;
  private dialog: HTMLDivElement;
  private dialogBox: HTMLDivElement;
  private closeButton: HTMLButtonElement;
  private content: HTMLDivElement;

  constructor() {
    // Create button
    this.button = document.createElement("button");
    this.button.textContent = "Credits";
    this.button.setAttribute("style", creditsButtonStyles);
    this.button.onclick = () => this.show();
    document.body.appendChild(this.button);

    // Create dialog
    this.dialog = document.createElement("div");
    this.dialog.setAttribute("style", `${creditsDialogStyles}display: none;`);
    this.dialog.onclick = (e) => {
      if (e.target === this.dialog) this.hide();
    };

    // Dialog box
    this.dialogBox = document.createElement("div");
    this.dialogBox.setAttribute("style", creditsDialogBoxStyles);
    this.dialog.appendChild(this.dialogBox);

    // Close button
    this.closeButton = document.createElement("button");
    this.closeButton.innerHTML = "&times;";
    this.closeButton.setAttribute("style", creditsCloseButtonStyles);
    this.closeButton.onclick = () => this.hide();
    this.dialogBox.appendChild(this.closeButton);

    // Content
    this.content = document.createElement("div");
    this.content.innerHTML = `<div>
        <p style="text-align: center; font-weight: bold; margin-bottom: 8px">Assets used</p>
        <p>
          <a href="https://skfb.ly/pyPHt" target="_blank">Bleacher</a> by JanStano. Licensed under <a href="http://creativecommons.org/licenses/by/4.0" target="_blank">Creative Commons Attribution</a>
        </p>
        <p>
          <a href="https://www.svgrepo.com/svg/503869/horse-riding" target="_blank">Favicon</a> by zhuchao
        </p>
      </div>
      <div style="margin-top: 8px; text-align: center; font-size: 14px;">
        Game by <a href="https://github.com/ThatsOurJake" target="_blank">@ThatsOurJake</a>
      </div>`;
    this.content.classList.add("credits");
    this.dialogBox.appendChild(this.content);

    document.body.appendChild(this.dialog);
  }

  show() {
    this.dialog.style.display = "flex";
  }

  hide() {
    this.dialog.style.display = "none";
  }
}
