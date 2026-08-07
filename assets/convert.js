/* Convert tool */
(function () {
  var state = { img: null, file: null };
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
      $('meta-size').textContent = IR.formatBytes(file.size) + ' · ' + (file.type.replace('image/', '').toUpperCase() || 'IMAGE');
      $('result-note').classList.add('hidden');
    });
  });

  $('quality-input').addEventListener('input', function () {
    $('quality-val').textContent = Math.round(this.value * 100) + '%';
  });

  $('convert-btn').addEventListener('click', function () {
    if (!state.img) return;
    var mime = $('format-select').value;
    var q = parseFloat($('quality-input').value);
    var canvas = document.createElement('canvas');
    canvas.width = state.img.naturalWidth;
    canvas.height = state.img.naturalHeight;
    canvas.getContext('2d').drawImage(state.img, 0, 0);
    canvas = IR.fillWhiteIfJpeg(canvas, mime);
    var fname = IR.baseName(state.file.name) + '.' + IR.extFor(mime);
    IR.downloadCanvas(canvas, fname, mime, mime === 'image/png' ? undefined : q, function (blob) {
      var note = $('result-note');
      note.textContent = '✓ Done! Converted to ' + IR.extFor(mime).toUpperCase() + ' (' + IR.formatBytes(blob.size) + '). Your download has started.';
      note.classList.remove('hidden');
    });
  });

  $('change-img').addEventListener('click', function () {
    $('tool-panel').classList.add('hidden');
    $('dropzone').classList.remove('hidden');
  });
})();
