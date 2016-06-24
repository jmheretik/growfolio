// returns "height" data from any RGB (color) image (dimensions must be power of 2) for every pixel
// dark colors = high elevation, bright colors = low elevation
function getHeightDataFromImage(img) {
    var canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;

    var context = canvas.getContext('2d');
    context.drawImage(img, 0, 0);
    var imgData = context.getImageData(0, 0, img.width, img.height);
    var rgbPixels = imgData.data;

    var heightData = new Float32Array(img.width * img.height);

    var j = 0;
    for (var i = 0; i < rgbPixels.length; i += 4) {
        var all = rgbPixels[i] + rgbPixels[i + 1] + rgbPixels[i + 2];   // add up R, G and B components
        heightData[j++] = all / 3;
    }

    return heightData;
}