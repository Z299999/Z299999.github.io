/**
 * Control panel: reads parameters from DOM inputs and exposes them.
 */

export class Controls {
  constructor() {
    // Start-time params (apply on Reset)
    this.elM = document.getElementById('param-m');
    this.elN = document.getElementById('param-n');
    this.elInputSource = document.getElementById('param-input-source');

    // Run-time params (apply immediately)
    this.elMu = document.getElementById('param-mu');
    this.elMuVal = document.getElementById('param-mu-val');
    this.elPFlip = document.getElementById('param-pflip');
    this.elPFlipVal = document.getElementById('param-pflip-val');
    this.elTBridge = document.getElementById('param-tbridge');
    this.elTBridgeVal = document.getElementById('param-tbridge-val');
    this.elSpeed = document.getElementById('param-speed');
    this.elSpeedVal = document.getElementById('param-speed-val');

    // Show live values next to sliders
    this._bindSliderDisplay(this.elMu, this.elMuVal);
    this._bindSliderDisplay(this.elPFlip, this.elPFlipVal);
    this._bindSliderDisplay(this.elTBridge, this.elTBridgeVal);
    this._bindSliderDisplay(this.elSpeed, this.elSpeedVal);
  }

  _bindSliderDisplay(slider, display) {
    const update = () => { display.textContent = slider.value; };
    slider.addEventListener('input', update);
    update();
  }

  /** Get start-time parameters (used on Reset). */
  getStartParams() {
    return {
      m: parseInt(this.elM.value, 10),
      n: parseInt(this.elN.value, 10),
      inputSource: this.elInputSource.value
    };
  }

  /** Get run-time parameters (used every step). */
  getRunParams() {
    return {
      mu: parseFloat(this.elMu.value),
      pFlip: parseFloat(this.elPFlip.value),
      tBridge: parseFloat(this.elTBridge.value),
      inputSource: this.elInputSource.value
    };
  }

  /** Get speed in steps per second. */
  getSpeed() {
    return parseInt(this.elSpeed.value, 10);
  }
}
