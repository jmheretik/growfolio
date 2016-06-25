// returns "height" data from any RGB (color) image (dimensions must be power of 2) for every pixel
// dark colors = high elevation, bright colors = low elevation
function getHeightDataFromImage(img, mapWidth, mapHeight) {
    var canvas = document.createElement('canvas');
    canvas.width = mapWidth;
    canvas.height = mapHeight;

    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0, canvas.width, canvas.height);

    // blur image to remove noise (local maxima in resulting plane)
    stackBlurCanvasRGB(canvas, 0, 0, canvas.width, canvas.height, 1);

    var finalImg = context.getImageData(0, 0, canvas.width, canvas.height);
    var heightData = new Float32Array(canvas.width * canvas.height);

    var j = 0;
    for (var i = 0; i < finalImg.data.length; i += 4) {
        var all = finalImg.data[i] + finalImg.data[i + 1] + finalImg.data[i + 2];   // add up R, G and B components
        heightData[j++] = all / 3;
    }

    return heightData;
}