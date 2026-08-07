/* images-resizer.com — shared helpers */
(function () {
  var t = document.querySelector('.nav-toggle');
  var links = document.querySelector('.nav-links');
  if (t && links) {
    t.addEventListener('click', function () { links.classList.toggle('open'); });
  }
})();

window.IR = {
  formatBytes: function (b) {
    if (b === 0) return '0 B';
    var k = 1024, sizes = ['B', 'KB', 'MB', 'GB'];
    var i = Math.floor(Math.log(b) / Math.log(k));
    return parseFloat((b / Math.pow(k, i)).toFixed(i > 1 ? 2 : 0)) + ' ' + sizes[i];
  },

  // Wire a dropzone + hidden file input; calls onFile(file) with the first image file.
  setupDropzone: function (dzId, inputId, onFile) {
    var dz = document.getElementById(dzId);
    var input = document.getElementById(inputId);
    if (!dz || !input) return;
    dz.addEventListener('click', function () { input.click(); });
    dz.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.click(); }
    });
    input.addEventListener('change', function () {
      if (input.files && input.files[0]) onFile(input.files[0]);
      input.value = '';
    });
    ;['dragenter', 'dragover'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add('dragover'); });
    });
    ;['dragleave', 'drop'].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove('dragover'); });
    });
    dz.addEventListener('drop', function (e) {
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f && f.type.indexOf('image') === 0) onFile(f);
    });
    // paste support
    document.addEventListener('paste', function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') === 0) { onFile(items[i].getAsFile()); break; }
      }
    });
  },

  // Load a File into an HTMLImageElement. cb(img, dataUrl)
  loadImage: function (file, cb) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () { cb(img, e.target.result); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  // Export canvas as blob and trigger download. cb(blob) optional.
  downloadCanvas: function (canvas, filename, mime, quality, cb) {
    canvas.toBlob(function (blob) {
      if (!blob) return;
      if (cb) cb(blob);
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    }, mime, quality);
  },

  baseName: function (name) {
    var i = name.lastIndexOf('.');
    return i > 0 ? name.slice(0, i) : name;
  },

  extFor: function (mime) {
    return mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  },

  // High-quality downscale using stepped resampling
  drawScaled: function (img, targetW, targetH) {
    var cur = document.createElement('canvas');
    cur.width = img.naturalWidth; cur.height = img.naturalHeight;
    cur.getContext('2d').drawImage(img, 0, 0);
    while (cur.width * 0.5 > targetW && cur.height * 0.5 > targetH) {
      var half = document.createElement('canvas');
      half.width = Math.max(targetW, Math.round(cur.width * 0.5));
      half.height = Math.max(targetH, Math.round(cur.height * 0.5));
      var hctx = half.getContext('2d');
      hctx.imageSmoothingEnabled = true;
      hctx.imageSmoothingQuality = 'high';
      hctx.drawImage(cur, 0, 0, half.width, half.height);
      cur = half;
    }
    var out = document.createElement('canvas');
    out.width = targetW; out.height = targetH;
    var ctx = out.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(cur, 0, 0, targetW, targetH);
    return out;
  },

  fillWhiteIfJpeg: function (canvas, mime) {
    if (mime !== 'image/jpeg') return canvas;
    var out = document.createElement('canvas');
    out.width = canvas.width; out.height = canvas.height;
    var ctx = out.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(canvas, 0, 0);
    return out;
  }
};
