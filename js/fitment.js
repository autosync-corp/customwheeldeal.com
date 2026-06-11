// ─────────────── fitment.js — Vehicle fitment engine (wheels + tires)
// Pure utilities — no React, no API calls.
// Functions expect a vehicleData object with Fitments[], OptionalFitments[], PlusSizes[].

// ── Staggered detection ──────────────────────────────────────────────────────

function hasStaggeredFitment(vehicleData) {
  if (!vehicleData) return false;
  return vehicleData.Staggered === true;
}

// ── Fitment row extraction ───────────────────────────────────────────────────
// Returns normalized rows with standard field names.
// For staggered combined rows in Fitments/OptionalFitments, front uses main fields;
// rear remaps the *Rear fields to standard names.
// PlusSizes are separated by Type: 'F' (front) / 'R' (rear).

function extractFrontFitments(vehicleData) {
  if (!vehicleData) return [];
  var oe = (vehicleData.Fitments || []).concat(vehicleData.OptionalFitments || []);
  // LugCount, BoltCircle, Bore, MaxWheelLoad live on the Vehicle object, not in Fitment rows.
  var vehicleLevel = {
    LugCount:    vehicleData.LugCount,
    BoltCircle1: vehicleData.BoltCircle,
    Bore:        vehicleData.Bore,
    LoadRating:  vehicleData.MaxWheelLoad
  };
  var front = oe.map(function(f) { return Object.assign({}, f, vehicleLevel, { _axle: 'front' }); });
  var plus = (vehicleData.PlusSizes || [])
    .filter(function(f) { return f.Type === 'F'; })
    .map(function(f) { return Object.assign({}, f, vehicleLevel, { _axle: 'front', _source: 'plus' }); });
  return front.concat(plus);
}

function extractRearFitments(vehicleData) {
  if (!vehicleData) return [];
  var oe = (vehicleData.Fitments || []).concat(vehicleData.OptionalFitments || []);
  var vehicleLevel = {
    LugCount:    vehicleData.LugCount,
    BoltCircle1: vehicleData.BoltCircle,
    Bore:        vehicleData.BoreRear || vehicleData.Bore,
    LoadRating:  vehicleData.MaxWheelLoad
  };
  var rear = oe
    .filter(function(f) { return f.RimDiameterRear != null; })
    .map(function(f) {
      return Object.assign({}, vehicleLevel, {
        RimDiameter: f.RimDiameterRear,
        RimWidth:    f.RimWidthRear,
        MinOffset:   f.MinOffsetRear,
        MaxOffset:   f.MaxOffsetRear,
        TireSize:    f.TireSizeRear,
        _axle: 'rear'
      });
    });
  var plus = (vehicleData.PlusSizes || [])
    .filter(function(f) { return f.Type === 'R'; })
    .map(function(f) { return Object.assign({}, f, vehicleLevel, { _axle: 'rear', _source: 'plus' }); });
  return rear.concat(plus);
}

// ── Wheel fitment check ──────────────────────────────────────────────────────
// wheel requires: lugCount, boltCircle1, boltCircle2, boreRaw, loadRatingRaw, diameter, width
// (added to normalizeWheelItem in wheels/index.html)

