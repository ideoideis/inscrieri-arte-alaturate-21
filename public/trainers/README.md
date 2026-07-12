Trainer photos, named to match `photo` in src/data/workshops.ts:

  alex-gorghe.jpg        (+ -480.jpg / -720.jpg)
  eduard-chimac.jpg      (+ -480.jpg / -720.jpg)
  tudor-platon.jpg       (+ -480.jpg / -720.jpg)
  theodor-ionita.jpg     (+ -480.jpg / -720.jpg)
  teo-velescu.jpg        (+ -480.jpg / -720.jpg)
  steff-chelaru.jpg      (+ -480.jpg / -720.jpg)

Final #21 lineup: web-optimized (1200px tall JPEG ~78%) from the July 2026
Drive folder ("foto traineri arte al, B&W"). The -480/-720 variants feed the
responsive `srcset` (phones on mobile data download ~1/3 of the bytes).

To (re)generate the variants after replacing a photo:

  cd public/trainers
  for f in <name>; do
    sips --resampleWidth 480 -s format jpeg -s formatOptions 72 "$f.jpg" --out "$f-480.jpg"
    sips --resampleWidth 720 -s format jpeg -s formatOptions 74 "$f.jpg" --out "$f-720.jpg"
  done

If a file is missing, the card falls back to placeholder.svg automatically.
