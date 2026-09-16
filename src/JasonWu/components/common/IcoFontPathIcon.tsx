import React from "react";

export const ICOFONT_GLYPHS = [
  {name: "chat", path: "M937 633c0 11 0 23-3 34-14 62-64 101-129 101-204 0-408 0-612 0-75 0-130-56-130-131-1-133-1-265 0-398 0-11 1-22 3-32 14-59 63-99 124-100 25 0 50 0 78 0-4-19-7-36-12-52-10-35-23-68-46-97-10-13-5-24 11-25 11-1 24-1 34 3 40 18 79 37 117 58 45 25 74 67 108 104 6 6 11 9 20 9 103 0 206-1 308 0 75 1 129 57 130 131 0 132 0 263-1 395z"},
  {name: "comment", path: "M935 736c-4 25-16 37-41 39-11 0-22 1-33 1-242 0-484 0-726 0-13 0-26-1-39-4-18-3-27-16-31-33-1-10-3-19-3-29v-491c0-8 1-16 2-23 5-29 16-40 45-40 55-1 110-1 166-2h18v-203c0-9-1-20 10-25 11-5 18 2 26 9 77 71 154 141 232 212 5 4 13 7 20 7 96 1 191 0 287 1 13 0 26 1 39 3 16 3 25 14 28 30 1 10 2 20 2 30v493c1 8 0 17-2 25z m-734-237h298v-68h-298v68z m483-206h-483v68h483v-68z m115 277h-598v67h598v-67z"},
  {name: "reply", path: "M399 541v159c0 10-6 13-13 5l-318-318c-7-7-7-19 0-26l318-318c7-7 13-5 13 5v164c0 11 9 19 19 19 229-4 392-78 511-236 7-8 10-6 8 4-52 235-196 466-519 520-10 2-19 11-19 22z"},
  {name: "send-mail", path: "M915 547h-489c-16 0-31-13-34-28l-70-338c-3-16 7-28 23-28h489c15 0 30 12 33 28l70 338c3 15-7 28-22 28z m-59-113l-217-105c-9-4-20-4-27 0l-174 105c-13 7-15 25-4 39 7 10 18 16 29 16 5 0 9-2 13-4l162-97 201 97c5 2 10 4 15 4 11 0 19-6 22-16 5-14-4-32-20-39z m-717 39h211c11 0 20 9 20 20s-9 20-20 20h-211c-11 0-20-9-20-20 0-11 9-20 20-20z m154-143h-210c-11 0-20-9-20-20s9-21 20-21h210c12 0 21 9 21 21s-9 20-21 20z m49 73c0 11-9 20-20 20h-126c-11 0-20-9-20-20 0-11 9-21 20-21h126c11 0 20 9 20 21z"},
  {name: "signal", path: "M747 727v-754c0-33 27-61 60-61h25c34 0 61 27 61 61v754c0 33-27 61-61 61h-25c-33 0-60-27-60-61z m-152-814h25c33 0 60 27 60 60v607c0 33-27 60-60 60h-25c-34 0-61-27-61-60v-607c0-33 27-60 61-60z m-214-1h26c33 0 61 27 61 61v459c0 33-27 60-61 60h-26c-33 0-61-27-61-60v-459c0-34 28-61 61-61z m-212 1h24c33 0 61 27 61 60v312c0 33-27 60-61 60h-24c-34 0-61-27-61-60v-312c0-33 27-60 61-60z"},
  {name: "share", path: "M752 251c-58 0-110-29-140-74l-214 119c12 23 19 50 19 78 0 28-7 54-19 77l163 71c31-44 82-73 139-73 94 0 170 76 170 169s-76 170-170 170-169-76-169-170c0-19 3-37 9-55l-169-73c-31 33-75 54-123 54-94 0-170-76-170-170 0-93 76-169 170-169 48 0 91 20 122 53l221-123c-5-16-8-34-8-53 0-94 76-169 169-169s169 76 169 169-75 169-169 169z"},
  {name: "paper-plane", path: "M923 627c-281-59-559-117-839-176-14-3-23-7-21-8 1-2 2-3 4-4 62-48 124-96 187-145 5-4 7-8 7-15 0-66 0-132 0-197v-7c0-4 9-1 20 7 41 26 110 72 150 98 46-32 91-65 137-98 11-8 26-5 34 7 110 174 221 347 332 522 8 12 3 19-11 16z m-97-75c-7-4-13-8-20-13-140-89-280-178-419-268-7-4-12-9-16-16-23-38-45-76-67-114-1-2-2-3-3-4-2-3-3 6-3 20v76c0 20 0 40 0 60 0 7 2 10 8 13 77 37 153 74 230 112 100 48 200 97 300 145 1 1 3 1 5 2 2 0-4-6-15-13z"},
  {name: "plus-circle", path: "M500 788c-242 0-437-196-437-438 0-242 195-438 437-438 242 0 438 196 438 438 0 242-196 438-438 438z m302-467c-1-9-2-19-5-30h-238v-238c-11-3-21-4-31-5-10-1-20-1-30-1-9 0-18 0-27 1-9 1-19 2-30 5v238h-238c-2 11-4 21-5 31-1 10-1 20-1 30 0 9 0 18 1 27 1 9 3 19 5 30h238v238c11 2 21 4 31 5 10 1 20 1 30 1 9 0 18 0 27-1 9-1 19-3 30-5v-238h238c3-11 4-21 5-31 1-10 1-20 1-30 0-9 0-18-1-27z"},
] as const;

export const stableIconIndex = (seed: string, length = ICOFONT_GLYPHS.length) => {
  const safeLength = Math.max(1, length);
  let hash = 0;
  for (let index = 0; index < seed.length; index++) hash = (hash * 31 + seed.charCodeAt(index)) | 0;
  return Math.abs(hash) % safeLength;
};

export const pickIcoFontGlyph = ({seed, usedNames, fallbackIndex = 0}: {seed?: string; usedNames?: Set<string>; fallbackIndex?: number}) => {
  const start = seed ? stableIconIndex(seed, ICOFONT_GLYPHS.length) : Math.abs(fallbackIndex) % ICOFONT_GLYPHS.length;
  for (let offset = 0; offset < ICOFONT_GLYPHS.length; offset++) {
    const glyph = ICOFONT_GLYPHS[(start + offset) % ICOFONT_GLYPHS.length];
    if (!usedNames?.has(glyph.name)) {
      usedNames?.add(glyph.name);
      return glyph;
    }
  }
  const glyph = ICOFONT_GLYPHS[start];
  usedNames?.add(glyph.name);
  return glyph;
};

export const IcoFontPathIcon: React.FC<{seed?: string; color: string; size?: number; usedNames?: Set<string>; fallbackIndex?: number}> = ({seed = "", color, size = 29, usedNames, fallbackIndex = 0}) => {
  const icon = pickIcoFontGlyph({seed, usedNames, fallbackIndex});
  return (
    <svg width={size} height={size} viewBox="0 0 1000 1000" aria-hidden="true" style={{filter: `drop-shadow(0 0 8px ${color})`}} data-icofont-name={icon.name}>
      <g transform="translate(0 850) scale(1 -1)">
        <path d={icon.path} fill={color} />
      </g>
    </svg>
  );
};
