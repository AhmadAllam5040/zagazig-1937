"""Cut zagazig_1937.jpg into XYZ webp tiles aligned to web mercator. Run: python3 build_tiles.py"""
import math, os, shutil
from PIL import Image
Image.MAX_IMAGE_PIXELS = None
S, TX, TY = 0.22799008487286912, 533.36274784, 638.09897932   # z16 mosaic px per scan px; scan origin (0,0) in mosaic px
CROP = (480, 500, 10170, 7150)                                 # inside the neatline
MX0, MY0 = 38496*256, 26909*256                                # world px (z16) of mosaic origin
src = Image.open('zagazig_1937.jpg').convert('RGB').crop(CROP).convert('RGBA')
ox, oy = CROP[0], CROP[1]
pyr = [src]
while pyr[-1].width > 600: pyr.append(pyr[-1].resize((pyr[-1].width//2, pyr[-1].height//2), Image.LANCZOS))
shutil.rmtree('docs/tiles', ignore_errors=True)
n = 0
for z in range(12, 19):
    f = 2**(16-z); A = f/S                                        # scan px per tile px
    L = min(max(int(math.log2(A)), 0), len(pyr)-1); k = 2**L
    # tile px (i,j) of tile (x,y) -> world px wx -> scan px X
    def scan(wx, wy): return ((wx/2**(z-16)-MX0-TX)/S-ox, (wy/2**(z-16)-MY0-TY)/S-oy)
    # tile range covering crop corners
    def world(X, Y): return ((S*(X+ox)+TX+MX0)*2**(z-16), (S*(Y+oy)+TY+MY0)*2**(z-16))
    (wx0, wy0), (wx1, wy1) = world(0, 0), world(src.width, src.height)
    for tx in range(int(wx0//256), int(wx1//256)+1):
        for ty in range(int(wy0//256), int(wy1//256)+1):
            X0, Y0 = scan(tx*256, ty*256)
            t = pyr[L].transform((256, 256), Image.AFFINE, (A/k, 0, X0/k, 0, A/k, Y0/k), Image.BICUBIC)
            if t.getchannel('A').getextrema()[1] == 0: continue
            os.makedirs(f'docs/tiles/{z}/{tx}', exist_ok=True); t.save(f'docs/tiles/{z}/{tx}/{ty}.webp', quality=85); n += 1
    print('z', z, n, flush=True)