function _checkWheelAgainstRow(wheel, row, skipOffset) {
  var reasons = [];

  // Bolt pattern = lug count + bolt circle, must match exactly (no tolerance).
  // Vehicle always has one bolt circle (rBC1). Wheel may be dual-drill (wBC1 + wBC2).
  // Pass if vehicle bolt circle matches either of the wheel's bolt circles.
  var wLugs = Number(wheel.lugCount);
  var rLugs = Number(row.LugCount);
  var wBC1 = Number(wheel.boltCircle1);
  var wBC2 = wheel.boltCircle2 ? Number(wheel.boltCircle2) : null;
  var rBC1 = Number(row.BoltCircle1);
  if (wLugs && rLugs) {
    if (wLugs !== rLugs) {
      reasons.push('Bolt pattern: ' + wLugs + 'x' + (wBC1 || '?') + ' ≠ ' + rLugs + 'x' + (rBC1 || '?'));
      return { pass: false, reasons: reasons };
    }
    if (wBC1 && rBC1) {
      var bcMatch = (wBC1 === rBC1) || (wBC2 != null && wBC2 === rBC1);
      if (!bcMatch) {
        var wBoltStr = wLugs + 'x' + wBC1 + (wBC2 ? '/' + wBC2 : '');
        reasons.push('Bolt pattern ' + wBoltStr + ' ≠ ' + rLugs + 'x' + rBC1);
        return { pass: false, reasons: reasons };
      }
    }
  }

  var wBore = Number(wheel.boreRaw);
  var rBore = Number(row.Bore);
  if (wBore && rBore && wBore < rBore) {
    reasons.push('Bore ' + wBore + ' < required ' + rBore);
    return { pass: false, reasons: reasons };
  }

  var wLoad = Number(wheel.loadRatingRaw);
  var rLoad = row.LoadRating ? Number(row.LoadRating) / 4 : 0;
  if (wLoad && rLoad && wLoad < rLoad) {
    reasons.push('Load rating ' + wLoad + ' < required ' + rLoad + ' (MaxWheelLoad ' + row.LoadRating + ' ÷ 4)');
    return { pass: false, reasons: reasons };
  }

  var wDiam = Number(wheel.diameter);
  var rDiam = Number(row.RimDiameter);
  if (wDiam && rDiam && wDiam !== rDiam) {
    reasons.push('Diameter ' + wDiam + ' ≠ ' + rDiam);
    return { pass: false, reasons: reasons };
  }

  // Only enforce width range when the API explicitly provides RimWidthMin AND RimWidthMax.
  // Falling back to OE width ± 0.5 rejects perfectly valid aftermarket widths.
  var wWidth = Number(wheel.width);
  if (wWidth && row.RimWidthMin != null && row.RimWidthMax != null) {
    var rWidthMin = Number(row.RimWidthMin);
    var rWidthMax = Number(row.RimWidthMax);
    if (wWidth < rWidthMin || wWidth > rWidthMax) {
      reasons.push('Width ' + wWidth + ' outside ' + rWidthMin + '–' + rWidthMax);
      return { pass: false, reasons: reasons };
    }
  }

  if (!skipOffset) {
    var wOffset = wheel.offsetRaw != null ? Number(wheel.offsetRaw) : null;
    var rMinOff = row.MinOffset != null ? Number(row.MinOffset) : null;
    var rMaxOff = row.MaxOffset != null ? Number(row.MaxOffset) : null;
    if (wOffset != null && rMinOff != null && rMaxOff != null) {
      if (wOffset < rMinOff || wOffset > rMaxOff) {
        reasons.push('Offset ' + wOffset + 'mm outside ' + rMinOff + '–' + rMaxOff + 'mm');
        return { pass: false, reasons: reasons };
      }
    }
  }

  return { pass: true, reasons: [] };
}

// Returns { fits: bool, fitmentType: 'exact'|'plus'|null, reasons: string[] }
function checkWheelFitment(wheel, fitmentRows, skipOffset) {
  if (!fitmentRows || !fitmentRows.length) return { fits: false, fitmentType: null, reasons: ['No fitment data'] };
  var oeRows = fitmentRows.filter(function(f) { return f._source !== 'plus'; });
  var plusRows = fitmentRows.filter(function(f) { return f._source === 'plus'; });
  var i, r;
  for (i = 0; i < oeRows.length; i++) {
    r = _checkWheelAgainstRow(wheel, oeRows[i], skipOffset);
    if (r.pass) return { fits: true, fitmentType: 'exact', reasons: [] };
  }
  for (i = 0; i < plusRows.length; i++) {
    r = _checkWheelAgainstRow(wheel, plusRows[i], skipOffset);
    if (r.pass) return { fits: true, fitmentType: 'plus', reasons: [] };
  }
  var lastRow = oeRows.length ? oeRows[oeRows.length - 1] : plusRows[plusRows.length - 1];
  return { fits: false, fitmentType: null, reasons: _checkWheelAgainstRow(wheel, lastRow, skipOffset).reasons };
}

