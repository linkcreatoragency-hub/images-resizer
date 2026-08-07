/* Resize tool */
(function () {
  var state = { img: null, file: null, mode: 'pixels' };
  var $ = function (id) { return document.getElementById(id); };

  IR.setupDropzone('dropzone', 'file-input', function (file) {
    state.file = file;
    IR.loadImage(file, function (img) {
      state.img = img;
      $('dropzone').classList.add('hidden');
      $('tool-panel').classList.remove('hidden');
      $('preview-img').src = img.src;
      $('meta-name').textContent = file.name;
      $('meta-dims').textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' px';
      $('meta-size').textContent = IR.formatBytes(file.size);
      $('w-input').value = img.naturalWidth;
      $('h-input').value = img.naturalHeight;
      $('result-note').classList.add('hidden');
    });
  });

  // tabs
  document.querySelectorAll('.tab-btns button').forEach(function (b) {
    b.addEventListener('click', function () {
      document.querySelectorAll('.tab-btns button').forEach(function (x) { x.classList.remove('active'); });
      b.classList.add('active');
      state.mode = b.dataset.mode;
      $('pixels-fields').classList.toggle('hidden', state.mode !== 'pixels');
      $('percent-fields').classList.toggle('hidden', state.mode !== 'percent');
    });
  });

  function aspect() { return state.img.naturalWidth / state.img.naturalHeight; }

  $('w-input').addEventListener('input', function () {
    if ($('lock-aspect').checked && state.img && this.value > 0) {
      $('h-input').value = Math.max(1, Math.round(this.value / aspect()));
    }
  });
  $('h-input').addEventListener('input', function () {
    if ($('lock-aspect').checked && state.img && this.value > 0) {
      $('w-input').value = Math.max(1, Math.round(this.value * aspect()));
    }
  });
  $('percent-input').addEventListener('input', function () {
    $('percent-val').textContent = this.value + '%';
  });
  $('quality-input').addEventListener('input', function () {
    $('quality-val').textContent = Math.round(this.value * 100) + '%';
  });

  document.querySelectorAll('.preset-chips button').forEach(function (b) {
    b.addEventListener('click', function () {
      if (!state.img) return;
      var w = parseInt(b.dataset.w, 10), h = parseInt(b.dataset.h, 10);
      $('w-input').value = w;
      $('h-input').value = h || Math.max(1, Math.round(w / aspect()));
    });
  });

  $('resize-btn').addEventListener('click', function () {
    if (!state.img) return;
    var w, h;
    if (state.mode === 'percent') {
      var p = parseInt($('percent-input').value, 10) / 100;
      w = Math.max(1, Math.round(state.img.naturalWidth * p));
      h = Math.max(1, Math.round(state.img.naturalHeight * p));
    } else {
      w = Math.max(1, parseInt($('w-input').value, 10) || state.img.naturalWidth);
      h = Math.max(1, parseInt($('h-input').value, 10) || state.img.naturalHeight);
    }
    var mime = $('format-select').value;
    if (mime === 'auto') mime = (state.file.type === 'image/png' || state.file.type === 'image/webp') ? state.file.type : 'image/jpeg';
    var q = parseFloat($('quality-input').value);
    var canvas = IR.drawScaled(state.img, w, h);
    canvas = IR.fillWhiteIfJpeg(canvas, mime);
    var fname = IR.baseName(state.file.name) + '-' + w + 'x' + h + '.' + IR.extFor(mime);
    IR.downloadCanvas(canvas, fname, mime, mime === 'image/png' ? undefined : q, function (blob) {
      var note = $('result-note');
      note.textContent = '✓ Done! Resized to ' + w + ' × ' + h + ' px (' + IR.formatBytes(blob.size) + '). Your download has started.';
      note.classList.remove('hidden');
    });
  });

  $('change-img').addEventListener('click', function () {
    $('tool-panel').classList.add('hidden');
    $('dropzone').classList.remove('hidden');
  });
})();
