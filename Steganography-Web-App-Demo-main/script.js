let encodebtn = document.getElementById("encodebtn");
let encodeimage1fileinput = document.getElementById("encodeimage1");

let canvasbox = document.getElementById("canvasbox");
let secretTextField = document.getElementById("secretText");

let loadedImage;
let encodedImage;

let decodebtn = document.getElementById("decodebtn");
let decodeimage1fileinput = document.getElementById("decodeimage1");
let decodeimage2fileinput = document.getElementById("decodeimage2");


// -----------------------
// Encode Button
// -----------------------
encodebtn.addEventListener("click", e => {
    console.log("Encoding...");
    encodebtn.classList.add("disabled");

    if (encodeimage1fileinput.files && encodeimage1fileinput.files[0]) {
        loadedImage = loadImage(URL.createObjectURL(encodeimage1fileinput.files[0]), () => {
            loadedImage.loadPixels();

            let secretText = secretTextField.value;
            console.log("Secret message:", secretText);

            // Create a copy of the image
            encodedImage = createImage(loadedImage.width, loadedImage.height);
            encodedImage.copy(
                loadedImage,
                0, 0, loadedImage.width, loadedImage.height,
                0, 0, loadedImage.width, loadedImage.height
            );

            encodedImage.loadPixels();

            // Encode the message into the image
            encodeMessage(encodedImage, secretText);

            // Download the encoded image
            downloadEncodedImage(encodedImage, "encoded_image.png");

            encodebtn.classList.remove("disabled");
        });
    } else {
        alert("Please select an image file.");
    }
});


// -----------------------
// Decode Button
// -----------------------
decodebtn.addEventListener("click", e => {
    console.log("Decoding...");
    decodebtn.classList.add("disabled");

    if (
        decodeimage1fileinput.files &&
        decodeimage1fileinput.files[0] &&
        decodeimage2fileinput.files &&
        decodeimage2fileinput.files[0]
    ) {
        loadImage(URL.createObjectURL(decodeimage1fileinput.files[0]), img1 => {
            loadImage(URL.createObjectURL(decodeimage2fileinput.files[0]), img2 => {
                img1.loadPixels();
                img2.loadPixels();

                let decodedMessage = decodeMessage(img1, img2);
                console.log("Decoded Message:", decodedMessage);

                secretTextField.value = decodedMessage;

                decodebtn.classList.remove("disabled");
            });
        });
    } else {
        alert("Please select both image files.");
        decodebtn.classList.remove("disabled");
    }
});


// -----------------------
// p5.js Sketch (minimal)
// -----------------------
function setup() {}
function draw() {
    noLoop();
}


// -----------------------
// Encoding Functions
// -----------------------
function encodeMessage(img, message) {
    // Add delimiter to mark end of message
    message = message + "||END||";

    let binaryMessage = textToBinary(message);
    img.loadPixels();

    let index = 0;
    for (let i = 0; i < img.pixels.length; i += 4) {
        for (let j = 0; j < 3; j++) {
            if (index < binaryMessage.length) {
                let bit = int(binaryMessage[index]);

                if (bit === 1 && img.pixels[i + j] < 255) {
                    img.pixels[i + j]++;
                } else if (bit === 1 && img.pixels[i + j] === 255) {
                    img.pixels[i + j]--;
                }
                index++;
            }
        }
    }

    img.updatePixels();
}


function textToBinary(text) {
    let binaryMessage = "";
    for (let i = 0; i < text.length; i++) {
        let binaryChar = text[i].charCodeAt(0).toString(2);
        binaryMessage += "0".repeat(8 - binaryChar.length) + binaryChar;
    }
    return binaryMessage;
}


function downloadEncodedImage(img, filename) {
    let link = document.createElement("a");
    let dataURL = img.canvas.toDataURL();
    link.href = dataURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}


// -----------------------
// Decoding Functions
// -----------------------
function decodeMessage(originalImage, encodedImage) {
    let decodedBinary = "";
    originalImage.loadPixels();
    encodedImage.loadPixels();

    for (let i = 0; i < originalImage.pixels.length; i += 4) {
        for (let j = 0; j < 3; j++) {
            let originalValue = int(originalImage.pixels[i + j]);
            let encodedValue = int(encodedImage.pixels[i + j]);

            if (originalValue !== encodedValue) {
                decodedBinary += "1";
            } else {
                decodedBinary += "0";
            }
        }
    }

    let textMessage = binaryToText(decodedBinary);

    // Cut off at delimiter
    let endIndex = textMessage.indexOf("||END||");
    if (endIndex !== -1) {
        textMessage = textMessage.substring(0, endIndex);
    }

    return textMessage;
}


function binaryToText(binaryMessage) {
    let textMessage = "";
    for (let i = 0; i < binaryMessage.length; i += 8) {
        let byte = binaryMessage.substr(i, 8);
        if (byte.length === 8) {
            textMessage += String.fromCharCode(parseInt(byte, 2));
        }
    }
    return textMessage;
}


// -----------------------
// Copy & Send Button (only in Decode tab)
// -----------------------
document.addEventListener("DOMContentLoaded", function () {
    let secretText = document.getElementById("secretText");
    let copyBtn = document.createElement("button");
    copyBtn.textContent = "Copy to Caesar Cipher";
    copyBtn.className = "btn btn-success mt-2";
    copyBtn.id = "copyToCipher";
    copyBtn.style.display = "none"; // hidden by default

    secretText.insertAdjacentElement("afterend", copyBtn);

    // Show button only when "Decode" tab is active
    let decodeTab = document.getElementById("profile-tab");
    let encodeTab = document.getElementById("home-tab");

    decodeTab.addEventListener("click", function () {
        copyBtn.style.display = "inline-block";
    });

    encodeTab.addEventListener("click", function () {
        copyBtn.style.display = "none";
    });

    // Button logic
    copyBtn.addEventListener("click", function () {
        let message = secretText.value.trim();
        if (message.length === 0) {
            alert("No decoded message to copy.");
            return;
        }
        // Pass message + force Caesar page into decode mode
        window.location.href =
            "../Caesar-Cipher-main/index.html?mode=decode&secret=" +
            encodeURIComponent(message);
    });
});
