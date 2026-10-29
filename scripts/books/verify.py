"""Check narration timing, asset integrity and parity of both book builds.

Run after build.py; this deliberately uses only Python's standard library.
Browser layout, playback and interaction checks are recorded in docs/books-audit.md.
"""
import base64
import hashlib
import json
import re
from pathlib import Path
from urllib.parse import urlsplit, parse_qs

ROOT = Path(__file__).resolve().parent
WEB = ROOT.parents[1] / 'public' / 'books'


def load_constants(path):
    source = path.read_text(encoding='utf-8')
    assert not re.search(r'__(?:ASSETS|CLIPS|TEXT|TIMINGS|PLAYBACK|READER_\w+)__', source), path
    return source, {key: json.loads(re.search(r'const ' + key + r'=(.*);\n', source)[1])
                    for key in ['ASSETS', 'CLIPS', 'TEXT', 'TIMINGS']}


def normalized(text):
    return ''.join(char for char in text if char.isalnum())


def main():
    content = json.loads((ROOT / 'content.json').read_text(encoding='utf-8'))
    manifest = json.loads((ROOT / 'audio-manifest.json').read_text(encoding='utf-8'))
    online_source, online = load_constants(WEB / 'rice.html')
    offline_source, offline = load_constants(WEB / 'rice-offline.html')
    assert online['TEXT'] == offline['TEXT'] == content
    assert online['TIMINGS'] == offline['TIMINGS']
    total_words = 0
    for key, text in content.items():
        clip = manifest[key]
        audio = (WEB / 'audio' / (key + '.mp3')).read_bytes()
        assert clip['text'] == text, key
        assert hashlib.sha256(audio).hexdigest() == clip['audio_sha256'], key
        assert online['TIMINGS'][key] == clip['words'], key
        previous_end, previous_to = 0, 0
        covered = set()
        for word in clip['words']:
            assert 0 <= word['start'] < word['end'] <= clip['duration'] + .06, (key, word)
            assert word['start'] >= previous_end - .001, (key, 'time overlap')
            assert previous_to <= word['from'] < word['to'] <= len(text), (key, 'position overlap')
            assert normalized(text[word['from']:word['to']]) == normalized(word['text']), (key, word)
            covered.update(range(word['from'], word['to']))
            previous_end, previous_to = word['end'], word['to']
        assert all(i in covered for i, char in enumerate(text) if char.isalnum()), (key, 'missing word')
        total_words += len(clip['words'])

    asset_bytes = {}
    for kind in ['ASSETS', 'CLIPS']:
        assert online[kind].keys() == offline[kind].keys()
        for key, url in online[kind].items():
            parsed = urlsplit(url)
            assert not parsed.scheme and parsed.path.startswith('./'), (key, url)
            path = WEB / parsed.path[2:]
            raw = path.read_bytes()
            assert parse_qs(parsed.query)['v'] == [hashlib.sha256(raw).hexdigest()[:12]], key
            embedded = offline[kind][key]
            assert embedded.startswith('data:') and ';base64,' in embedded, key
            assert base64.b64decode(embedded.split(',', 1)[1]) == raw, key
            if kind == 'ASSETS':
                asset_bytes[key] = len(raw)
    # The HTML and CSS must not fetch a font, script or image outside the embedded maps.
    for ref in re.findall(r'(?:src|href)="([^"]+)"|url\([\'"]?([^\)\'\"]+)', offline_source):
        url = next((part for part in ref if part), '')
        assert not url.startswith(('http:', 'https:', '//')), ('offline dependency', url)
    assert 'iframe' not in online_source.lower()
    assert not (WEB / 'ipad-preview.html').exists()
    for filename, start in [('rice.webmanifest', '/books/rice.html'), ('shelf.webmanifest', '/books')]:
        data = json.loads((WEB / filename).read_text(encoding='utf-8'))
        assert data['start_url'] == start and data['scope'] == '/books/'
        for icon in data['icons']:
            assert (WEB.parents[0] / icon['src'].lstrip('/')).is_file(), icon
    result = {'audio_clips': len(content), 'word_segments': total_words,
              'images': len(asset_bytes), 'online_bytes': (WEB / 'rice.html').stat().st_size,
              'offline_bytes': (WEB / 'rice-offline.html').stat().st_size,
              'first_page_image_bytes': asset_bytes['hero'],
              'deferred_image_bytes': sum(asset_bytes.values()) - asset_bytes['hero'],
              'checks': 'PASS'}
    print(json.dumps(result, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