// Returns { frontFits, rearFits, frontReasons, rearReasons, fitmentType }
function checkWheelFitmentStaggered(wheel, vehicleData) {
  var frontRows = extractFrontFitments(vehicleData);
  var rearRows = extractRearFitments(vehicleData);
  var front = checkWheelFitment(wheel, frontRows, true);
  var rear = checkWheelFitment(wheel, rearRows, true);
  var fitmentType = null;
  if (front.fits && rear.fits) {
    fitmentType = (front.fitmentType === 'plus' || rear.fitmentType === 'plus') ? 'plus' : 'exact';
  } else if (front.fits) {
    fitmentType = front.fitmentType;
  } else if (rear.fits) {
    fitmentType = rear.fitmentType;
  }
  return {
    frontFits: front.fits,
    rearFits: rear.fits,
    frontReasons: front.reasons,
    rearReasons: rear.reasons,
    fitmentType: fitmentType
  };
}

// ── Wheel size lists ─────────────────────────────────────────────────────────

// OE Fitments only (no Optional, no Plus). Staggered rows grouped as front/rear pairs.
function getOEWheelSizes(vehicleData) {
  if (!vehicleData) return [];
  var seen = {};
  var result = [];
  (vehicleData.Fitments || []).forEach(function(f) {
    var isStag = f.RimDiameterRear != null;
    var entry;
    if (isStag) {
      entry = {
        staggered: true,
        front: { diameter: f.RimDiameter, width: f.RimWidth, widthMin: f.RimWidthMin, widthMax: f.RimWidthMax },
        rear:  { diameter: f.RimDiameterRear, width: f.RimWidthRear, widthMin: f.RimWidthMinRear, widthMax: f.RimWidthMaxRear },
        label: f.RimDiameter + 'x' + f.RimWidth + 'F / ' + f.RimDiameterRear + 'x' + f.RimWidthRear + 'R'
      };
    } else {
      entry = {
        staggered: false,
        diameter: f.RimDiameter,
        width: f.RimWidth,
        widthMin: f.RimWidthMin,
        widthMax: f.RimWidthMax,
        label: f.RimDiameter + 'x' + f.RimWidth
      };
    }
    if (!seen[entry.label]) {
      seen[entry.label] = true;
      result.push(entry);
    }
  });
  return result;
}

// All sizes (OE + Optional + Plus) as labeled entries for dropdowns and sidebar.
// Non-staggered: { staggered:false, source, label:'19x8.5', diameter:'19', width:8.5 }
// Staggered:     { staggered:true,  source, label:'19x8.5F / 20x11R', diameter:'19', front:{}, rear:{} }
function getAllLabeledWheelSizes(vehicleData) {
  if (!vehicleData) return [];
  var seen = {};
  var result = [];
  function addRow(f, source) {
    var isStag = f.RimDiameterRear != null;
    var key = isStag
      ? (f.RimDiameter + 'x' + f.RimWidth + 'F / ' + f.RimDiameterRear + 'x' + f.RimWidthRear + 'R')
      : String(f.RimDiameter);
    if (seen[key]) return;
    seen[key] = true;
    if (isStag) {
      result.push({ staggered: true, source: source, label: key, diameter: String(f.RimDiameter),
        front: { diameter: f.RimDiameter, width: f.RimWidth },
        rear:  { diameter: f.RimDiameterRear, width: f.RimWidthRear } });
    } else {
      result.push({ staggered: false, source: source, label: String(f.RimDiameter), diameter: String(f.RimDiameter), width: f.RimWidth });
    }
  }
  (vehicleData.Fitments || []).forEach(function(f) { addRow(f, 'oe'); });
  (vehicleData.OptionalFitments || []).forEach(function(f) { addRow(f, 'optional'); });
  (vehicleData.PlusSizes || []).forEach(function(f) { addRow(f, 'plus'); });
  return result;
}

