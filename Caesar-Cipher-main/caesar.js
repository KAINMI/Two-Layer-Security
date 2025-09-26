// caesar.js - Replace your current file with this.
// Handles URL params (mode + secret), radio switching, and the submit action.

document.addEventListener("DOMContentLoaded", () => {
  // DOM elements
  const form = document.getElementById("controls");
  const hInput = document.querySelector("#heading-input");
  const hOutput = document.querySelector("#heading-output");
  const selectEncodeOrDecode = document.getElementsByName("code");
  const inputText = document.getElementById("input-text");
  const outputText = document.getElementById("output-text");
  const shiftKey = document.getElementById("shift-input");
  const modulo = document.getElementById("mod-input");
  const alphabet = document.getElementById("alphabet-input");
  const letterCase = document.getElementById("letter-case");
  const foreignChars = document.getElementById("foreign-chars");
  const encodeRadio = document.getElementById("encode");
  const decodeRadio = document.getElementById("decode");

  // Helper: safely parse integer with fallback
  function toIntSafe(value, fallback = 0) {
    const n = parseInt(value, 10);
    return Number.isInteger(n) ? n : fallback;
  }

  // Remove non-alphanumeric characters (space allowed)
  function removeForeignChars(input) {
    const regex = /[^a-zA-Z0-9 ]/g;
    return input.replace(regex, "");
  }

  /**
   * Applies the caesar cipher to the input text using the specified shift and modulus.
   * decodeParam: "decode" or "encode"
   */
  function caesarCipher(decodeParam, text, shift, mod, charset, foreignCharsOption) {
    if (decodeParam === "decode") shift = -shift;

    if (foreignCharsOption == 1 || foreignCharsOption === "1") {
      text = removeForeignChars(text);
    }

    charset = (charset || "").toLowerCase();
    // If mod is invalid, default to charset length or 26
    if (!mod || mod <= 0) {
      mod = charset.length || 26;
    }

    let result = "";
    for (let i = 0; i < text.length; i++) {
      let char = text.charAt(i);
      const lowerChar = char.toLowerCase();
      const index = charset.indexOf(lowerChar);

      if (index !== -1) {
        let newIndex = (index + shift) % mod;
        if (newIndex < 0) newIndex += mod;
        const newChar = charset[newIndex] || lowerChar;
        // preserve original case
        char = char === char.toLowerCase() ? newChar : newChar.toUpperCase();
      }
      result += char;
    }
    return result;
  }

  // Radio change handler (keeps behaviour consistent)
  function setModeUI(mode) {
    if (mode === "encode") {
      hInput.textContent = "Plaintext";
      hOutput.textContent = "Ciphertext";
      // We typically clear input when user switches manually
      inputText.value = "";
      outputText.value = "";
    } else {
      hInput.textContent = "Ciphertext";
      hOutput.textContent = "Plaintext";
      // keep existing values (we may already have prefilled ciphertext from URL)
      outputText.value = "";
    }
  }

  // Attach click listeners to radio buttons
  Array.from(selectEncodeOrDecode).forEach((option) => {
    option.addEventListener("click", () => {
      setModeUI(option.value);
    });
  });

  // Handle URL params (mode + secret)
  try {
    const params = new URLSearchParams(window.location.search);
    const secret = params.get("secret");
    const mode = params.get("mode");

    if (mode === "decode") {
      decodeRadio.checked = true;
      setModeUI("decode");
    }

    if (secret) {
      // If decode mode, place secret into ciphertext input area (#input-text)
      // so user can submit to get plaintext, or we can auto-run - we will not auto-run for safety.
      inputText.value = decodeURIComponent(secret);
      // Ensure headings reflect mode
      if (!mode) {
        // if mode not provided, don't force change; but leave secret in input so user can submit.
      }
    }
  } catch (err) {
    // non-fatal - continue
    console.warn("Error parsing URL params:", err);
  }

  // Form submit handler
  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();

      const selectedOption = Array.from(selectEncodeOrDecode).find((o) => o.checked);
      const decodeOrEncode = selectedOption ? selectedOption.value : "encode";

      const inputValue = inputText.value || "";
      let shiftValue = toIntSafe(shiftKey.value, 0);
      let moduloValue = toIntSafe(modulo.value, 0);
      const alphabetValue = (alphabet.value || "abcdefghijklmnopqrstuvwxyz0123456789");
      const letterCaseValue = (letterCase.value || "1");
      const foreignCharsValue = (foreignChars.value || "1");

      // If modulo not set, default to alphabet length
      if (!moduloValue || moduloValue <= 0) moduloValue = alphabetValue.length || 36;

      let cipherOutput = caesarCipher(
        decodeOrEncode,
        inputValue,
        shiftValue,
        moduloValue,
        alphabetValue,
        foreignCharsValue
      );

      // Apply requested letter-case transform
      if (letterCaseValue == "2") {
        cipherOutput = cipherOutput.toLowerCase();
      } else if (letterCaseValue == "3") {
        cipherOutput = cipherOutput.toUpperCase();
      }

      // Show result in output textarea (use .value)
      outputText.value = cipherOutput;
    });
  } else {
    console.warn("Controls form element not found (id='controls').");
  }

  // Extra: ensure encode/decode radio clicks also update headings and clear appropriately
  encodeRadio.addEventListener("click", () => setModeUI("encode"));
  decodeRadio.addEventListener("click", () => setModeUI("decode"));
});
