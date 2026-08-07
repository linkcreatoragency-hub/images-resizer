/* Compress tool */
(function () {
  var state = { img: null, file: null, blob: null };
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
      $('result-note').classList.add('hidden');
      compressPreview();
    });
  });

  var debounce;
  function compressPreview() {
    clearTimeout(debounce);
    debounce = setTimeout(function () {
      if (!state.img) return;
      var q = parseFloat($('quality-input').value);
      var mime = $('format-select').value;
      var canvas = document.createElement('canvas');
      canvas.width = state.img.naturalWidth;
      canvas.height = state.img.naturalHeight;
      canvas.getContext('2d').drawImage(state.img, 0, 0);
      canvas = IR.fillWhiteIfJpeg(canvas, mime);
      canvas.toBlob(function (blob) {
        if (!blob) return;
        state.blob = blob;
        var saved = Math.max(0, Math.round((1 - blob.size / state.file.size) * 100));
        $('est-size').innerHTML = 'Estimated output: <b>' + IR.formatBytes(blob.size) + '</b> — you save <b>' + saved + '%</b>';
      }, mime, q);
    }, 250);
  }

  $('quality-input').addEventListener('input', function () {
    $('quality-val').textContent = Math.round(this.value * 100) + '%';
    compressPreview();
  });
  $('format-select').addEventListener('change', compressPreview);

  $('compress-btn').addEventListener('click', function () {
    if (!state.blob) return;
    var mime = $('format-select').value;
    var fname = IR.baseName(state.file.name) + '-compressed.' + IR.extFor(mime);
    var a = document.createElement('a');
    a.href = URL.createObjectURL(state.blob);
    a.download = fname;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 800);
    var note = $('result-note');
    note.textContent = '✓ Done! Compressed from ' + IR.formatBytes(state.file.size) + ' to ' + IR.formatBytes(state.blob.size) + '. Your download has started.';
    note.classList.remove('hidden');
  });

  $('change-img').addEventListener('click', function () {
    $('tool-panel').classList.add('hidden');
    $('dropzone').classList.remove('hidden');
  });
})();