// All three arrays tagged by source
function getAllWheelSizes(vehicleData) {
  if (!vehicleData) return [];
  var out = [];
  (vehicleData.Fitments || []).forEach(function(f) {
    out.push({ source: 'oe', staggered: f.RimDiameterRear != null, row: f });
  });
  (vehicleData.OptionalFitments || []).forEach(function(f) {
    out.push({ source: 'optional', staggered: f.RimDiameterRear != null, row: f });
  });
  (vehicleData.PlusSizes || []).forEach(function(f) {
    out.push({ source: 'plus', staggered: false, row: f });
  });
  return out;
}

// ── Staggered size ranges ────────────────────────────────────────────────────
// Returns min/max diameter and width for front and rear axles, gathered from
// OE Fitments, OptionalFitments, and PlusSizes (split by Type F/R).
// Used as a fast pre-filter before the expensive row-by-row fitment check.

// Builds a comma-separated f-sizes string (e.g. "19x8.5,19x9.0,19x9.5,...")
// for the given axle ('front' or 'rear'). Each OE/plus size generates ±0.5"
// neighbours so the API returns wheels one step above and below each listed size.
function buildStaggeredSizes(vehicleData, axle) {
  if (!vehicleData) return '';
  var pairs = {};
  (vehicleData.Fitments || []).concat(vehicleData.OptionalFitments || []).forEach(function(f) {
    var d = axle === 'front' ? f.RimDiameter    : f.RimDiameterRear;
    var w = axle === 'front' ? f.RimWidth       : f.RimWidthRear;
    if (d && w) pairs[d + 'x' + w] = { d: d, w: w };
  });
  (vehicleData.PlusSizes || []).forEach(function(f) {
    if ((axle === 'front' && f.Type === 'F') || (axle === 'rear' && f.Type === 'R')) {
      if (f.RimDiameter && f.RimWidth) pairs[f.RimDiameter + 'x' + f.RimWidth] = { d: f.RimDiameter, w: f.RimWidth };
    }
  });
  var sizes = {};
  Object.keys(pairs).forEach(function(key) {
    var p = pairs[key];
    [-0.5, 0, 0.5].forEach(function(delta) {
      var w = Math.round((p.w + delta) * 10) / 10;
      if (w > 0) sizes[p.d + 'x' + w] = true;
    });
  });
  return Object.keys(sizes).sort(function(a, b) {
    var pa = a.split('x'), pb = b.split('x');
    var dd = Number(pa[0]) - Number(pb[0]);
    return dd !== 0 ? dd : Number(pa[1]) - Number(pb[1]);
  }).join(',');
}

function getStaggeredSizeRanges(vehicleData) {
  if (!vehicleData) return null;
  var frontDiams = [], frontWidths = [], rearDiams = [], rearWidths = [];
  (vehicleData.Fitments || []).concat(vehicleData.OptionalFitments || []).forEach(function(f) {
    if (f.RimDiameter)     { frontDiams.push(f.RimDiameter);    }
    if (f.RimWidth)        { frontWidths.push(f.RimWidth);       }
    if (f.RimDiameterRear) { rearDiams.push(f.RimDiameterRear); }
    if (f.RimWidthRear)    { rearWidths.push(f.RimWidthRear);    }
  });
  (vehicleData.PlusSizes || []).forEach(function(f) {
    if (f.Type === 'F') {
      if (f.RimDiameter) frontDiams.push(f.RimDiameter);
      if (f.RimWidth)    frontWidths.push(f.RimWidth);
    } else if (f.Type === 'R') {
      if (f.RimDiameter) rearDiams.push(f.RimDiameter);
      if (f.RimWidth)    rearWidths.push(f.RimWidth);
    }
  });
  if (!frontDiams.length || !rearDiams.length) return null;
  return {
    front: {
      minDiameter: Math.min.apply(null, frontDiams),
      maxDiameter: Math.max.apply(null, frontDiams),
      minWidth: frontWidths.length ? Math.min.apply(null, frontWidths) : null,
      maxWidth: frontWidths.length ? Math.max.apply(null, frontWidths) : null
    },
    rear: {
      minDiameter: Math.min.apply(null, rearDiams),
      maxDiameter: Math.max.apply(null, rearDiams),
      minWidth: rearWidths.length ? Math.min.apply(null, rearWidths) : null,
      maxWidth: rearWidths.length ? Math.max.apply(null, rearWidths) : null
    }
  };
}

