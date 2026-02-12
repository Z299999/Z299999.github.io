/**
 * Control panel: reads parameters from DOM inputs and exposes them.
 */

export class Controls {
  constructor() {
    // Start-time params (apply on Reset)
    this.elM = document.getElementById('param-m');
    this.elN = document.getElementById('param-n');
    this.elInputSource = document.getElementById('param-input-source');
    this.elActivation = document.getElementById('param-activation');
    this.elWeightControl = document.getElementById('param-weight-control');

    // Run-time params (apply immediately)
    this.elMu = document.getElementById('param-mu');
    this.elMuVal = document.getElementById('param-mu-val');
    this.elPFlip = document.getElementById('param-pflip');
    this.elPFlipVal = document.getElementById('param-pflip-val');
    this.elTBridge = document.getElementById('param-tbridge');
    this.elTBridgeVal = document.getElementById('param-tbridge-val');
    this.elSigma = document.getElementById('param-sigma');
    this.elSigmaVal = document.getElementById('param-sigma-val');
    this.elOmega = document.getElementById('param-omega');
    this.elOmegaVal = document.getElementById('param-omega-val');
    this.elEpsZero = document.getElementById('param-epszero');
    this.elEpsZeroVal = document.getElementById('param-epszero-val');
    this.elK = document.getElementById('param-K');
    this.elKVal = document.getElementById('param-K-val');
    this.elSpeed = document.getElementById('param-speed');
    this.elSpeedVal = document.getElementById('param-speed-val');
    this.elOuMean = document.getElementById('param-ou-mean');

    // Impulse test params
    this.elTestInput = document.getElementById('param-test-input');
    this.elTestAmp = document.getElementById('param-test-amp');
    this.elTestSteps = document.getElementById('param-test-steps');

    // Show live values next to sliders
    this._bindSliderDisplay(this.elMu, this.elMuVal);
    this._bindSliderDisplay(this.elPFlip, this.elPFlipVal);
    this._bindSliderDisplay(this.elTBridge, this.elTBridgeVal);
    this._bindSliderDisplay(this.elSigma, this.elSigmaVal);
    this._bindSliderDisplay(this.elOmega, this.elOmegaVal);
    this._bindSliderDisplay(this.elEpsZero, this.elEpsZeroVal);
    this._bindSliderDisplay(this.elK, this.elKVal);
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
      inputSource: this.elInputSource.value,
      activation: this.elActivation?.value || 'tanh',
      weightControl: this.elWeightControl?.value || 'vanilla'
    };
  }

  /** Get run-time parameters (used every step). */
  getRunParams() {
    return {
      mu: parseFloat(this.elMu.value),
      pFlip: parseFloat(this.elPFlip.value),
      tBridge: parseFloat(this.elTBridge.value),
      sigma: parseFloat(this.elSigma.value),
      omega: parseFloat(this.elOmega.value),
      epsilon: parseFloat(this.elEpsZero.value),
      K: parseInt(this.elK.value, 10),
      inputSource: this.elInputSource.value,
      ouMean: this.elOuMean ? parseFloat(this.elOuMean.value) || 0 : 0
    };
  }

  /** Get speed in steps per second. */
  getSpeed() {
    return parseInt(this.elSpeed.value, 10);
  }

  /** Get impulse test parameters. */
  getTestParams() {
    return {
      inputIndex: parseInt(this.elTestInput.value, 10) || 0,
      amplitude: parseFloat(this.elTestAmp.value) || 1,
      steps: parseInt(this.elTestSteps.value, 10) || 200
    };
  }
}
