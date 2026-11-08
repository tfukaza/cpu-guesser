"""Refresh the discovery snapshot and verify candidates against Commons' original file metadata.
No descriptions or marketing copy from the discovery catalog are imported.
"""
import datetime, hashlib, html, json, re, sys, time, urllib.parse, urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'data/research'
OUT.mkdir(exist_ok=True)
URL = 'https://sheets.works/data-viz/cpu-dies'
def fetch(url):
    req = urllib.request.Request(url, headers={'User-Agent': 'CPU-Guesser/0.2 (educational photo attribution research)'})
    with urllib.request.urlopen(req, timeout=90) as r: return r.read()
page = fetch(URL)
rows = json.loads(re.search(r'const C=(\[.*?\]);', page.decode()).group(1))
# Consumer, workstation, server and console CPU makers, including major historical vendors.
MAKERS = {'Intel','AMD','Motorola','MOS Technology','Zilog','HP','DEC','IBM','Apple','NVIDIA','Broadcom','NEC','Texas Instruments','Cyrix','Sun','IDT','Fujitsu','VIA','ARM / VLSI','MIPS','MIPS / IDT','MIPS / NEC','NEC / QED','Freescale','NXP','National Semiconductor','Western Digital','Western Design Center','WDC / Rockwell','Rockwell','Ricoh','Nintendo','Nintendo / Sharp','Nintendo / Sony','Sony / LSI','AMD / Microsoft','AMD / Sony','AMD / Valve','Texas Instruments / Sun','Fujitsu / Sun','Cypress / Sun','IDT / Centaur','Centaur / VIA','Commodore (CSG)','Sharp','STMicroelectronics','Atmel','Philips','NexGen','Signetics','Mostek / Fairchild','Fairchild','RCA','Inmos','LSI Logic','QED','ST'}
def plain(value): return html.unescape(re.sub('<[^>]*>', '', value or '')).strip()
def verify(c):
    if not c['pg'].startswith('https://commons.wikimedia.org/wiki/File:'):
        return {'id':c['id'],'reason':'Original host requires separate license verification','sourceUrl':c['pg']}
    title = urllib.parse.unquote(c['pg'].split('/wiki/')[1])
    params = {'action':'query','format':'json','prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':3840,'titles':title}
    try:
        p = primary[title.replace('_', ' ')]
        result = {'query': {'pages': {str(p['pageid']):p}}}
        info = p['imageinfo'][0]; meta = info['extmetadata']
        lic = plain(meta.get('LicenseShortName',{}).get('value'))
        license_url = meta.get('LicenseUrl',{}).get('value','')
        if lic == 'Public domain' and not license_url: license_url = 'https://creativecommons.org/publicdomain/mark/1.0/'
        if not (re.fullmatch(r'CC BY(?:-SA)? [\d.]+', lic) or lic in ('CC0','Public domain')):
            raise ValueError('Unsupported license: '+lic)
        author = plain(meta.get('Artist',{}).get('value'))
        if not author or not license_url: raise ValueError('Missing author or license URL')
        url = info.get('thumburl',info['url']).split('?')[0]
        # CPU-only game: exclude I/O-only chiplets and visibly annotated artwork.
        exclusion = None
        if re.search(r'I/O die|Coprocessor|S-SMP|S-APU|peripheral interface|ATWINC|TM-1100',c['n'],re.I): exclusion = 'Not a standalone CPU die'
        if re.search(r'layout|annotat',title,re.I): exclusion = 'Annotated artwork, unsuitable for mystery crops'
        desc = plain(meta.get('ImageDescription',{}).get('value'))
        return {'id':c['id'],'name':c['n'],'maker':c['m'],'year':c['y'],
            'yearSource':URL,'yearNote':'Introduction year from discovery catalog; not independently verified for this mask.',
            'widthMm':c.get('w'),'heightMm':c.get('h'),'dimensionsSource':URL,
            'photographer':author,'sourceUrl':info['descriptionurl'],'imageUrl':url,
            'originalImageUrl':info['url'].split('?')[0], 'license':lic,'licenseUrl':license_url,
            'sourceWidth':info['width'],'sourceHeight':info['height'],
            'specimenDescription':desc,'credit':plain(meta.get('Credit',{}).get('value')),
            'attribution':plain(meta.get('Attribution',{}).get('value')),
            'restrictions':plain(meta.get('Restrictions',{}).get('value')),
            'exclusion':exclusion,'verifiedAt':p['_retrievedAt']}
    except Exception as e: return {'id':c['id'],'reason':str(e),'sourceUrl':c['pg']}
candidates = [c for c in rows if c['m'] in MAKERS]
primary = {}
cache = OUT/'commons-batches.json'
if cache.exists() and '--refresh' not in sys.argv:
    primary.update(json.loads(cache.read_text()))
    for p in primary.values(): p.setdefault('_retrievedAt', '2026-11-07')
titles = [urllib.parse.unquote(c['pg'].split('/wiki/')[1]).replace('_',' ') for c in candidates if c['pg'].startswith('https://commons.wikimedia.org/wiki/File:')]
missing = [t for t in titles if t not in primary]
for offset in range(0,len(missing),40):
    batch = missing[offset:offset+40]
    params = {'action':'query','format':'json','prop':'imageinfo','iiprop':'url|size|extmetadata','iiurlwidth':3840,'titles':'|'.join(batch)}
    for attempt in range(4):
        try:
            response = json.loads(fetch('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(params)))
            for p in response['query']['pages'].values():
                p['_retrievedAt'] = str(datetime.date.today())
                primary[p['title']] = p
            cache.write_text(json.dumps(primary,ensure_ascii=False,indent=2)+'\n')
            print(f'Cached {len(primary)} original file records',flush=True)
            break
        except Exception as error:
            if attempt==3: raise
            print(f'Backing off after {error}',flush=True)
            time.sleep(15*(attempt+1))
    time.sleep(2)
cache.write_text(json.dumps(primary,ensure_ascii=False,indent=2)+'\n')
results = list(map(verify,candidates))
verified=[r for r in results if 'license' in r]
rejected=[r for r in results if 'reason' in r]
(OUT/'commons-cpus.json').write_text(json.dumps(verified,ensure_ascii=False,indent=2)+'\n')
(OUT/'pending-cpus.json').write_text(json.dumps(rejected,ensure_ascii=False,indent=2)+'\n')
(OUT/'discovery.json').write_text(json.dumps({'source':URL,'retrievedAt':str(datetime.date.today()),'sha256':hashlib.sha256(page).hexdigest(),'candidates':len(candidates),'verified':len(verified),'pending':len(rejected)},indent=2)+'\n')
print(f'{len(candidates)} candidates; {len(verified)} primary license records; {len(rejected)} pending',flush=True)