// ── Wheel PLP filtering ──────────────────────────────────────────────────────

function filterWheelsByVehicle(wheels, vehicleData) {
  if (!vehicleData) return wheels;
  var vehicleType = vehicleData.Type || null;
  var isStaggered = hasStaggeredFitment(vehicleData);
  var rows = isStaggered ? null : extractFrontFitments(vehicleData);
  var ranges = isStaggered ? getStaggeredSizeRanges(vehicleData) : null;
  return wheels.filter(function(wheel) {
    if (vehicleType && wheel.vehicleTypeTags && wheel.vehicleTypeTags.length > 0) {
      if (!wheel.vehicleTypeTags.includes(vehicleType)) return false;
    }
    if (isStaggered) {
      if (ranges) {
        var wDiam  = Number(wheel.diameter);
        var wWidth = wheel.width ? Number(wheel.width) : null;
        var inFrontRange = wDiam >= ranges.front.minDiameter && wDiam <= ranges.front.maxDiameter
          && (!wWidth || !ranges.front.minWidth || (wWidth >= ranges.front.minWidth && wWidth <= ranges.front.maxWidth));
        var inRearRange  = wDiam >= ranges.rear.minDiameter  && wDiam <= ranges.rear.maxDiameter
          && (!wWidth || !ranges.rear.minWidth  || (wWidth >= ranges.rear.minWidth  && wWidth <= ranges.rear.maxWidth));
        if (!inFrontRange && !inRearRange) return false;
      }
      var r = checkWheelFitmentStaggered(wheel, vehicleData);
      return r.frontFits || r.rearFits;
    }
    return checkWheelFitment(wheel, rows).fits;
  });
}

// ── Tire size normalization ──────────────────────────────────────────────────
// Returns null if the string can't be parsed.
// Standard:  265/70R18   → { type:'standard',  width:265, aspect:70, rim:18 }
// Flotation: 33X12.5R22  → { type:'flotation', outerDiameter:33, width:12.5, rim:22 }

function normalizeTireSize(sizeString) {
  if (!sizeString) return null;
  var s = String(sizeString).trim().toUpperCase().replace(/\s+/g, '');
  s = s.replace(/^(LT|P|ST|C)/, '');
  s = s.replace(/(XL|SL|\/XL|BSW|OWL|RWL|VSB|BLK|LT|C|M\+S|M&S)$/, '');

  var flotMatch = s.match(/^(\d+(?:\.\d+)?)X(\d+(?:\.\d+)?)R(\d+)$/);
  if (flotMatch) {
    return {
      type: 'flotation',
      outerDiameter: parseFloat(flotMatch[1]),
      width: parseFloat(flotMatch[2]),
      rim: parseInt(flotMatch[3], 10)
    };
  }

  // Handles 265/70R18, 265/70ZR18, 265/70HR18, etc.
  var stdMatch = s.match(/^(\d{3})\/(\d{2,3})[A-Z]*R(\d+)$/);
  if (stdMatch) {
    return {
      type: 'standard',
      width: parseInt(stdMatch[1], 10),
      aspect: parseInt(stdMatch[2], 10),
      rim: parseInt(stdMatch[3], 10)
    };
  }

  return null;
}

