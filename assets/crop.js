/* Crop tool — draggable/resizable crop box */
(function () {
  var state = { img: null, file: null, ratio: null, box: { x: 40, y: 40, w: 200, h: 150 } };
  var $ = function (id) { return document.getElementById(id); };

  IR.setupDropzone('dropzone', 'file-input', function (file) {
    state.file = file;
    IR.loadImage(file, function (img) {
      state.img = img;
      $('dropzone').classList.add('hidden');
      $('tool-panel').classList.remove('hidden');
      var pv = $('crop-img');
      pv.src = img.src;
      pv.onload = function () {
        var w = pv.clientWidth, h = pv.clientHeight;
        state.box = { x: w * 0.1, y: h * 0.1, w: w * 0.8, h: h * 0.8 };
        applyRatio();
        render();
      };
      $('meta-name').textContent = file.name;
      $('meta-dims').textContent = img.naturalWidth + ' × ' + img.naturalHeight + ' px';
      $('meta-size').textContent = IR.formatBytes(file.size);
      $('result-note').classList.add('hidden');
    });
  });

  function clampBox() {
    var pv = $('crop-img');
    var W = pv.clientWidth, H = pv.clientHeight;
    var b = state.box;
    b.w = Math.min(b.w, W); b.h = Math.min(b.h, H);
    b.x = Math.max(0, Math.min(b.x, W - b.w));
    b.y = Math.max(0, Math.min(b.y, H - b.h));
  }

  function applyRatio() {
    if (!state.ratio) return;
    var b = state.box;
    b.h = b.w / state.ratio;
    clampBox();
    if (b.h > $('crop-img').clientHeight) { b.h = $('crop-img').clientHeight; b.w = b.h * state.ratio; }
  }

  function render() {
    clampBox();
    var el = $('crop-box'), b = state.box;
    el.style.left = b.x + 'px'; el.style.top = b.y + 'px';
    el.style.width = b.w + 'px'; el.style.height = b.h + 'px';
    var pv = $('crop-img');
    var scaleX = state.img.naturalWidth / pv.clientWidth;
    var scaleY = state.img.naturalHeight / pv.clientHeight;
    $('crop-dims').textContent = Math.round(b.w * scaleX) + ' × ' + Math.round(b.h * scaleY) + ' px';
  }

  // Ratio buttons
  document.querySelectorAll('.tab-btns button').forEach(function (btn) {
    btn.addEventListener('click', function () {
      document.querySelectorAll('.tab-btns button').forEach(function (x) { x.classList.remove('active'); });
      btn.classList.add('active');
      var r = btn.dataset.ratio;
      state.ratio = r === 'free' ? null : parseFloat(r);
      if (state.ratio) applyRatio();
      render();
    });
  });

  // Drag / resize interactions (pointer events)
  var drag = null;
  function pointerPos(e) {
    var rect = $('crop-stage').getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
  $('crop-box').addEventListener('pointerdown', function (e) {
    var handle = e.target.classList.contains('crop-handle') ? e.target.dataset.dir : 'move';
    var p = pointerPos(e);
    drag = { handle: handle, startX: p.x, startY: p.y, box: Object.assign({}, state.box) };
    e.target.setPointerCapture && e.target.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  window.addEventListener('pointermove', function (e) {
    if (!drag || !state.img) return;
    var p = pointerPos(e);
    var dx = p.x - drag.startX, dy = p.y - drag.startY;
    var b = state.box, s = drag.box, min = 24;
    if (drag.handle === 'move') {
      b.x = s.x + dx; b.y = s.y + dy;
    } else {
      if (drag.handle.indexOf('e') > -1) b.w = Math.max(min, s.w + dx);
      if (drag.handle.indexOf('s') > -1) b.h = Math.max(min, s.h + dy);
      if (drag.handle.indexOf('w') > -1) { b.w = Math.max(min, s.w - dx); b.x = s.x + s.w - b.w; }
      if (drag.handle.indexOf('n') > -1) { b.h = Math.max(min, s.h - dy); b.y = s.y + s.h - b.h; }
      if (state.ratio) {
        b.h = b.w / state.ratio;
        if (drag.handle.indexOf('n') > -1) b.y = s.y + s.h - b.h;
      }
    }
    render();
  });
  window.addEventListener('pointerup', function () { drag = null; });

  $('crop-btn').addEventListener('click', function () {
    if (!state.img) return;
    var pv = $('crop-img');
    var scaleX = state.img.naturalWidth / pv.clientWidth;
    var scaleY = state.img.naturalHeight / pv.clientHeight;
    var b = state.box;
    var sx = Math.round(b.x * scaleX), sy = Math.round(b.y * scaleY);
    var sw = Math.max(1, Math.round(b.w * scaleX)), sh = Math.max(1, Math.round(b.h * scaleY));
    var canvas = document.createElement('canvas');
    canvas.width = sw; canvas.height = sh;
    canvas.getContext('2d').drawImage(state.img, sx, sy, sw, sh, 0, 0, sw, sh);
    var mime = $('format-select').value;
    if (mime === 'auto') mime = (state.file.type === 'image/png' || state.file.type === 'image/webp') ? state.file.type : 'image/jpeg';
    canvas = IR.fillWhiteIfJpeg(canvas, mime);
    var fname = IR.baseName(state.file.name) + '-cropped.' + IR.extFor(mime);
    IR.downloadCanvas(canvas, fname, mime, mime === 'image/png' ? undefined : 0.92, function (blob) {
      var note = $('result-note');
      note.textContent = '✓ Done! Cropped to ' + sw + ' × ' + sh + ' px (' + IR.formatBytes(blob.size) + '). Your download has started.';
      note.classList.remove('hidden');
    });
  });

  $('change-img').addEventListener('click', function () {
    $('tool-panel').classList.add('hidden');
    $('dropzone').classList.remove('hidden');
  });

  window.addEventListener('resize', function () { if (state.img) render(); });
})();