function tireSizesMatch(size1, size2) {
  var a = normalizeTireSize(size1);
  var b = normalizeTireSize(size2);
  if (!a || !b || a.type !== b.type || a.rim !== b.rim) return false;
  if (a.type === 'standard') return a.width === b.width && a.aspect === b.aspect;
  return a.outerDiameter === b.outerDiameter && Math.abs(a.width - b.width) < 0.1;
}

// ── Tire size extraction from vehicle data ───────────────────────────────────

function _buildTireSizeStr(width, aspect, rim) {
  if (!width || !rim) return null;
  return aspect ? (width + '/' + aspect + 'R' + rim) : (width + 'R' + rim);
}

function getOETireSizesFromVehicle(vehicleData) {
  if (!vehicleData) return [];
  var sizes = [], seen = {};
  function add(s) { if (s && !seen[s]) { seen[s] = true; sizes.push(s); } }
  (vehicleData.Fitments || []).forEach(function(f) {
    // API returns TireSize ("265/60R18") and/or SectionWidth+AspectRatio+RimDiameter
    add(f.TireSize || _buildTireSizeStr(f.SectionWidth, f.AspectRatio, f.RimDiameter));
    if (f.TireSizeRear) add(f.TireSizeRear);
    else if (f.SectionWidthRear) add(_buildTireSizeStr(f.SectionWidthRear, f.AspectRatioRear, f.RimDiameterRear));
  });
  return sizes;
}

function getAllTireSizes(vehicleData) {
  if (!vehicleData) return [];
  var out = [], seen = {};
  function add(s, src, pos) {
    if (!s) return;
    if (!seen[s]) {
      seen[s] = true;
      out.push({ size: s, source: src, position: pos || null });
    } else {
      // Size used by both axles → clear positional label
      var existing = out.find(function(o) { return o.size === s; });
      if (existing && existing.position && existing.position !== pos) existing.position = null;
    }
  }
  (vehicleData.Fitments || []).forEach(function(f) {
    var front = f.TireSize || _buildTireSizeStr(f.SectionWidth, f.AspectRatio, f.RimDiameter);
    var rear = f.TireSizeRear || (f.SectionWidthRear ? _buildTireSizeStr(f.SectionWidthRear, f.AspectRatioRear, f.RimDiameterRear) : null);
    if (rear && rear !== front) { add(front, 'oe', 'front'); add(rear, 'oe', 'rear'); }
    else { add(front, 'oe', null); if (rear) add(rear, 'oe', null); }
  });
  (vehicleData.OptionalFitments || []).forEach(function(f) {
    var front = f.TireSize || _buildTireSizeStr(f.SectionWidth, f.AspectRatio, f.RimDiameter);
    var rear = f.TireSizeRear || (f.SectionWidthRear ? _buildTireSizeStr(f.SectionWidthRear, f.AspectRatioRear, f.RimDiameterRear) : null);
    if (rear && rear !== front) { add(front, 'optional', 'front'); add(rear, 'optional', 'rear'); }
    else { add(front, 'optional', null); if (rear) add(rear, 'optional', null); }
  });
  (vehicleData.PlusSizes || []).forEach(function(f) {
    var pos = f.Type === 'F' ? 'front' : f.Type === 'R' ? 'rear' : null;
    add(f.TireSize || _buildTireSizeStr(f.SectionWidth, f.AspectRatio, f.RimDiameter), 'plus', pos);
  });
  return out;
}

// For tires sidebar: labeled entries mirroring getAllLabeledWheelSizes.
// Staggered vehicle: { staggered:true, source, label:'245/35R19 F / 305/30R20 R', sizeKey:'245/35R19,305/30R20', front:{size,diameter}, rear:{size,diameter} }
// Non-staggered:    { staggered:false, source, label:'245/35R19', size:'245/35R19', diameter:'19' }
function getAllLabeledTireSizes(vehicleData) {
  if (!vehicleData) return [];
  var isStag = vehicleData.Staggered === true;
  var seen = {};
  var result = [];
  function addPair(frontStr, rearStr, source) {
    if (!frontStr) return;
    if (isStag && rearStr && rearStr !== frontStr) {
      var key = frontStr + '|' + rearStr;
      if (seen[key]) return;
      seen[key] = true;
      var fP = normalizeTireSize(frontStr);
      var rP = normalizeTireSize(rearStr);
      result.push({ staggered: true, source: source, label: frontStr + ' F / ' + rearStr + ' R',
        sizeKey: frontStr + ',' + rearStr,
        front: { size: frontStr, diameter: fP ? String(fP.rim) : null },
        rear: { size: rearStr, diameter: rP ? String(rP.rim) : null } });
    } else {
      if (!seen[frontStr]) {
        seen[frontStr] = true;
        var p = normalizeTireSize(frontStr);
        result.push({ staggered: false, source: source, label: frontStr, size: frontStr, diameter: p ? String(p.rim) : null });
      }
      if (rearStr && rearStr !== frontStr && !seen[rearStr]) {
        seen[rearStr] = true;
        var p2 = normalizeTireSize(rearStr);
        result.push({ staggered: false, source: source, label: rearStr, size: rearStr, diameter: p2 ? String(p2.rim) : null });
      }
    }
  }
  (vehicleData.Fitments || []).forEach(function(f) {
    var front = f.TireSize || _buildTireSizeStr(f.SectionWidth, f.AspectRatio, f.RimDiameter);
    var rear = f.TireSizeRear || (f.SectionWidthRear ? _buildTireSizeStr(f.SectionWidthRear, f.AspectRatioRear, f.RimDiameterRear) : null);
    addPair(front, rear, 'oe');
  });
  (vehicleData.OptionalFitments || []).forEach(function(f) {
    var front = f.TireSize || _buildTireSizeStr(f.SectionWidth, f.AspectRatio, f.RimDiameter);
    var rear = f.TireSizeRear || (f.SectionWidthRear ? _buildTireSizeStr(f.SectionWidthRear, f.AspectRatioRear, f.RimDiameterRear) : null);
    addPair(front, rear, 'optional');
  });
  if (isStag) {
    var pF = (vehicleData.PlusSizes || []).filter(function(f) { return f.Type === 'F'; });
    var pR = (vehicleData.PlusSizes || []).filter(function(f) { return f.Type === 'R'; });
    var n = Math.min(pF.length, pR.length);
    for (var i = 0; i < n; i++) {
      addPair(
        pF[i].TireSize || _buildTireSizeStr(pF[i].SectionWidth, pF[i].AspectRatio, pF[i].RimDiameter),
        pR[i].TireSize || _buildTireSizeStr(pR[i].SectionWidth, pR[i].AspectRatio, pR[i].RimDiameter),
        'plus');
    }
  } else {
    (vehicleData.PlusSizes || []).forEach(function(f) {
      addPair(f.TireSize || _buildTireSizeStr(f.SectionWidth, f.AspectRatio, f.RimDiameter), null, 'plus');
    });
  }
  return result;
}

// ── Tire model / variant filtering ──────────────────────────────────────────

function filterTireModelsByVehicle(tireModels, vehicleData) {
  var allSizes = getAllTireSizes(vehicleData).map(function(s) { return s.size; });
  if (!allSizes.length) return tireModels;
  return tireModels.filter(function(model) {
    var names = model.DisplayNames || model.displayNames || [];
    return names.some(function(name) {
      return allSizes.some(function(sz) { return tireSizesMatch(name, sz); });
    });
  });
}

function filterTireVariantsByVehicle(variants, vehicleData) {
  var allSizes = getAllTireSizes(vehicleData).map(function(s) { return s.size; });
  if (!allSizes.length) return variants;
  return variants.filter(function(v) {
    var sz = v.Size || v.size || _buildTireSizeStr(v.TireWidth || v.Width, v.TireAspect || v.Aspect, v.TireRim || v.Rim);
    return allSizes.some(function(asz) { return tireSizesMatch(sz, asz); });
  });
}

// ── Cross-sell helpers ───────────────────────────────────────────────────────

function getRimDiameterFromTireSize(tireSize) {
  var n = normalizeTireSize(tireSize);
  return n ? n.rim : null;
}

function getTireSizesForWheelDiameter(vehicleData, diameter) {
  return getAllTireSizes(vehicleData)
    .filter(function(entry) {
      var n = normalizeTireSize(entry.size);
      return n && n.rim === Number(diameter);
    })
    .map(function(entry) { return entry.size; });
}

// ── Tire speed rating ────────────────────────────────────────────────────────
// Order from lowest to highest (H sits between U and V — not alphabetical).
var TIRE_SPEED_RATING_ORDER = ['A1','A2','A3','A4','A5','A6','A8','B','C','D','E','F','G','J','K','L','M','N','P','Q','R','S','T','U','H','V','W','Y'];

// Returns the lowest SpeedRating letter across all fitment arrays (OE + Optional + Plus).
// Both front and rear speed ratings are considered for staggered fitments.
function getMinSpeedRating(vehicleData) {
  if (!vehicleData) return null;
  var allRows = (vehicleData.Fitments || []).concat(vehicleData.OptionalFitments || []).concat(vehicleData.PlusSizes || []);
  var minIdx = Infinity;
  var minRating = null;
  allRows.forEach(function(row) {
    [row.SpeedRating, row.SpeedRatingRear].forEach(function(r) {
      if (!r) return;
      var idx = TIRE_SPEED_RATING_ORDER.indexOf(r);
      if (idx !== -1 && idx < minIdx) { minIdx = idx; minRating = r; }
    });
  });
  return minRating;
}

// Builds the f-sizes list for the wheels API — enumerates all valid diameter×width
// combinations from vehicle fitment data (OE + Optional + Plus) in 0.5" steps.
// This matches the VVSE approach which passes f-sizes instead of just f-diameters.
function buildWheelFitmentSizes(vehicleData) {
  if (!vehicleData) return [];
  var allRows = [];
  (vehicleData.Fitments || []).forEach(function(f) { allRows.push(f); });
  (vehicleData.OptionalFitments || []).forEach(function(f) { allRows.push(f); });
  (vehicleData.PlusSizes || []).forEach(function(f) { allRows.push(f); });

  var seen = {};
  var sizes = [];

  function addSize(diam, width) {
    var w = Math.round(width * 10) / 10; // avoid floating point drift
    var key = diam + 'x' + w;
    if (!seen[key]) { seen[key] = true; sizes.push(key); }
  }

  function enumerateRow(diam, widthMin, widthMax) {
    if (!diam || widthMin == null || widthMax == null) return;
    var d = Number(diam);
    var wMin = Number(widthMin);
    var wMax = Number(widthMax);
    if (!d || isNaN(wMin) || isNaN(wMax)) return;
    var steps = Math.round((wMax - wMin) / 0.5);
    for (var i = 0; i <= steps; i++) {
      addSize(d, wMin + i * 0.5);
    }
  }

  allRows.forEach(function(row) {
    // Front / non-staggered
    var wMin = row.RimWidthMin != null ? row.RimWidthMin : row.RimWidth;
    var wMax = row.RimWidthMax != null ? row.RimWidthMax : row.RimWidth;
    enumerateRow(row.RimDiameter, wMin, wMax);
    // Rear (staggered)
    if (row.RimDiameterRear != null) {
      var wMinR = row.RimWidthMinRear != null ? row.RimWidthMinRear : row.RimWidthRear;
      var wMaxR = row.RimWidthMaxRear != null ? row.RimWidthMaxRear : row.RimWidthRear;
      enumerateRow(row.RimDiameterRear, wMinR, wMaxR);
    }
  });

  return sizes;
}
